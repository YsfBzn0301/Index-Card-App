import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeckCard } from '../../components/DeckCard';
import { useLibrary } from '../../state/LibraryContext';
import { createTheme } from '../../theme/palette';

export default function DecksScreen() {
  const theme = createTheme(useColorScheme());
  const { decks, createDeck, addCard } = useLibrary();
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId);

  function saveDeck() {
    createDeck(title, subject);
    setTitle('');
    setSubject('');
    setIsDeckModalOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }

  function saveCard() {
    if (!selectedDeck || !front.trim() || !back.trim()) {
      return;
    }

    addCard(selectedDeck.id, front, back);
    setFront('');
    setBack('');
    setSelectedDeckId(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Decks</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>Erstelle Sets und fuege Karten hinzu.</Text>
          </View>
          <Pressable style={[styles.addButton, { backgroundColor: theme.primary }]} onPress={() => setIsDeckModalOpen(true)}>
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>

        {decks.map((deck) => (
          <Pressable key={deck.id} onPress={() => setSelectedDeckId(deck.id)}>
            <DeckCard deck={deck} theme={theme} />
          </Pressable>
        ))}
      </ScrollView>

      <Modal transparent visible={isDeckModalOpen} animationType="slide" onRequestClose={() => setIsDeckModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
          <View style={[styles.modal, { backgroundColor: theme.surface }]}> 
            <Text style={[styles.modalTitle, { color: theme.text }]}>Neues Deck</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="Titel" placeholderTextColor={theme.muted} style={[styles.input, { color: theme.text, borderColor: theme.border }]} />
            <TextInput value={subject} onChangeText={setSubject} placeholder="Fach" placeholderTextColor={theme.muted} style={[styles.input, { color: theme.text, borderColor: theme.border }]} />
            <View style={styles.modalActions}>
              <Pressable style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={() => setIsDeckModalOpen(false)}>
                <Text style={[styles.secondaryText, { color: theme.text }]}>Abbrechen</Text>
              </Pressable>
              <Pressable style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={saveDeck}>
                <Text style={styles.primaryText}>Speichern</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal transparent visible={!!selectedDeck} animationType="slide" onRequestClose={() => setSelectedDeckId(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
          <View style={[styles.modal, { backgroundColor: theme.surface }]}> 
            <Text style={[styles.modalTitle, { color: theme.text }]}>Karte fuer {selectedDeck?.title}</Text>
            <TextInput value={front} onChangeText={setFront} placeholder="Vorderseite / Frage" placeholderTextColor={theme.muted} multiline style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]} />
            <TextInput value={back} onChangeText={setBack} placeholder="Rueckseite / Antwort" placeholderTextColor={theme.muted} multiline style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]} />
            <View style={styles.modalActions}>
              <Pressable style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={() => setSelectedDeckId(null)}>
                <Text style={[styles.secondaryText, { color: theme.text }]}>Abbrechen</Text>
              </Pressable>
              <Pressable style={[styles.primaryButton, { backgroundColor: theme.secondary }]} onPress={saveCard}>
                <Text style={styles.primaryText}>Hinzufuegen</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 110,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  addButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modal: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    gap: 14,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    fontWeight: '700',
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryText: {
    fontWeight: '900',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
