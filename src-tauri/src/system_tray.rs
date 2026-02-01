use std::sync::{LazyLock, Mutex};

use tauri::{
    AppHandle, Manager,
    tray::{
        MouseButton, MouseButtonState,
        TrayIcon, TrayIconBuilder, TrayIconEvent,
    },
    menu::{MenuBuilder, MenuItemBuilder, MenuEvent},
};

static TRAY: LazyLock<Mutex<Option<TrayIcon>>> = LazyLock::new(|| Mutex::new(None));

fn build(app: &AppHandle) -> TrayIcon {
    let open = MenuItemBuilder::new("Open")
        .id("open")
        .build(app)
        .unwrap();

    let quit = MenuItemBuilder::new("Quit")
        .id("quit")
        .build(app)
        .unwrap();

    let menu = MenuBuilder::new(app)
        .item(&open)
        .item(&quit)
        .build()
        .unwrap();

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_tray_icon_event(|tray, event| match event {
            TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } => {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            _ => {}
        })
        .on_menu_event(|tray, event: MenuEvent| {
            let app = tray.app_handle();
            match event.id().0.as_str() {
                "open" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })

        .build(app)
        .expect("failed to create tray")
}

pub fn set_visibility(app: AppHandle, visible: bool) -> bool {
    let mut tray = TRAY.lock().unwrap();

    match (&*tray, visible) {
        (None, true) => {
            let icon = build(&app);
            icon.set_visible(true).ok();
            *tray = Some(icon);
            true
        }

        (Some(icon), true) => {
            icon.set_visible(true).ok();
            true
        }

        (Some(icon), false) => {
            icon.set_visible(false).ok();
            false
        }

        (None, false) => false,
    }
}

