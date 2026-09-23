export type SupportedLanguageCode = 'de-DE' | 'en-US' | 'tr-TR' | 'sr-RS' | 'hr-HR' | 'es-ES' | 'it-IT';

export type SupportedLanguage = {
  code: SupportedLanguageCode;
  label: string;
  shortLabel: string;
};

export const supportedLanguages: SupportedLanguage[] = [
  { code: 'de-DE', label: 'Deutsch', shortLabel: 'DE' },
  { code: 'en-US', label: 'English', shortLabel: 'EN' },
  { code: 'tr-TR', label: 'Turkce', shortLabel: 'TR' },
  { code: 'sr-RS', label: 'Srpski', shortLabel: 'SR' },
  { code: 'hr-HR', label: 'Hrvatski', shortLabel: 'HR' },
  { code: 'es-ES', label: 'Espanol', shortLabel: 'ES' },
  { code: 'it-IT', label: 'Italiano', shortLabel: 'IT' },
];

export const defaultLanguageCode: SupportedLanguageCode = 'de-DE';

type TranslationKey =
  | 'again'
  | 'answer'
  | 'cards'
  | 'done'
  | 'decks'
  | 'front'
  | 'good'
  | 'home'
  | 'language'
  | 'listen'
  | 'question'
  | 'recordBack'
  | 'recordFront'
  | 'repeat'
  | 'settings'
  | 'speechCorrect'
  | 'speechExit'
  | 'speechHint'
  | 'speechListening'
  | 'speechMode'
  | 'speechStart'
  | 'speechTryAgain'
  | 'speakBack'
  | 'speakFront'
  | 'speechUnavailable'
  | 'study'
  | 'tapToFlip';

type TranslationMap = Record<TranslationKey, string>;

