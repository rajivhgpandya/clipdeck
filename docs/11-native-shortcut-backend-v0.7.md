# Native Shortcut Backend v0.7

## Motivazione

Durante i test macOS la registrazione e gestione delle global shortcut dal frontend JavaScript risultava intermittente.

La shortcut poteva essere registrata ma il callback non risultava affidabile quando la finestra era nascosta o il focus cambiava.

## Nuova architettura

La global shortcut è ora gestita interamente nel backend Rust.

UI Shortcut Recorder
-> Tauri command
-> Rust Global Shortcut manager
-> macOS / Windows OS hotkey
-> Rust callback
-> Show main window
-> Emit history navigation event

## Vantaggi

- la shortcut non dipende dal ciclo di vita React;
- non dipende dal focus della WebView;
- resta attiva quando la finestra è nascosta;
- l'handler vive nel processo desktop nativo;
- comportamento più coerente tra macOS e Windows.

## Cambio shortcut

Quando l'utente sceglie una nuova combinazione:

1. Rust recupera la shortcut attualmente registrata;
2. deregistra la precedente;
3. tenta di registrare la nuova;
4. se riesce, aggiorna lo stato;
5. se fallisce, tenta di ripristinare quella precedente;
6. restituisce al frontend l'errore reale.

## Paste Engine

Il paste engine rimane separato dalla shortcut.

La command restituisce ora errori distinti per:

- inizializzazione clipboard;
- scrittura clipboard;
- hide finestra;
- inizializzazione keyboard engine;
- pressione modificatore;
- invio V;
- rilascio modificatore.

Questo consente di diagnosticare indipendentemente il problema di paste.

## Versione

Clipdeck v0.7

## Update v0.7.2

Navigation now supports direct selection with keys 1-9 and automatic scrolling of the selected history item.

The macOS Paste Engine now uses System Events for Command+V after restoring focus to the previous application.

See:

`docs/13-navigation-paste-v0.7.2.md`
