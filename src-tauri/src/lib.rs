use std::sync::Mutex;
use std::thread;
use std::time::Duration;

#[cfg(target_os = "macos")]
use std::process::Command;

#[cfg(target_os = "windows")]
use enigo::{
    Direction::{Click, Press, Release},
    Enigo, Key, Keyboard, Settings,
};

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter,
    Manager,
    State,
};

use tauri_plugin_global_shortcut::{
    GlobalShortcutExt,
    Shortcut,
    ShortcutState,
};

struct ShortcutStateStore {
    current: Mutex<Option<String>>,
}

struct FocusStateStore {
    previous_bundle: Mutex<Option<String>>,
}

#[cfg(target_os = "macos")]
fn frontmost_bundle_id() -> Option<String> {
    let output = Command::new("osascript")
        .arg("-e")
        .arg(
            r#"tell application "System Events" to get bundle identifier of first application process whose frontmost is true"#,
        )
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let bundle =
        String::from_utf8_lossy(&output.stdout)
            .trim()
            .to_string();

    if bundle.is_empty() {
        None
    } else {
        Some(bundle)
    }
}

#[cfg(not(target_os = "macos"))]
fn frontmost_bundle_id() -> Option<String> {
    None
}

fn remember_previous_app(app: &tauri::AppHandle) {
    if let Some(bundle) = frontmost_bundle_id() {
        let state =
            app.state::<FocusStateStore>();

        {
            let lock_result =
                state.previous_bundle.lock();

            if let Ok(mut guard) = lock_result {
                *guard = Some(bundle);
            }
        }
    }
}

fn show_history_window(
    app: &tauri::AppHandle,
) {
    remember_previous_app(app);

    if let Some(window) =
        app.get_webview_window("main")
    {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();

        let _ = window.emit(
            "navigate",
            "history",
        );
}
}

