# Global Shortcut and Paste Engine v0.6

## Purpose

This milestone implements the main clipboard-history workflow.

## Workflow

1. User works in any application.
2. User presses the configured global shortcut.
3. Clipdeck opens and receives keyboard focus.
4. Search is automatically focused.
5. Arrow Up / Arrow Down select an historical clipboard entry.
6. Enter selects the item.
7. Clipdeck hides.
8. Focus returns to the previous application.
9. The selected content is placed on the system clipboard.
10. A native paste keyboard event is generated.

## Default shortcut

macOS:

Command + Shift + V

Windows:

Control + Shift + V

## Shortcut configuration

The shortcut is not hardcoded.

Settings includes a shortcut recorder.

The user clicks the recorder and physically presses the desired key combination.

The application:

- validates the combination
- unregisters the previous shortcut
- registers the new shortcut
- persists the configuration locally
- reports registration conflicts

## Global Shortcut Engine

Implemented using the official Tauri Global Shortcut plugin.

## Paste Engine

Clipboard storage continues to use arboard.

Keyboard event simulation uses enigo.

macOS:

Command + V

Windows:

Control + V

## macOS permissions

Simulated keyboard input can require Accessibility permission.

During development macOS may associate this permission with the development executable or Terminal.

The final bundled application will be tested independently and documented under the macOS installation and permissions documentation.

## Keyboard controls

History window:

- Arrow Up: previous item
- Arrow Down: next item
- Enter: paste selected entry
- Escape: hide Clipdeck

## Persistence

The selected global shortcut is stored locally.

No cloud service is involved.

## Cross-platform target

The implementation targets:

- macOS
- Windows

## Update v0.6.1 - Shortcut Recorder

The shortcut recorder was revised after testing on macOS.

The original implementation listened for keyboard events directly on the recorder button.

The current implementation captures keyboard events at window level while shortcut-recording mode is active.

This avoids focus-related failures in the WebView and provides consistent behaviour between macOS and Windows.

See:

`docs/06-shortcut-recorder-v0.6.1.md`
