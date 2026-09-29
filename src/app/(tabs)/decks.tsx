import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { openGame } from '../../utils/openGame';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import { Confetti } from '../../components/Confetti';
import { confirmAction } from '../../utils/confirm';
import { DeckActionSheet } from '../../components/DeckActionSheet';
import { DeckCard } from '../../components/DeckCard';
import { DeckRow } from '../../components/DeckRow';
import { ThemeToggle } from '../../components/ThemeToggle';
import { SuggestionChips } from '../../components/SuggestionChips';
import { useLanguage } from '../../state/LanguageContext';
import { useLibrary } from '../../state/LibraryContext';
import { useAppTheme } from '../../state/ThemeContext';
import { displayFont } from '../../theme/palette';
import { pickCardImage, deleteCardImage } from '../../utils/cardImages';
import { Deck } from '../../types/flashcards';
import { nextPriority, priorityColor, priorityLabelKeys, priorityLevels } from '../../utils/priority';

type CardSide = 'front' | 'back';

type SortMode = 'folders' | 'priority';

const sortModeKey = 'index-card.decks.sort.v1';

const reminderLeadOptions = [0, 15, 30, 60, 120, 1440];
const maxReminderLeadMinutes = 7 * 24 * 60;

function formatLeadMinutes(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;

  return [days > 0 ? `${days} d` : '', hours > 0 ? `${hours} h` : '', rest > 0 ? `${rest} min` : '']
    .filter(Boolean)
    .join(' ');
}

function createDefaultReminderDate() {
  return new Date(Date.now() + 60 * 60 * 1000);
}

function isFutureDate(date: Date) {
  return date.getTime() > Date.now();
}

function isSameText(a: string, b: string) {
  return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values));
}

// Reuse the spelling of an existing entry so "biologie" does not create a second "Biologie".
function resolveExisting(value: string, options: string[]) {
  return options.find((option) => isSameText(option, value)) ?? value.trim();
}

