# Global Shortcut Permissions v0.6.5

## Problema

Il recorder acquisiva correttamente la combinazione di tasti ma ogni tentativo di registrazione falliva.

Il problema non era la combinazione utilizzata.

Tauri 2 applica un sistema di capabilities e permissions alle API plugin esposte al frontend JavaScript.

Le operazioni Global Shortcut devono essere autorizzate esplicitamente.

## Permissions abilitate

La capability della main window include:

- `global-shortcut:allow-register`
- `global-shortcut:allow-unregister`
- `global-shortcut:allow-is-registered`
- `global-shortcut:allow-unregister-all`

## Architettura

React Shortcut Recorder
-> Tauri JavaScript Global Shortcut API
-> Capability permission check
-> Global Shortcut plugin
-> macOS / Windows global hotkey registration

## Diagnostica

A partire dalla v0.6.5 la UI non sostituisce più ogni eccezione con il generico:

`Shortcut unavailable or already in use`

La UI visualizza invece il messaggio restituito dal plugin.

Questo permette di distinguere:

- permission denied
- accelerator non valido
- shortcut già registrata
- errore plugin
- errore sistema operativo

## Versione

Clipdeck v0.6.5

## Update v0.7

Global shortcut lifecycle and callbacks have been moved from the React/JavaScript layer to the Rust backend.

See:

`docs/11-native-shortcut-backend-v0.7.md`
