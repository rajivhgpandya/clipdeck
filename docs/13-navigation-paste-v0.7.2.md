# Navigation and Paste v0.7.2

## Obiettivi

Questa versione interviene su tre aspetti emersi durante il test operativo:

1. paste automatico su macOS;
2. navigazione numerica;
3. scorrimento automatico della lista.

## Paste macOS

### Stato precedente

La selezione tramite Enter aggiornava correttamente la clipboard.

Un successivo Command+V manuale incollava infatti l'elemento scelto.

Il problema era quindi limitato all'invio sintetico della combinazione Command+V.

### Nuova implementazione

Su macOS il Paste Engine utilizza:

`System Events`

tramite `osascript`.

Flusso:

History selection
-> Enter
-> write selected value to clipboard
-> hide Clipdeck
-> restore previous application focus
-> short delay
-> System Events
-> Command+V

Windows mantiene l'implementazione nativa tramite Enigo e Control+V.

### Permessi macOS

System Events può richiedere autorizzazione in:

Privacy & Security
-> Accessibility

L'autorizzazione sarà documentata anche nella futura guida di installazione macOS.

## Navigazione numerica

I tasti da 1 a 9 selezionano direttamente la corrispondente posizione visibile nello storico.

Esempio:

`1` -> primo elemento

`5` -> quinto elemento

`9` -> nono elemento

La pressione del numero seleziona l'elemento ma non lo incolla automaticamente.

Enter rimane il comando esplicito di Paste.

## Navigazione frecce

Arrow Up e Arrow Down continuano a modificare la selezione.

Quando la selezione supera l'area attualmente visibile, la lista esegue automaticamente:

`scrollIntoView({ block: "nearest" })`

In questo modo l'elemento selezionato rimane sempre visibile.

## Controlli History

- Arrow Up: elemento precedente
- Arrow Down: elemento successivo
- 1-9: selezione diretta
- Enter: Paste
- Escape: nasconde la finestra

## Versione

Clipdeck v0.7.2

## Update v0.7.3

The paste engine no longer relies on macOS automatically restoring focus after Clipdeck is hidden.

The application now records the foreground application when the global shortcut is triggered and explicitly reactivates that application before sending Command+V.

See:

`docs/14-deterministic-focus-paste-v0.7.3.md`

## Update v0.7.4

Numeric navigation now supports multi-digit history positions and keyboard navigation is captured at window level.

This allows keyboard controls to remain active after mouse interactions.

See:

`docs/15-numeric-navigation-v0.7.4.md`
