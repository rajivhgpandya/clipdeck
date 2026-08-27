# Deterministic Focus and Paste v0.7.3

## Problema rilevato

La clipboard veniva aggiornata correttamente.

Il paste automatico funzionava in modo intermittente perché, dopo aver nascosto Clipdeck, il codice assumeva che macOS restituisse automaticamente il focus all'applicazione precedente.

Questo comportamento non è garantito.

## Nuova architettura

Quando viene attivata la Global Shortcut:

1. viene identificata l'applicazione attualmente in foreground;
2. viene memorizzato il suo bundle identifier;
3. viene aperta Clipdeck.

Quando l'utente preme Enter:

1. il contenuto selezionato viene scritto nella clipboard;
2. Clipdeck viene nascosta;
3. viene recuperato il bundle identifier precedente;
4. l'applicazione originale viene attivata esplicitamente;
5. viene applicato un delay minimo;
6. viene inviato Command+V.

## macOS

La determinazione dell'applicazione foreground utilizza System Events.

Il paste utilizza una singola invocazione AppleScript per:

- attivare l'app target;
- attendere 80 ms;
- inviare Command+V.

Questo evita la dipendenza dal focus automatico di macOS e riduce il delay percepito.

## Windows

Windows mantiene il backend Enigo per Control+V.

L'architettura Focus State è stata separata in modo da permettere una successiva implementazione Windows equivalente per il ripristino esplicito della finestra precedente.

## Stato flusso

Target application
-> Global Shortcut
-> capture foreground application
-> show Clipdeck
-> select history entry
-> Enter
-> write clipboard
-> hide Clipdeck
-> reactivate target application
-> paste

## Versione

Clipdeck v0.7.3

## Build fix v0.7.3.1

During compilation on macOS, Rust detected a lifetime issue in `remember_previous_app()` related to the temporary `MutexGuard` returned by `FocusStateStore.previous_bundle.lock()`.

The lock lifetime is now explicitly scoped so that the guard is destroyed before the Tauri `State` handle leaves scope.

Windows-only Enigo imports are also conditionally compiled to avoid unused-import warnings on macOS.

No functional change was made to the deterministic focus/paste architecture.