const translations: Record<SupportedLanguageCode, TranslationMap> = {
  'de-DE': {
    again: 'Nochmal',
    answer: 'Antwort',
    cards: 'Karten',
    done: 'Fertig',
    decks: 'Decks',
    front: 'Vorderseite',
    good: 'Gewusst',
    home: 'Start',
    language: 'Sprache',
    listen: 'Vorlesen',
    question: 'Frage',
    recordBack: 'Rueckseite diktieren',
    recordFront: 'Vorderseite diktieren',
    repeat: 'Wiederholen',
    settings: 'Mehr',
    speechCorrect: 'Genau richtig.',
    speechExit: 'Sprechmodus verlassen',
    speechHint: 'Sprich genau den Text der Rueckseite ein. Wenn er passt, gilt die Karte als gewusst. Du kannst jederzeit zurueck zum Swipe-Modus.',
    speechListening: 'Hoere zu...',
    speechMode: 'Sprech-Modus',
    speechStart: 'Antwort einsprechen',
    speechTryAgain: 'Das war noch nicht exakt. Versuch es nochmal oder verlasse den Modus.',
    speakBack: 'Antwort vorlesen',
    speakFront: 'Frage vorlesen',
    speechUnavailable: 'Diktieren braucht eine Development Build mit Mikrofonberechtigung.',
    study: 'Lernen',
    tapToFlip: 'Tippen zum Drehen',
  },
  'en-US': {
    again: 'Again',
    answer: 'Answer',
    cards: 'Cards',
    done: 'Done',
    decks: 'Decks',
    front: 'Front',
    good: 'Known',
    home: 'Home',
    language: 'Language',
    listen: 'Listen',
    question: 'Question',
    recordBack: 'Dictate back',
    recordFront: 'Dictate front',
    repeat: 'Repeat',
    settings: 'More',
    speechCorrect: 'Exactly right.',
    speechExit: 'Leave speaking mode',
    speechHint: 'Say exactly what is written on the back. If it matches, the card is marked as known. You can return to swipe mode anytime.',
    speechListening: 'Listening...',
    speechMode: 'Speaking mode',
    speechStart: 'Speak answer',
    speechTryAgain: 'Not exact yet. Try again or leave the mode.',
    speakBack: 'Read answer',
    speakFront: 'Read question',
    speechUnavailable: 'Dictation requires a development build with microphone permission.',
    study: 'Study',
    tapToFlip: 'Tap to flip',
  },
  'tr-TR': {
    again: 'Tekrar',
    answer: 'Cevap',
    cards: 'Kartlar',
    done: 'Bitti',
    decks: 'Desteler',
    front: 'On yuz',
    good: 'Bildim',
    home: 'Baslangic',
    language: 'Dil',
    listen: 'Dinle',
    question: 'Soru',
    recordBack: 'Arka yuzu dikte et',
    recordFront: 'On yuzu dikte et',
    repeat: 'Tekrarla',
    settings: 'Daha fazla',
    speechCorrect: 'Tam dogru.',
    speechExit: 'Konusma modundan cik',
    speechHint: 'Arka yuzde yazani aynen soyle. Eslesirse kart bilindi olarak isaretlenir. Istedigin zaman kaydirma moduna donebilirsin.',
    speechListening: 'Dinleniyor...',
    speechMode: 'Konusma modu',
    speechStart: 'Cevabi soyle',
    speechTryAgain: 'Henuz tam degil. Tekrar dene veya moddan cik.',
    speakBack: 'Cevabi oku',
    speakFront: 'Soruyu oku',
    speechUnavailable: 'Dikte icin mikrofon izinli development build gerekir.',
    study: 'Calis',
    tapToFlip: 'Cevirmek icin dokun',
  },
  'sr-RS': {
    again: 'Ponovo',
    answer: 'Odgovor',
    cards: 'Kartice',
    done: 'Gotovo',
    decks: 'Spilovi',
    front: 'Prednja strana',
    good: 'Znam',
    home: 'Pocetna',
    language: 'Jezik',
    listen: 'Pusti',
    question: 'Pitanje',
    recordBack: 'Diktiraj zadnju stranu',
    recordFront: 'Diktiraj prednju stranu',
    repeat: 'Ponovi',
    settings: 'Vise',
    speechCorrect: 'Tacno.',
    speechExit: 'Izadji iz govornog moda',
    speechHint: 'Izgovori tacno tekst sa zadnje strane. Ako se poklapa, kartica je oznacena kao znana. Uvek mozes da se vratis na prevlacenje.',
    speechListening: 'Slusam...',
    speechMode: 'Govorni mod',
    speechStart: 'Izgovori odgovor',
    speechTryAgain: 'Jos nije tacno. Pokusaj ponovo ili izadji iz moda.',
    speakBack: 'Procitaj odgovor',
    speakFront: 'Procitaj pitanje',
    speechUnavailable: 'Diktiranje zahteva development build sa dozvolom za mikrofon.',
    study: 'Ucenje',
    tapToFlip: 'Dodirni za okretanje',
  },
  'hr-HR': {
    again: 'Ponovno',
    answer: 'Odgovor',
    cards: 'Kartice',
    done: 'Gotovo',
    decks: 'Spilovi',
    front: 'Prednja strana',
    good: 'Znam',
    home: 'Pocetna',
    language: 'Jezik',
    listen: 'Pusti',
    question: 'Pitanje',
    recordBack: 'Diktiraj straznju stranu',
    recordFront: 'Diktiraj prednju stranu',
    repeat: 'Ponovi',
    settings: 'Vise',
    speechCorrect: 'Tocno.',
    speechExit: 'Izadji iz govornog moda',
    speechHint: 'Izgovori tocno tekst sa straznje strane. Ako se poklapa, kartica je oznacena kao znana. Uvijek se mozes vratiti na povlacenje.',
    speechListening: 'Slusam...',
    speechMode: 'Govorni mod',
    speechStart: 'Izgovori odgovor',
    speechTryAgain: 'Jos nije tocno. Pokusaj ponovno ili izadji iz moda.',
    speakBack: 'Procitaj odgovor',
    speakFront: 'Procitaj pitanje',
    speechUnavailable: 'Diktiranje zahtijeva development build s dozvolom za mikrofon.',
    study: 'Ucenje',
    tapToFlip: 'Dodirni za okretanje',
  },
  'es-ES': {
    again: 'Otra vez',
    answer: 'Respuesta',
    cards: 'Tarjetas',
    done: 'Listo',
    decks: 'Mazos',
    front: 'Anverso',
    good: 'Sabido',
    home: 'Inicio',
    language: 'Idioma',
    listen: 'Escuchar',
    question: 'Pregunta',
    recordBack: 'Dictar reverso',
    recordFront: 'Dictar anverso',
    repeat: 'Repetir',
    settings: 'Mas',
    speechCorrect: 'Exacto.',
    speechExit: 'Salir del modo voz',
    speechHint: 'Di exactamente el texto del reverso. Si coincide, la tarjeta cuenta como sabida. Puedes volver al modo swipe cuando quieras.',
    speechListening: 'Escuchando...',
    speechMode: 'Modo voz',
    speechStart: 'Decir respuesta',
    speechTryAgain: 'Aun no coincide. Intentalo otra vez o sal del modo.',
    speakBack: 'Leer respuesta',
    speakFront: 'Leer pregunta',
    speechUnavailable: 'El dictado requiere una development build con permiso de microfono.',
    study: 'Estudiar',
    tapToFlip: 'Toca para girar',
  },
  'it-IT': {
    again: 'Ancora',
    answer: 'Risposta',
    cards: 'Carte',
    done: 'Fatto',
    decks: 'Mazzi',
    front: 'Fronte',
    good: 'Lo so',
    home: 'Home',
    language: 'Lingua',
    listen: 'Ascolta',
    question: 'Domanda',
    recordBack: 'Detta retro',
    recordFront: 'Detta fronte',
    repeat: 'Ripeti',
    settings: 'Altro',
    speechCorrect: 'Esatto.',
    speechExit: 'Esci dalla modalita voce',
    speechHint: 'Pronuncia esattamente il testo sul retro. Se coincide, la carta viene segnata come conosciuta. Puoi tornare allo swipe in qualsiasi momento.',
    speechListening: 'Ascolto...',
    speechMode: 'Modalita voce',
    speechStart: 'Pronuncia risposta',
    speechTryAgain: 'Non e ancora esatto. Riprova o esci dalla modalita.',
    speakBack: 'Leggi risposta',
    speakFront: 'Leggi domanda',
    speechUnavailable: 'La dettatura richiede una development build con permesso microfono.',
    study: 'Studia',
    tapToFlip: 'Tocca per girare',
  },
};

export function getLanguage(code: SupportedLanguageCode) {
  return supportedLanguages.find((language) => language.code === code) ?? supportedLanguages[0];
}

export function translate(code: SupportedLanguageCode, key: TranslationKey) {
  return translations[code]?.[key] ?? translations[defaultLanguageCode][key];
}