#[tauri::command]
fn set_app_visibility_mode(
    window: tauri::WebviewWindow,
    show_in_dock_or_taskbar: bool,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        window
            .app_handle()
            .set_dock_visibility(
                show_in_dock_or_taskbar
            )
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        window
            .set_skip_taskbar(
                !show_in_dock_or_taskbar
            )
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn write_clipboard_text(
    text: String,
) -> Result<(), String> {
    let mut clipboard =
        arboard::Clipboard::new()
            .map_err(|e| e.to_string())?;

    clipboard
        .set_text(text)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn register_global_shortcut(
    app: tauri::AppHandle,
    state: State<ShortcutStateStore>,
    shortcut: String,
) -> Result<(), String> {
    let manager =
        app.global_shortcut();

    let previous = {
        let guard = state
            .current
            .lock()
            .map_err(|e| e.to_string())?;

        guard.clone()
    };

    if let Some(old) =
        previous.as_ref()
    {
        if let Ok(parsed_old) =
            old.parse::<Shortcut>()
        {
            let _ =
                manager.unregister(
                    parsed_old
                );
        }
    }

    let parsed_shortcut =
        shortcut
            .parse::<Shortcut>()
            .map_err(|e| {
                format!(
                    "invalid shortcut: {e}"
                )
            })?;

    let registration =
        manager.on_shortcut(
            parsed_shortcut,
            move |
                app,
                _shortcut,
                event
            | {
                if event.state ==
                    ShortcutState::Pressed
                {
                    show_history_window(
                        app
                    );
                }
            },
        );

    match registration {
        Ok(_) => {
            let mut guard =
                state
                    .current
                    .lock()
                    .map_err(
                        |e| e.to_string()
                    )?;

            *guard = Some(shortcut);

            Ok(())
        }

        Err(error) => {
            if let Some(old) =
                previous
            {
                if let Ok(parsed_old) =
                    old.parse::<Shortcut>()
                {
                    let _ =
                        manager.on_shortcut(
                            parsed_old,
                            move |
                                app,
                                _shortcut,
                                event
                            | {
                                if event.state ==
                                    ShortcutState::Pressed
                                {
                                    show_history_window(
                                        app
                                    );
                                }
                            },
                        );
                }

                if let Ok(mut guard) =
                    state.current.lock()
                {
                    *guard = Some(old);
                }
            }

            Err(error.to_string())
        }
    }
}

#[tauri::command]
fn paste_clipboard_text(
    text: String,
    window: tauri::WebviewWindow,
    focus_state: State<FocusStateStore>,
) -> Result<String, String> {
    /*
     * STEP 1
     * Aggiorna sempre la clipboard.
     */
    let mut clipboard =
        arboard::Clipboard::new()
            .map_err(|e| {
                format!(
                    "clipboard init failed: {e}"
                )
            })?;

    clipboard
        .set_text(text)
        .map_err(|e| {
            format!(
                "clipboard write failed: {e}"
            )
        })?;

    /*
     * STEP 2
     * Recupera l'applicazione che era
     * davanti PRIMA di aprire Clipdeck.
     */
    let previous_bundle = {
        let guard =
            focus_state
                .previous_bundle
                .lock()
                .map_err(
                    |e| e.to_string()
                )?;

        guard.clone()
    };

    /*
     * STEP 3
     * Nasconde Clipdeck.
     */
    window
        .hide()
        .map_err(|e| {
            format!(
                "window hide failed: {e}"
            )
        })?;

    #[cfg(target_os = "macos")]
    {
        let bundle =
            previous_bundle.ok_or_else(|| {
                "previous application not known"
                    .to_string()
            })?;

        /*
         * Bundle ID macOS:
         * solo caratteri validi attesi.
         */
        if !bundle
            .chars()
            .all(|c| {
                c.is_ascii_alphanumeric()
                    || c == '.'
                    || c == '-'
                    || c == '_'
            })
        {
            return Err(
                "invalid previous application bundle id"
                    .to_string()
            );
        }

        /*
         * Un'unica esecuzione AppleScript:
         *
         * 1. riattiva esplicitamente l'app
         * 2. aspetta solo 80 ms
         * 3. invia Command+V
         *
         * Non dipendiamo più dal focus
         * automatico di macOS.
         */
        let script = format!(
            r#"
tell application id "{bundle}" to activate
delay 0.08
tell application "System Events"
    keystroke "v" using {{command down}}
end tell
"#
        );

        let output =
            Command::new("osascript")
                .arg("-e")
                .arg(script)
                .output()
                .map_err(|e| {
                    format!(
                        "macOS paste engine failed to start: {e}"
                    )
                })?;

        if !output.status.success() {
            let stderr =
                String::from_utf8_lossy(
                    &output.stderr
                );

            return Err(
                format!(
                    "macOS paste failed: {}",
                    stderr.trim()
                )
            );
        }
    }

    #[cfg(target_os = "windows")]
    {
        thread::sleep(
            Duration::from_millis(120)
        );

        let mut enigo =
            Enigo::new(
                &Settings::default()
            )
            .map_err(|e| {
                format!(
                    "keyboard engine init failed: {e}"
                )
            })?;

        enigo
            .key(Key::Control, Press)
            .map_err(|e| {
                format!(
                    "ctrl press failed: {e}"
                )
            })?;

        enigo
            .key(
                Key::Unicode('v'),
                Click
            )
            .map_err(|e| {
                format!(
                    "V click failed: {e}"
                )
            })?;

        enigo
            .key(
                Key::Control,
                Release
            )
            .map_err(|e| {
                format!(
                    "ctrl release failed: {e}"
                )
            })?;
    }

    Ok(
        "paste command sent"
            .to_string()
    )
}

#[tauri::command]
fn confirm_quit(
    app: tauri::AppHandle,
) {
    app.exit(0);
}

#[cfg_attr(
    mobile,
    tauri::mobile_entry_point
)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_autostart::init(
                tauri_plugin_autostart::
                    MacosLauncher::
                    LaunchAgent,
                None,
            ),
        )
        .plugin(
            tauri_plugin_global_shortcut::
                Builder::new()
                .build(),
        )
        .plugin(
            tauri_plugin_macos_permissions::init()
        )
        .manage(
            ShortcutStateStore {
                current:
                    Mutex::new(None),
            }
        )
        .manage(
            FocusStateStore {
                previous_bundle:
                    Mutex::new(None),
            }
        )
        .invoke_handler(
            tauri::generate_handler![
                set_app_visibility_mode,
                write_clipboard_text,
                register_global_shortcut,
                paste_clipboard_text,
                confirm_quit,
            ]
        )
        .setup(|app| {
            /*
             * CLIPBOARD WATCHER
             */
            let clipboard_app =
                app.handle().clone();

            thread::spawn(move || {
                let mut clipboard =
                    match
                        arboard::
                        Clipboard::new()
                    {
                        Ok(c) => c,

                        Err(error) => {
                            eprintln!(
                                "Clipboard initialization error: {error}"
                            );
                            return;
                        }
                    };

                let mut last_text =
                    String::new();

                loop {
                    if let Ok(text) =
                        clipboard.get_text()
                    {
                        if !text.is_empty()
                            &&
                            text != last_text
                        {
                            last_text =
                                text.clone();

                            let _ =
                                clipboard_app
                                    .emit(
                                        "clipboard-changed",
                                        text,
                                    );
                        }
                    }

                    thread::sleep(
                        Duration::
                            from_millis(
                                400
                            )
                    );
                }
            });

            /*
             * MENU BAR / TRAY
             */
            let open_history =
                MenuItem::with_id(
                    app,
                    "open_history",
                    "Open History",
                    true,
                    None::<&str>,
                )?;

            let settings =
                MenuItem::with_id(
                    app,
                    "settings",
                    "Settings",
                    true,
                    None::<&str>,
                )?;

            let quit =
                MenuItem::with_id(
                    app,
                    "quit",
                    "Quit Clipdeck",
                    true,
                    None::<&str>,
                )?;

            let menu =
                Menu::with_items(
                    app,
                    &[
                        &open_history,
                        &settings,
                        &quit,
                    ],
                )?;

            let tray_icon =
                tauri::include_image!(
                    "./icons/custom/clipboard-tray.png"
                );

            TrayIconBuilder::new()
                .menu(&menu)
                .tooltip(
                    "Clipdeck"
                )
                .icon(tray_icon)
                .icon_as_template(true)
                .on_menu_event(
                    |app, event| {
                        match
                            event
                                .id()
                                .as_ref()
                        {
                            "open_history" => {
                                show_history_window(
                                    app
                                );
                            }

                            "settings" => {
                                remember_previous_app(
                                    app
                                );

                                if let Some(window) =
                                    app.get_webview_window(
                                        "main"
                                    )
                                {
                                    let _ =
                                        window.show();

                                    let _ =
                                        window.unminimize();

                                    let _ =
                                        window.set_focus();

                                    let _ =
                                        window.emit(
                                            "navigate",
                                            "settings",
                                        );
                                }
                            }

                            "quit" => {
                                if let Some(window) =
                                    app.get_webview_window(
                                        "main"
                                    )
                                {
                                    let _ =
                                        window.emit(
                                            "before-quit",
                                            (),
                                        );
                                } else {
                                    app.exit(0);
                                }
                            }

                            _ => {}
                        }
                    }
                )
                .build(app)?;

            Ok(())
        })
        .on_window_event(
            |window, event| {
                if let
                    tauri::WindowEvent::
                        CloseRequested {
                            api,
                            ..
                        } = event
                {
                    api.prevent_close();

                    let _ =
                        window.hide();
                }
            },
        )
        .run(
            tauri::generate_context!()
        )
        .expect(
            "error while running Tauri application"
        );
}


#[cfg(test)]
mod hardening_tests {
    fn valid_bundle_id(
        bundle_id: &str,
    ) -> bool {
        !bundle_id.is_empty()
            && bundle_id
                .chars()
                .all(|character| {
                    character
                        .is_ascii_alphanumeric()
                        || character == '.'
                        || character == '-'
                        || character == '_'
                })
    }

    #[test]
    fn bundle_id_accepts_normal_ids() {
        assert!(
            valid_bundle_id(
                "com.apple.TextEdit"
            )
        );

        assert!(
            valid_bundle_id(
                "app.clipdeck.desktop"
            )
        );
    }

    #[test]
    fn bundle_id_rejects_applescript_injection() {
        assert!(
            !valid_bundle_id(
                "com.test\" & do shell script \"rm -rf /"
            )
        );

        assert!(
            !valid_bundle_id(
                "com.test\nmalicious"
            )
        );
    }

    #[test]
    fn bundle_id_rejects_empty_value() {
        assert!(
            !valid_bundle_id("")
        );
    }
}
