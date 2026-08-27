# Clipdeck Architecture

Clipdeck is a local-first clipboard history application built with Tauri 2, Rust, React and TypeScript.

## Runtime flow

```text
System Clipboard
      |
      v
Rust Clipboard Watcher
      |
      v
Tauri Events
      |
      v
React History UI
      |
      v
Paste Engine
      |
      v
Previous Application
```

## Rust backend

Responsible for clipboard monitoring, global shortcuts, menu bar/system tray, window lifecycle, focus restoration and native paste behavior.

## Frontend

Responsible for history rendering, search, numeric jump, keyboard navigation, settings, appearance and preference persistence.

## Persistence

Clipboard history currently uses WebView local storage under `clipdeckClipboardHistory`.

A compatibility migration preserves history created before the Clipdeck rebrand.

SQLite remains a future persistence option.

## Platforms

macOS is currently the fully tested platform. Windows support is included in the architecture and CI pipeline and still requires end-to-end validation.
