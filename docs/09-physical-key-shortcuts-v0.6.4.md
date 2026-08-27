# Physical Key Shortcut Recording v0.6.4

## Problema

Su macOS `KeyboardEvent.key` restituisce il carattere risultante dalla combinazione di tasti.

Esempio:

`Option + V`

può produrre:

`√`

Questo rendeva errata sia la preview sia la registrazione della shortcut.

## Correzione

Il recorder utilizza ora `KeyboardEvent.code` per identificare il tasto fisico.

Esempi:

- `KeyV` -> `V`
- `KeyK` -> `K`
- `Digit5` -> `5`
- `F8` -> `F8`
- `Space` -> `Space`

I modificatori continuano a essere determinati tramite:

- metaKey
- ctrlKey
- altKey
- shiftKey

## Risultato

La combinazione:

`Command + Option + V`

viene visualizzata e registrata come:

`⌘ ⌥ V`

indipendentemente dal carattere prodotto dal layout tastiera macOS.

## Portabilità

L'utilizzo del physical key code migliora anche la coerenza tra:

- macOS
- Windows
- layout tastiera differenti

## Versione

Clipdeck v0.6.4

## Update v0.6.5

Global Shortcut plugin permissions have been explicitly enabled in the Tauri capability configuration.

The UI now surfaces the actual plugin registration error rather than reporting every failure as a shortcut conflict.

See:

`docs/10-global-shortcut-permissions-v0.6.5.md`
