# Live Shortcut Recorder v0.6.2

## Obiettivo

Migliorare la configurazione delle global shortcut mostrando in tempo reale i tasti premuti dall'utente.

## Comportamento

Quando l'utente attiva il recorder:

- Command viene mostrato come `⌘`
- Option viene mostrato come `⌥`
- Shift viene mostrato come `⇧`
- Control viene mostrato come `Ctrl`
- il tasto finale viene aggiunto alla sequenza visualizzata

Esempio:

`⌘`

poi:

`⌘ ⇧`

poi:

`⌘ ⇧ K`

## Registrazione

Una combinazione viene registrata solo quando viene rilevato anche un tasto finale valido.

Se la registrazione riesce:

- la nuova shortcut diventa attiva
- viene salvata localmente
- il recorder esce dalla modalità registrazione

Se la registrazione fallisce:

- la vecchia shortcut resta attiva
- il recorder resta aperto
- viene mostrato un errore
- l'utente può provare immediatamente un'altra combinazione

## Escape

Escape annulla la registrazione senza cambiare la shortcut esistente.

## Nota UX

La preview live è indipendente dal valore attualmente registrato.

## Update v0.6.3

Shortcut registration is now deferred until the final key has been released.

This resolves macOS registration failures caused by attempting to register a shortcut while its keys are still physically pressed.

See:

`docs/08-shortcut-registration-v0.6.3.md`
