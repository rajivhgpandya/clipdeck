# Numeric Navigation v0.7.4

## Obiettivi

Migliorare la navigazione keyboard-first dello storico.

## Global keyboard handling

La navigazione dello storico viene ora intercettata a livello finestra.

Questo significa che i controlli continuano a funzionare anche dopo interazioni con il mouse.

Sono gestiti globalmente:

- Arrow Up
- Arrow Down
- Enter
- Escape
- numeric jump

## Eccezioni

La navigazione globale viene sospesa quando:

- l'utente sta registrando una shortcut;
- il focus è su input;
- il focus è su textarea;
- il focus è su select;
- il focus è su contenuto editable.

Questo permette alla barra Search di continuare a ricevere normalmente testo e numeri.

## Numeric Jump

La selezione numerica non è più limitata a 1-9.

È presente un buffer temporaneo.

Esempi:

`5`
-> item 5

`1`, `7`
-> item 17

`5`, `0`
-> item 50

`2`, `5`, `0`
-> item 250

I digit devono essere premuti entro circa 800 ms tra loro.

Dopo il timeout il buffer viene azzerato.

## Feedback UI

Durante l'inserimento numerico viene mostrato:

`Jump: N`

Esempio:

`Jump: 50`

## Auto-scroll

Numeric Jump utilizza lo stesso selectedIndex della navigazione tramite frecce.

Il meccanismo scrollIntoView esistente mantiene quindi automaticamente visibile l'elemento selezionato.

## Versione

Clipdeck v0.7.4

## Update v0.7.5

The application no longer focuses the Search field automatically when opened using the Global Shortcut.

Keyboard focus is now assigned to the application root so Numeric Jump works immediately.

Numeric Jump buffering has also been simplified and made deterministic.

See:

`docs/16-keyboard-navigation-focus-v0.7.5.md`