export default function DecksScreen() {
  const { theme } = useAppTheme();
  const { decks, prioritizedDecks, createDeck, addCard, deleteCard, deleteDeck, resetDeckProgress, setDeckPriority, updateDeckReminder } = useLibrary();
  const { t } = useLanguage();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const deckFormScrollRef = useRef<ScrollView>(null);
  const cardScrollRef = useRef<ScrollView>(null);
  const [sortMode, setSortMode] = useState<SortMode>('folders');
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [menuDeckId, setMenuDeckId] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<'category' | 'folder' | 'lesson' | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [folder, setFolder] = useState('');
  const [lesson, setLesson] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [confettiBurst, setConfettiBurst] = useState(0);
  const [frontImageUri, setFrontImageUri] = useState<string | undefined>();
  const [backImageUri, setBackImageUri] = useState<string | undefined>();
  const [reminderAt, setReminderAt] = useState('');
  const [reminderDate, setReminderDate] = useState(createDefaultReminderDate);
  const [reminderLeadText, setReminderLeadText] = useState('30');
  const [reminderMessage, setReminderMessage] = useState('');
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(sortModeKey)
      .then((saved) => {
        if (saved === 'folders' || saved === 'priority') {
          setSortMode(saved);
        }
      })
      .catch(() => undefined);
  }, []);

  function changeSortMode(mode: SortMode) {
    setSortMode(mode);
    AsyncStorage.setItem(sortModeKey, mode).catch(() => undefined);
    Haptics.selectionAsync().catch(() => undefined);
  }

  function cyclePriority(deck: Deck) {
    setDeckPriority(deck.id, nextPriority(deck.priority));
    Haptics.selectionAsync().catch(() => undefined);
  }

  // Bring lower fields above the keyboard once it has finished animating in.
  function scrollToEndSoon(scrollRef: { current: ScrollView | null }) {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
  }

  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId);
  const categories = Array.from(new Set(decks.map((deck) => deck.category)));
  const folderSuggestions = uniqueValues(
    decks.filter((deck) => isSameText(deck.category, category)).map((deck) => deck.folder),
  );
  const lessonSuggestions = uniqueValues(
    decks
      .filter((deck) => isSameText(deck.category, category) && isSameText(deck.folder, folder))
      .map((deck) => deck.lesson),
  );

  function selectCategory(option: string) {
    if (!isSameText(option, category)) {
      setFolder('');
      setLesson('');
    }
    setCategory(option);
  }

  function selectFolder(option: string) {
    if (!isSameText(option, folder)) {
      setLesson('');
    }
    setFolder(option);
  }

  function saveDeck() {
    const resolvedCategory = resolveExisting(category, categories);
    const resolvedFolder = resolveExisting(folder, folderSuggestions);
    const resolvedLesson = resolveExisting(lesson, lessonSuggestions);

    createDeck(title, resolvedCategory, resolvedFolder, resolvedLesson);
    setTitle('');
    setCategory('');
    setFolder('');
    setLesson('');
    setIsDeckModalOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }

  function saveCard() {
    // Each side needs text or an image; the back may be an image alone.
    if (!selectedDeck || (!front.trim() && !frontImageUri) || (!back.trim() && !backImageUri)) {
      return;
    }

    addCard(selectedDeck.id, front, back, frontImageUri, backImageUri);
    setFront('');
    setBack('');
    setFrontImageUri(undefined);
    setBackImageUri(undefined);
    setConfettiBurst((current) => current + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
  }

  async function chooseImage(target: CardSide) {
    const setUri = target === 'front' ? setFrontImageUri : setBackImageUri;
    const previous = target === 'front' ? frontImageUri : backImageUri;

    try {
      const uri = await pickCardImage();
      if (uri) {
        deleteCardImage(previous);
        setUri(uri);
      }
    } catch {
      Alert.alert(t('addImage'), t('imageError'));
    }
  }

  function removeImage(target: CardSide) {
    deleteCardImage(target === 'front' ? frontImageUri : backImageUri);
    (target === 'front' ? setFrontImageUri : setBackImageUri)(undefined);
  }

  function renderImagePicker(target: CardSide) {
    const uri = target === 'front' ? frontImageUri : backImageUri;

    return uri ? (
      <View style={styles.imagePreviewWrap}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('addImage')} onPress={() => chooseImage(target)} style={styles.imagePreview}>
          <Image source={{ uri }} contentFit="contain" style={styles.imagePreviewImage} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('removeImage')} onPress={() => removeImage(target)} style={styles.imageRemove}>
          <Ionicons name="close" size={16} color="#fff" />
        </Pressable>
      </View>
    ) : (
      <Pressable style={[styles.dictationButton, { backgroundColor: theme.elevated }]} onPress={() => chooseImage(target)}>
        <Text style={[styles.dictationButtonText, { color: theme.text }]}>{t('addImage')}</Text>
      </Pressable>
    );
  }

  function startGame(deck: Deck) {
    if (deck.cards.length < 2) {
      Alert.alert(t('games'), t('gameNeedCards'));
      return;
    }

    openGame(deck.id);
  }

  function confirmDeleteCard(cardId: string) {
    if (!selectedDeck) {
      return;
    }

    confirmAction({ title: t('cardDeleteTitle'), message: t('cardDeleteBody'), cancelLabel: t('cancel'), confirmLabel: t('cardDelete'), destructive: true, onConfirm: () => deleteCard(selectedDeck.id, cardId) });
  }

  function confirmDeleteDeck(deckId: string, deckTitle: string) {
    confirmAction({ title: t('deckDeleteTitle'), message: `${deckTitle} ${t('deckDeleteBody')}`, cancelLabel: t('cancel'), confirmLabel: t('deckDelete'), destructive: true, onConfirm: () => deleteDeck(deckId) });
  }

  function confirmResetDeck(deckId: string, deckTitle: string) {
    confirmAction({ title: t('deckRepeatTitle'), message: `${deckTitle} ${t('deckRepeatBody')}`, cancelLabel: t('cancel'), confirmLabel: t('deckRepeat'), onConfirm: () => resetDeckProgress(deckId) });
  }

  function openDeck(deckId: string) {
    const deck = decks.find((currentDeck) => currentDeck.id === deckId);
    const nextReminderDate = deck?.reminderAt ? new Date(deck.reminderAt) : createDefaultReminderDate();
    setSelectedDeckId(deckId);
    setReminderAt(Number.isNaN(nextReminderDate.getTime()) ? '' : nextReminderDate.toISOString());
    setReminderDate(Number.isNaN(nextReminderDate.getTime()) ? createDefaultReminderDate() : nextReminderDate);
    setReminderLeadText(String(deck?.reminderLeadMinutes ?? 30));
    setReminderMessage(deck?.reminderMessage ?? '');
  }

  function formatReminderDate(date: Date) {
    return date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatReminderTime(date: Date) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  function handleReminderPickerChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (event.type === 'dismissed' || !selectedDate) {
      setPickerMode(null);
      return;
    }

    const nextDate = new Date(reminderDate);

    if (pickerMode === 'date') {
      nextDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    }

    if (pickerMode === 'time') {
      nextDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    }

    setReminderDate(nextDate);
    setReminderAt(nextDate.toISOString());
    setPickerMode(null);
  }

  async function saveReminder() {
    if (!selectedDeck) {
      return;
    }

    if (!reminderAt || Number.isNaN(reminderDate.getTime())) {
      Alert.alert(t('reminder'), t('reminderAtPlaceholder'));
      return;
    }

    const permissions = await Notifications.requestPermissionsAsync();
    if (!permissions.granted) {
      Alert.alert(t('reminder'), t('notificationsDenied'));
      return;
    }

    const safeLeadMinutes = Number.parseInt(reminderLeadText, 10);
    if (!Number.isFinite(safeLeadMinutes) || safeLeadMinutes < 0 || safeLeadMinutes > maxReminderLeadMinutes) {
      Alert.alert(t('reminder'), t('reminderLeadPlaceholder'));
      return;
    }
    const message = reminderMessage.trim() || `${selectedDeck.title}: ${t('study')}`;
    const reminderIso = reminderDate.toISOString();

    updateDeckReminder(selectedDeck.id, {
      reminderAt: reminderIso,
      reminderLeadMinutes: safeLeadMinutes,
      reminderMessage: message,
    });

    await Notifications.cancelScheduledNotificationAsync(`deck-${selectedDeck.id}`).catch(() => undefined);
    await Notifications.cancelScheduledNotificationAsync(`deck-${selectedDeck.id}-lead`).catch(() => undefined);

    await Notifications.scheduleNotificationAsync({
      identifier: `deck-${selectedDeck.id}`,
      content: {
        title: selectedDeck.title,
        body: message,
        sound: 'default',
        data: { reminderMessage: message },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
        channelId: 'study-reminders',
      },
    });

    const leadDate = new Date(reminderDate.getTime() - safeLeadMinutes * 60 * 1000);
    if (safeLeadMinutes > 0 && isFutureDate(leadDate)) {
      await Notifications.scheduleNotificationAsync({
        identifier: `deck-${selectedDeck.id}-lead`,
        content: {
          title: selectedDeck.title,
          body: message,
          sound: 'default',
          data: { reminderMessage: message },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: leadDate,
          channelId: 'study-reminders',
        },
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>{t('decks')}</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>{`${decks.length} ${t('decks')}`}</Text>
          </View>
          <View style={styles.headerActions}>
            <ThemeToggle />
          <Pressable accessibilityRole="button" accessibilityLabel={t('newDeck')} style={({ pressed }) => [styles.addButton, { backgroundColor: theme.primary }, pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }]} onPress={() => setIsDeckModalOpen(true)}>
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
          </View>
        </View>

        {decks.length > 1 && (
          <View style={[styles.segmented, { backgroundColor: theme.elevated }]}>
            {(['folders', 'priority'] as SortMode[]).map((mode) => {
              const isActive = sortMode === mode;

              return (
                <Pressable
                  key={mode}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => changeSortMode(mode)}
                  style={[styles.segment, isActive && { backgroundColor: theme.surface }]}
                >
                  <Text style={[styles.segmentText, { color: isActive ? theme.text : theme.muted }]}>
                    {mode === 'folders' ? t('sortFolders') : t('priority')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {decks.length === 0 && (
          <View style={[styles.emptyDecks, { borderColor: theme.border }]}>
            <Text style={[styles.emptyDecksTitle, { color: theme.text }]}>{t('emptyStudyTitle')}</Text>
            <Text style={[styles.emptyDecksBody, { color: theme.muted }]}>{t('emptyStudyBody')}</Text>
          </View>
        )}

        {sortMode === 'folders' && categories.map((currentCategory) => {
          const categoryDecks = decks.filter((deck) => deck.category === currentCategory);
          const folders = Array.from(new Set(categoryDecks.map((deck) => deck.folder)));

          return (
            <View key={currentCategory} style={styles.hierarchyGroup}>
              <Text style={[styles.categoryTitle, { color: theme.text }]}>{currentCategory}</Text>
              {folders.map((currentFolder) => {
                const folderDecks = categoryDecks.filter((deck) => deck.folder === currentFolder);
                const lessons = Array.from(new Set(folderDecks.map((deck) => deck.lesson)));

                return (
                  <View key={`${currentCategory}-${currentFolder}`} style={[styles.folderGroup, { borderColor: theme.border }]}> 
                    <Text style={[styles.folderTitle, { color: theme.muted }]}>{currentFolder}</Text>
                    {lessons.map((currentLesson) => (
                      <View key={`${currentCategory}-${currentFolder}-${currentLesson}`} style={styles.lessonGroup}>
                        <Text style={[styles.lessonTitle, { color: theme.text }]}>{currentLesson}</Text>
                        {folderDecks
                          .filter((deck) => deck.lesson === currentLesson)
                          .map((deck) => (
                            <DeckRow key={deck.id} theme={theme} onPress={() => openDeck(deck.id)} onLongPress={() => setMenuDeckId(deck.id)} onDelete={() => confirmDeleteDeck(deck.id, deck.title)}>
                              <DeckCard deck={deck} theme={theme} onPriorityPress={() => cyclePriority(deck)} onGamePress={() => startGame(deck)} />
                            </DeckRow>
                          ))}
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          );
        })}
        {sortMode === 'priority' &&
          priorityLevels.map((level) => {
            const levelDecks = prioritizedDecks.filter((deck) => deck.priority === level);

            if (levelDecks.length === 0) {
              return null;
            }

            return (
              <View key={level} style={styles.priorityGroup}>
                <View style={styles.priorityHeader}>
                  <Ionicons name={level === 'low' ? 'flag-outline' : 'flag'} size={20} color={priorityColor(theme, level)} />
                  <Text style={[styles.priorityTitle, { color: theme.text }]}>{t(priorityLabelKeys[level])}</Text>
                  <Text style={[styles.priorityCount, { color: theme.muted }]}>{levelDecks.length}</Text>
                </View>
                {levelDecks.map((deck) => (
                  <DeckRow key={deck.id} theme={theme} onPress={() => openDeck(deck.id)} onLongPress={() => setMenuDeckId(deck.id)} onDelete={() => confirmDeleteDeck(deck.id, deck.title)}>
                    <DeckCard deck={deck} theme={theme} onPriorityPress={() => cyclePriority(deck)} onGamePress={() => startGame(deck)} />
                  </DeckRow>
                ))}
              </View>
            );
          })}
      </ScrollView>

      <DeckActionSheet deck={decks.find((deck) => deck.id === menuDeckId)} theme={theme} onClose={() => setMenuDeckId(null)} />

      <Modal transparent statusBarTranslucent visible={isDeckModalOpen} animationType="slide" onRequestClose={() => setIsDeckModalOpen(false)}>
        <KeyboardAvoidingView behavior="padding" style={styles.modalBackdrop}>
          <View style={[styles.modal, styles.editModal, { backgroundColor: theme.surface, paddingBottom: 20 + bottomInset }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t('newDeck')}</Text>
            <ScrollView ref={deckFormScrollRef} contentContainerStyle={styles.editModalContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
              <TextInput value={title} onChangeText={setTitle} placeholder={t('deckPlaceholder')} placeholderTextColor={theme.muted} style={[styles.input, { color: theme.text, borderColor: theme.border }]} />
              {/* Existing options only appear once the matching field has been tapped. */}
              <TextInput value={category} onChangeText={setCategory} onFocus={() => setFocusedField('category')} onBlur={() => setFocusedField((current) => (current === 'category' ? null : current))} placeholder={t('categoryPlaceholder')} placeholderTextColor={theme.muted} style={[styles.input, { color: theme.text, borderColor: theme.border }]} />
              {focusedField === 'category' && categories.length > 0 && <Text style={[styles.suggestionHint, { color: theme.muted }]}>{t('suggestionHint')}</Text>}
              {focusedField === 'category' && <SuggestionChips options={categories} value={category} theme={theme} onSelect={selectCategory} />}
              <TextInput value={folder} onChangeText={setFolder} onFocus={() => setFocusedField('folder')} onBlur={() => setFocusedField((current) => (current === 'folder' ? null : current))} placeholder={t('folderPlaceholder')} placeholderTextColor={theme.muted} style={[styles.input, { color: theme.text, borderColor: theme.border }]} />
              {focusedField === 'folder' && <SuggestionChips options={folderSuggestions} value={folder} theme={theme} onSelect={selectFolder} />}
              <TextInput value={lesson} onChangeText={setLesson} onFocus={() => { setFocusedField('lesson'); scrollToEndSoon(deckFormScrollRef); }} onBlur={() => setFocusedField((current) => (current === 'lesson' ? null : current))} placeholder={t('lessonPlaceholder')} placeholderTextColor={theme.muted} style={[styles.input, { color: theme.text, borderColor: theme.border }]} />
              {focusedField === 'lesson' && <SuggestionChips options={lessonSuggestions} value={lesson} theme={theme} onSelect={setLesson} />}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={() => setIsDeckModalOpen(false)}>
                <Text style={[styles.secondaryText, { color: theme.text }]}>{t('cancel')}</Text>
              </Pressable>
              <Pressable style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={saveDeck}>
                <Text style={styles.primaryText}>{t('save')}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal transparent statusBarTranslucent visible={!!selectedDeck} animationType="slide" onRequestClose={() => setSelectedDeckId(null)}>
        <KeyboardAvoidingView behavior="padding" style={styles.modalBackdrop}>
          <View style={[styles.modal, styles.editModal, { backgroundColor: theme.surface, paddingBottom: 20 + bottomInset }]}> 
            <ScrollView ref={cardScrollRef} contentContainerStyle={styles.editModalContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{t('cards')} · {selectedDeck?.title}</Text>
              <View style={styles.inputBlock}>
                <TextInput value={front} onChangeText={setFront} placeholder={t('frontPlaceholder')} placeholderTextColor={theme.muted} multiline style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]} />
                {renderImagePicker('front')}
              </View>
              <View style={styles.inputBlock}>
                <TextInput value={back} onChangeText={setBack} placeholder={`${t('answer')}`} placeholderTextColor={theme.muted} multiline style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]} />
                {renderImagePicker('back')}
              </View>
              <View style={styles.cardListContent}>
                {selectedDeck?.cards.map((card) => (
                  <View key={card.id} style={[styles.cardRow, { borderColor: theme.border, backgroundColor: theme.elevated }]}> 
                    <View style={styles.cardRowText}>
                      <Text style={[styles.cardRowLabel, { color: theme.muted }]}>{t('front')}</Text>
                      {!!card.frontImageUri && <Image source={{ uri: card.frontImageUri }} contentFit="contain" style={styles.cardRowImage} />}
                      <Text style={[styles.cardRowValue, { color: theme.text }]}>{card.front}</Text>
                      <Text style={[styles.cardRowLabel, { color: theme.muted }]}>{t('answer')}</Text>
                      {!!card.backImageUri && <Image source={{ uri: card.backImageUri }} contentFit="contain" style={styles.cardRowImage} />}
                      <Text style={[styles.cardRowValue, { color: theme.text }]}>{card.back}</Text>
                    </View>
                    <View style={styles.cardRowActions}>
                      <Pressable style={[styles.deleteButton, { backgroundColor: theme.primary }]} onPress={() => confirmDeleteCard(card.id)}>
                        <Text style={styles.deleteButtonText}>{t('cardDelete')}</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
              <View style={[styles.reminderPanel, { borderColor: theme.border }]}> 
                <Text style={[styles.reminderTitle, { color: theme.text }]}>{t('reminder')}</Text>
                <View style={styles.reminderPickerRow}>
                  <Pressable style={[styles.reminderPickerButton, { borderColor: theme.border, backgroundColor: theme.elevated }]} onPress={() => setPickerMode('date')}>
                    <Text style={[styles.reminderPickerText, { color: theme.text }]}>{formatReminderDate(reminderDate)}</Text>
                  </Pressable>
                  <Pressable style={[styles.reminderPickerButton, { borderColor: theme.border, backgroundColor: theme.elevated }]} onPress={() => setPickerMode('time')}>
                    <Text style={[styles.reminderPickerText, { color: theme.text }]}>{formatReminderTime(reminderDate)}</Text>
                  </Pressable>
                </View>
                <View style={styles.leadOptions}>
                  {reminderLeadOptions.map((minutes) => {
                    const isActive = reminderLeadText.trim() === String(minutes);

                    return (
                      <Pressable key={minutes} accessibilityRole="button" accessibilityState={{ selected: isActive }} style={[styles.leadOption, { backgroundColor: isActive ? theme.primary : theme.elevated, borderColor: theme.border }]} onPress={() => setReminderLeadText(String(minutes))}>
                        <Text style={[styles.leadOptionText, { color: isActive ? '#FFFFFF' : theme.text }]}>{formatLeadMinutes(minutes)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.leadCustomRow}>
                  <TextInput
                    value={reminderLeadText}
                    onChangeText={(text) => setReminderLeadText(text.replace(/[^0-9]/g, '').slice(0, 5))}
                    onFocus={() => scrollToEndSoon(cardScrollRef)}
                    keyboardType="number-pad"
                    maxLength={5}
                    placeholder={t('reminderLeadPlaceholder')}
                    placeholderTextColor={theme.muted}
                    style={[styles.input, styles.leadInput, { color: theme.text, borderColor: theme.border }]}
                  />
                  <Text style={[styles.leadUnit, { color: theme.muted }]}>
                    {Number.parseInt(reminderLeadText, 10) >= 60 ? `min = ${formatLeadMinutes(Number.parseInt(reminderLeadText, 10))}` : 'min'}
                  </Text>
                </View>
                <TextInput value={reminderMessage} onChangeText={setReminderMessage} onFocus={() => scrollToEndSoon(cardScrollRef)} placeholder={t('reminderMessagePlaceholder')} placeholderTextColor={theme.muted} multiline style={[styles.input, styles.messageArea, { color: theme.text, borderColor: theme.border }]} />
                <Pressable style={[styles.primaryButton, { backgroundColor: theme.secondary }]} onPress={saveReminder}>
                  <Text style={styles.primaryText}>{t('reminderSave')}</Text>
                </Pressable>
              </View>
              {pickerMode && (
                <DateTimePicker
                  value={reminderDate}
                  mode={pickerMode}
                  display="default"
                  onChange={handleReminderPickerChange}
                />
              )}
              {selectedDeck && (
                <View style={styles.deckActions}>
                  <Pressable style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={() => confirmResetDeck(selectedDeck.id, selectedDeck.title)}>
                    <Text style={[styles.secondaryText, { color: theme.text }]}>{t('deckRepeat')}</Text>
                  </Pressable>
                  <Pressable style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={() => confirmDeleteDeck(selectedDeck.id, selectedDeck.title)}>
                    <Text style={styles.primaryText}>{t('deckDelete')}</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={() => setSelectedDeckId(null)}>
                <Text style={[styles.secondaryText, { color: theme.text }]}>{t('done')}</Text>
              </Pressable>
              <Pressable style={[styles.primaryButton, { backgroundColor: theme.secondary }]} onPress={saveCard}>
                <Text style={styles.primaryText}>{t('save')}</Text>
              </Pressable>
            </View>
          </View>
        <Confetti burst={confettiBurst} />
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
    paddingBottom: 32,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: displayFont,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  priorityGroup: {
    gap: 12,
    marginTop: 8,
  },
  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityTitle: {
    fontFamily: displayFont,
    fontSize: 22,
    fontWeight: '700',
  },
  priorityCount: {
    fontSize: 14,
    fontWeight: '700',
  },
  suggestionHint: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyDecks: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 22,
    padding: 22,
    gap: 6,
  },
  emptyDecksTitle: {
    fontFamily: displayFont,
    fontSize: 20,
    fontWeight: '700',
  },
  emptyDecksBody: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  hierarchyGroup: {
    gap: 12,
    marginTop: 8,
  },
  categoryTitle: {
    fontSize: 23,
    fontWeight: '900',
  },
  folderGroup: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    gap: 12,
  },
  folderTitle: {
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  lessonGroup: {
    gap: 10,
  },
  lessonTitle: {
    fontSize: 17,
    fontWeight: '900',
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
  editModal: {
    maxHeight: '92%',
  },
  editModalContent: {
    gap: 14,
    paddingBottom: 16,
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
  messageArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  imagePreviewWrap: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  imagePreview: {
    width: 220,
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
  },
  imagePreviewImage: {
    flex: 1,
  },
  imageRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d64545',
  },
  cardRowImage: {
    width: 140,
    height: 100,
    borderRadius: 10,
  },
  inputBlock: {
    gap: 8,
  },
  dictationButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  dictationButtonText: {
    fontSize: 12,
    fontWeight: '900',
  },
  cardList: {
    maxHeight: 220,
  },
  reminderPanel: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 12,
    gap: 10,
  },
  reminderTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  reminderPickerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  reminderPickerButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reminderPickerText: {
    fontWeight: '900',
  },
  leadCustomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leadInput: {
    flex: 1,
    fontVariant: ['tabular-nums'],
  },
  leadUnit: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  leadOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  leadOption: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  leadOptionText: {
    fontWeight: '900',
  },
  reminderToggle: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reminderToggleText: {
    fontWeight: '900',
  },
  cardListContent: {
    gap: 10,
  },
  cardRow: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 12,
  },
  cardRowText: {
    gap: 4,
  },
  cardRowLabel: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  cardRowValue: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  cardRowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  deckActions: {
    flexDirection: 'row',
    gap: 10,
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
