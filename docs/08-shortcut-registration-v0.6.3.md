# Shortcut Registration v0.6.3

## Problema rilevato

La preview live della shortcut funzionava correttamente, ma la registrazione della combinazione falliva sistematicamente su macOS.

La registrazione veniva tentata durante l'evento `keydown`, quindi mentre la combinazione era ancora fisicamente premuta.

## Correzione

Il recorder ora separa acquisizione e registrazione.

### Keydown

Durante `keydown`:

- vengono rilevati i modificatori;
- viene mostrata la preview live;
- viene costruita la combinazione candidata;
- la combinazione NON viene ancora registrata.

Esempio:

`Command`

`Command + Shift`

`Command + Shift + K`

### Keyup

La registrazione avviene soltanto al rilascio del tasto finale.

Dopo il rilascio viene applicato un breve delay prima di chiamare il Global Shortcut API.

Questo evita di tentare la registrazione mentre la combinazione è ancora attiva nel sistema operativo.

## Stato UI

Se la registrazione riesce:

- la nuova shortcut viene visualizzata;
- viene salvata localmente;
- diventa immediatamente attiva;
- il recorder esce dalla modalità registrazione.

Se fallisce:

- la precedente shortcut rimane attiva;
- il recorder rimane disponibile;
- viene mostrato un errore;
- l'utente può provare una combinazione diversa.

## Escape

`Escape` annulla la procedura senza modificare la shortcut esistente.

## Architettura corrente shortcut

User input
-> keydown preview
-> candidate binding
-> keyup final key
-> short delay
-> unregister previous binding
-> register new global shortcut
-> persist preference

## Versione

Clipdeck v0.6.3

## Update v0.6.4

Shortcut final keys are now derived from the physical keyboard code rather than the generated character.

This prevents macOS Option-key combinations from producing symbols such as `√` instead of the intended physical key.

See:

`docs/09-physical-key-shortcuts-v0.6.4.md`
