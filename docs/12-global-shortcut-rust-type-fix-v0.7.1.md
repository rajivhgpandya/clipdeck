# Global Shortcut Rust Type Fix v0.7.1

## Problema

Il backend Rust passava direttamente valori `String` ai metodi del plugin Tauri Global Shortcut.

Il plugin richiede invece un valore `Shortcut` parsato.

## Correzione

Le shortcut vengono ora convertite esplicitamente tramite:

`parse::<Shortcut>()`

prima delle operazioni:

- register
- unregister
- restore previous shortcut

## Effetto

La logica della v0.7 rimane invariata.

La correzione riguarda esclusivamente il tipo richiesto dall'API Rust del plugin.

## Versione

Clipdeck v0.7.1
