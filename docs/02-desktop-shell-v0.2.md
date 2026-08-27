# Desktop Shell v0.2

## Scope

Introduces the persistent desktop application shell.

## macOS

The application supports:

- menu bar presence
- optional Dock presence
- hide window without terminating the process
- reopen History from menu bar
- reopen Settings from menu bar
- Quit command
- optional Launch at Login

## Windows

Equivalent behaviour is provided through:

- system tray
- optional taskbar presence
- hide window without terminating
- reopen History from tray
- reopen Settings from tray
- Quit command
- optional Launch at Login

## Launch at Login

Implemented through the official Tauri Autostart plugin.

The preference modifies the operating system autostart registration.

It is not merely a UI setting.

## Window lifecycle

Closing the main window hides it.

The process remains active to support:

- clipboard monitoring
- global shortcuts
- tray/menu bar access

The process terminates only through the explicit Quit command or operating system termination.

## UI settings

Persistent local settings currently include:

- preferred history size
- shortcut display value
- Dock/taskbar visibility

Launch at Login state is retrieved directly from the operating system.

## Branding

Clipdeck visual branding introduced in the application UI.

The final application and menu bar/system tray assets will use dedicated optimized Clipdeck monogram assets.
