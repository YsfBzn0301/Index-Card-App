# Index Card

Index Card ist eine moderne Cross-Platform-Karteikarten-App fuer iOS und Android, gebaut mit Expo, React Native, TypeScript und Expo Router.

## Konzept

- Zielgruppe: Schueler, Studierende und junge Erwachsene.
- Look and feel: farbenfroh, playful, grosse Touch-Zonen, klare Karten, schnelle Aktionen.
- Theme: automatische Anpassung an das Systemdesign ueber Light/Dark Mode.
- Datenhaltung: offline-first mit AsyncStorage auf dem Geraet.
- Lernlogik: Karten starten bei Mastery 0, steigen bei "Gewusst" bis 3 und werden bei "Nochmal" zurueckgesetzt.
- Navigation: Expo Router mit Tabs fuer Start, Decks, Lernen und Mehr.

## Ordnerstruktur

```text
src/
  app/
    _layout.tsx          App-Provider und Stack
    (tabs)/
      _layout.tsx        Tab-Navigation
      index.tsx          Dashboard
      decks.tsx          Decks und Kartenerstellung
      study.tsx          Lernmodus mit Flip-Karte
      settings.tsx       Konzept, Status, Reset
  components/
    DeckCard.tsx         Wiederverwendbare Deck-Karte
  data/
    starterDecks.ts      Beispieldaten
  state/
    LibraryContext.tsx   Persistenz und App-Logik
  theme/
    palette.ts           Light/Dark Theme und Akzentfarben
  types/
    flashcards.ts        Datenmodelle
```

## Lokal starten

```bash
npm install
npx expo start
```

Danach den QR-Code mit Expo Go scannen. Fuer native Features ausserhalb von Expo Go eine Development Build verwenden.

## Android APK bauen

```bash
npx eas-cli@latest build --platform android --profile preview
```

Das `preview`-Profil erzeugt eine APK, die lokal auf Android installiert werden kann.

## iOS Build

```bash
npx eas-cli@latest build --platform ios --profile preview
```

Fuer Installation auf einem echten iPhone brauchst du ein Apple Developer Konto und ein korrekt registriertes Geraet bzw. TestFlight/App-Store-Verteilung.

## Qualitaetschecks

```bash
npm run typecheck
npm run lint
```
