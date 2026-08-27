# Shortcut Recorder Fix v0.6.1

## Problema

La prima implementazione del configuratore shortcut acquisiva gli eventi tastiera tramite `onKeyDown` applicato direttamente al pulsante "Press shortcut".

Su macOS/WebView il focus del controllo non risultava sufficientemente affidabile per garantire la cattura della combinazione successiva al click.

## Correzione

Quando l'utente attiva la modalità di registrazione:

1. `recordingShortcut` viene impostato a `true`.
2. L'applicazione registra temporaneamente un listener `keydown` a livello `window`.
3. Gli eventi vengono intercettati in capture phase.
4. La combinazione viene convertita nel formato Tauri Global Shortcut.
5. La precedente shortcut viene rimossa.
6. La nuova shortcut viene registrata.
7. La configurazione viene salvata localmente.
8. Il listener temporaneo viene rimosso.

Questo rende la cattura indipendente dal focus del singolo elemento UI.

## Comportamento

Durante la registrazione:

- Command / Control / Alt / Shift possono essere usati come modificatori.
- Il tasto finale può essere una lettera, numero, function key o alcuni tasti speciali supportati.
- Escape annulla la registrazione.
- Una shortcut non disponibile produce un errore nella UI.
- La shortcut precedente viene mantenuta quando possibile se la nuova registrazione fallisce.

## Shortcut predefinita

La shortcut iniziale rimane:

macOS:

`CommandOrControl+Shift+V`

Windows:

`CommandOrControl+Shift+V`

Se la combinazione è già occupata dal sistema operativo o da un'altra applicazione, Clipdeck richiede all'utente di sceglierne una diversa.

## Stato milestone

v0.6.1 include:

- clipboard watcher reale
- storico locale persistente
- deduplicazione
- ricerca
- selezione tastiera
- global shortcut
- shortcut configurabile
- shortcut recorder a livello finestra
- paste engine
- menu bar / system tray
- launch at login
- Dock/taskbar configurabile

## Update v0.6.2

The recorder now displays the currently pressed modifiers and final key in real time.

See:

`docs/07-live-shortcut-recorder-v0.6.2.md`
