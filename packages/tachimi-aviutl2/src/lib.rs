mod gui;
use aviutl2::generic::{GenericPlugin, GlobalEditHandle, HostAppHandle};

pub static EDIT_HANDLE: GlobalEditHandle = GlobalEditHandle::new();

#[aviutl2::plugin(GenericPlugin)]
struct TachimiPlugin {
    window: aviutl2_eframe::EframeWindow,
}

impl GenericPlugin for TachimiPlugin {
    fn new(_: aviutl2::AviUtl2Info) -> aviutl2::AnyResult<Self> {
        let window = aviutl2_eframe::EframeWindow::new("Tachimi", |cc, _| {
            cc.egui_ctx.set_fonts(aviutl2_eframe::aviutl2_fonts());
            cc.egui_ctx.all_styles_mut(|style| {
                style.visuals = aviutl2_eframe::aviutl2_visuals();
            });
            Ok(Box::new(crate::gui::TachimiApp::new()))
        })?;
        Ok(Self { window })
    }

    fn plugin_info(&self) -> aviutl2::generic::GenericPluginTable {
        aviutl2::generic::GenericPluginTable {
            name: "Tachimi".into(),
            information: format!("Tachimi for AviUtl2 v{}", env!("CARGO_PKG_VERSION")),
        }
    }

    fn register(&mut self, registry: &mut HostAppHandle) {
        EDIT_HANDLE.init(registry.create_edit_handle());
        if let Ok(handle) = self.window.handle() {
            registry.register_window_client("Tachimi", &handle).unwrap();
        }
    }
}

aviutl2::register_generic_plugin!(TachimiPlugin);
