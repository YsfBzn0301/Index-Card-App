import * as Speech from 'expo-speech';

// Text-to-speech in the app language. Passing only `language` lets some devices silently fall back to
// their default voice, so an installed voice for the language is picked explicitly when one exists.

type SpeakOptions = Omit<Speech.SpeechOptions, 'language' | 'voice'>;

let cachedVoices: Speech.Voice[] | undefined;

function normalizeLanguage(value: string) {
  return value.replace('_', '-').toLowerCase();
}

async function loadVoices() {
  if (cachedVoices && cachedVoices.length > 0) {
    return cachedVoices;
  }

  try {
    cachedVoices = await Speech.getAvailableVoicesAsync();
  } catch {
    cachedVoices = [];
  }

  return cachedVoices;
}

export type SpeakResult = 'spoken' | 'voice-missing';

export function stopSpeaking() {
  Speech.stop().catch(() => undefined);
}

export async function speakInLanguage(text: string, languageCode: string, options: SpeakOptions = {}): Promise<SpeakResult> {
  const voices = await loadVoices();
  const wanted = normalizeLanguage(languageCode);
  const primary = wanted.split('-')[0];
  const voice =
    voices.find((candidate) => normalizeLanguage(candidate.language) === wanted) ??
    voices.find((candidate) => normalizeLanguage(candidate.language).split('-')[0] === primary);

  // An empty voice list means the device could not tell us, so speaking is still attempted.
  if (voices.length > 0 && !voice) {
    return 'voice-missing';
  }

  await Speech.stop();
  // Android can drop an utterance that starts right after stop(), so give the engine a moment.
  await new Promise((resolve) => setTimeout(resolve, 80));
  Speech.speak(text, {
    rate: 0.9,
    pitch: 1,
    volume: 1,
    ...options,
    language: languageCode,
    ...(voice ? { voice: voice.identifier } : {}),
  });

  return 'spoken';
}
