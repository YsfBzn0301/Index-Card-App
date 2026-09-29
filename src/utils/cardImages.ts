import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Deck } from '../types/flashcards';

// Picked images live in a temporary/content URI, so they are copied into the app's document
// directory (the counterpart of Android's filesDir) to stay readable after the picker forgets them.
// Created lazily so a missing native module cannot crash the app at import time.
function getImageDirectory() {
  return new Directory(Paths.document, 'card-images');
}

function extensionOf(asset: ImagePicker.ImagePickerAsset) {
  const name = asset.fileName ?? asset.uri;
  const match = /\.([a-zA-Z0-9]{2,5})(?:\?.*)?$/.exec(name);
  return match ? match[1].toLowerCase() : 'jpg';
}

// Opens the system photo picker (no storage permission needed) and returns the persisted file URI.
export async function pickCardImage(): Promise<string | undefined> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, base64: Platform.OS === 'web' });

  if (result.canceled || !result.assets?.[0]) {
    return undefined;
  }

  const asset = result.assets[0];

  // expo-file-system does not exist on web, and blob URIs die with the tab, so the image is stored inline there.
  if (Platform.OS === 'web') {
    return asset.base64 ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` : asset.uri;
  }

  const imageDirectory = getImageDirectory();
  if (!imageDirectory.exists) {
    imageDirectory.create({ intermediates: true, idempotent: true });
  }

  const target = new File(imageDirectory, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensionOf(asset)}`);
  new File(asset.uri).copy(target);
  return target.uri;
}

export function deleteCardImage(uri?: string) {
  if (!uri) {
    return;
  }

  if (uri.startsWith('data:') || Platform.OS === 'web') {
    return;
  }

  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // A file that is already gone or unreadable needs no cleanup.
  }
}

export function deckImageUris(decks: Deck[]) {
  return decks.flatMap((deck) => deck.cards.flatMap((card) => [card.frontImageUri, card.backImageUri])).filter((uri): uri is string => !!uri);
}
