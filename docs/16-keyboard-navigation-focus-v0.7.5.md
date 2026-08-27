# Keyboard Navigation Focus v0.7.5

## Problema

All'apertura tramite Global Shortcut, Clipdeck assegnava automaticamente il focus alla barra Search.

Questo causava due problemi:

1. i tasti numerici venivano inseriti nella Search;
2. Numeric Jump non poteva intercettare correttamente la sequenza numerica.

## Nuovo comportamento

Quando Clipdeck viene aperto tramite Global Shortcut:

1. viene mostrata la finestra;
2. la Search viene esplicitamente rimossa dal focus;
3. il focus viene assegnato al root dell'applicazione;
4. la navigazione keyboard-first è immediatamente attiva.

La Search riceve il focus soltanto quando l'utente la seleziona esplicitamente.

## Numeric Jump

Numeric Jump utilizza un buffer temporaneo.

Esempi:

`5`

seleziona la posizione 5.

`1` + `7`

seleziona la posizione 17.

`5` + `0`

seleziona la posizione 50.

`2` + `5` + `0`

seleziona la posizione 250.

Il buffer rimane attivo per 1000 ms dall'ultimo digit.

Dopo il timeout viene azzerato.

## Valori fuori range

La sequenza digitata viene comunque mantenuta e mostrata nella UI.

La selezione viene aggiornata solamente quando il numero corrisponde a una posizione esistente nello storico filtrato.

Esempio:

se lo storico contiene 50 elementi:

`5` -> seleziona 5

`5`, `0` -> seleziona 50

`5`, `1` -> mostra Jump: 51 ma non modifica la selezione.

## Search

Quando il focus è nella Search:

- lettere e numeri vengono utilizzati normalmente come query;
- Numeric Jump è sospeso;
- Escape rimuove il focus dalla Search e ripristina la navigazione dello storico.

## Keyboard architecture

La navigazione History è ora gestita esclusivamente dal listener globale `window`.

Il precedente handler React applicato al root non esegue più logica di navigazione.

Questo evita doppia elaborazione degli eventi.

## Controlli

- Arrow Up: precedente
- Arrow Down: successivo
- Numeric sequence: jump
- Enter: paste
- Escape: hide
- Click Search: search mode
- Escape from Search: return to navigation mode

## Versione

Clipdeck v0.7.5
