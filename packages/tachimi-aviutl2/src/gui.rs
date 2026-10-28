use anyhow::{Context, Result, ensure};
use aviutl2_eframe::{eframe, egui};
use std::collections::HashSet;
use std::io::{Read, Seek};
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{self, Receiver, TryRecvError};
use std::thread::JoinHandle;
use std::time::{Duration, Instant};
use tachimi_common::TachieInfo;

#[derive(PartialEq)]
enum Mode {
    Placement,
    ParentWorks,
}

#[derive(Clone, Copy)]
enum UpdateStatus {
    Checking,
    Available,
    Current,
    Error,
}

enum UpdateMessage {
    Shallow(tachimi_common::ShallowUpdatesApiResponse),
    Item(usize, UpdateStatus),
}

struct UpdateCheck {
    receiver: Receiver<UpdateMessage>,
    cancelled: Arc<AtomicBool>,
    thread: Option<JoinHandle<()>>,
}

impl Drop for UpdateCheck {
    fn drop(&mut self) {
        self.cancelled.store(true, Ordering::Relaxed);
        if let Some(thread) = self.thread.take() {
            thread.thread().unpark();
            let _ = thread.join();
        }
    }
}

pub struct TachimiApp {
    tachies: Vec<TachieInfo>,
    mode: Mode,
    parent_work_keys: HashSet<String>,
    parent_work_copied_until: Option<Instant>,
    selected: Option<usize>,
    files: Vec<PathBuf>,
    error: Option<String>,
    copied_text: Option<String>,
    updates: Vec<UpdateStatus>,
    update_check: Option<UpdateCheck>,
}

impl TachimiApp {
    pub fn new() -> Self {
        let mut app = Self {
            tachies: Vec::new(),
            mode: Mode::Placement,
            parent_work_keys: HashSet::new(),
            parent_work_copied_until: None,
            selected: None,
            files: Vec::new(),
            error: None,
            copied_text: None,
            updates: Vec::new(),
            update_check: None,
        };
        app.refresh();
        app
    }

    fn refresh(&mut self) {
        self.copied_text = None;
        self.selected = None;
        self.files.clear();
        self.updates.clear();
        self.update_check = None;
        match list_tachies() {
            Ok(tachies) => {
                self.tachies = tachies;
                self.parent_work_keys.retain(|key| {
                    self.tachies
                        .iter()
                        .any(|tachie| &tachie.key == key && tachie.parent_work.is_some())
                });
                self.error = None;
                if !self.tachies.is_empty() {
                    self.updates = vec![UpdateStatus::Checking; self.tachies.len()];
                    let tachies = self.tachies.clone();
                    let (sender, receiver) = mpsc::channel();
                    let cancelled = Arc::new(AtomicBool::new(false));
                    let worker_cancelled = Arc::clone(&cancelled);
                    let thread = std::thread::spawn(move || {
                        if let Ok(output) = call_cli(&["shallow-fetch"], Some(&worker_cancelled))
                            && let Ok(updates) = serde_json::from_slice(&output)
                        {
                            if sender.send(UpdateMessage::Shallow(updates)).is_err() {
                                return;
                            }
                        }
                        for (index, tachie) in tachies.iter().enumerate() {
                            if index > 0 {
                                std::thread::park_timeout(Duration::from_secs(1));
                            }
                            if worker_cancelled.load(Ordering::Relaxed) {
                                return;
                            }
                            let status =
                                call_cli(&["fetch", "--key", &tachie.key], Some(&worker_cancelled))
                                    .and_then(|output| {
                                        let updates: tachimi_common::ShallowUpdatesApiResponse =
                                            serde_json::from_slice(&output)?;
                                        let revision = updates
                                            .revisions
                                            .get(&tachie.key)
                                            .copied()
                                            .flatten()
                                            .context("更新情報がありません")?;
                                        Ok(if revision != tachie.idx {
                                            UpdateStatus::Available
                                        } else {
                                            UpdateStatus::Current
                                        })
                                    })
                                    .unwrap_or(UpdateStatus::Error);
                            if sender.send(UpdateMessage::Item(index, status)).is_err() {
                                return;
                            }
                        }
                    });
                    self.update_check = Some(UpdateCheck {
                        receiver,
                        cancelled,
                        thread: Some(thread),
                    });
                }
            }
            Err(error) => {
                self.tachies.clear();
                self.error = Some(format!("{error:#}"));
            }
        }
    }

    fn launch_ui(&mut self) {
        match launch_ui() {
            Ok(_) => self.error = None,
            Err(error) => self.error = Some(format!("{error:#}")),
        }
    }

    fn render_toolbar(&mut self, ui: &mut egui::Ui) {
        ui.horizontal(|ui| {
            ui.heading("Tachimi");
            if ui.button("一覧を更新").clicked() {
                self.refresh();
            }
            if ui.button("UIを起動").clicked() {
                self.launch_ui();
            }
        });
        ui.horizontal(|ui| {
            ui.selectable_value(&mut self.mode, Mode::Placement, "立ち絵を配置");
            ui.selectable_value(&mut self.mode, Mode::ParentWorks, "親作品をコピー");
        });
    }

    fn render_status(&self, ui: &mut egui::Ui) {
        if let Some(text) = &self.copied_text {
            ui.label(format!("コピーしました: {text}"));
        }
        if let Some(error) = &self.error {
            ui.colored_label(ui.visuals().error_fg_color, error);
        }
        if self.update_check.is_some() {
            ui.label("更新を確認中...");
        }
        if self
            .updates
            .iter()
            .any(|status| matches!(status, UpdateStatus::Available))
        {
            ui.label("UIから立ち絵を更新できます。");
        }
        if self.tachies.is_empty() {
            ui.label("立ち絵が見つかりません。UIから立ち絵を追加してください。");
        }
    }

    fn render_tachie_list(&mut self, ui: &mut egui::Ui) {
        egui::ScrollArea::vertical()
            .id_salt("placement")
            .show(ui, |ui| {
                for index in 0..self.tachies.len() {
                    self.render_tachie_entry(ui, index);
                }
            });
    }

    fn render_tachie_entry(&mut self, ui: &mut egui::Ui, index: usize) {
        let tachie = &self.tachies[index];
        let status = match self.updates[index] {
            UpdateStatus::Checking => "（更新チェック中...）",
            UpdateStatus::Available => "（更新あり）",
            UpdateStatus::Current => "",
            UpdateStatus::Error => "（更新チェック失敗）",
        };
        if ui
            .selectable_label(
                self.selected == Some(index),
                format!("{} / {}{}", tachie.name, tachie.user, status),
            )
            .clicked()
        {
            self.selected = Some(index);
            match scan_files(&tachie.dir) {
                Ok(files) => {
                    self.files = files;
                    self.error = None;
                }
                Err(error) => {
                    self.files.clear();
                    self.error = Some(format!("{error:#}"));
                }
            }
        }
        if self.selected == Some(index) {
            ui.indent(index, |ui| self.render_files(ui, index));
        }
    }

    fn render_files(&mut self, ui: &mut egui::Ui, index: usize) {
        if self.files.is_empty() {
            ui.label("PSD・PNG ファイルが見つかりません。");
        }
        for file in &self.files {
            let relative = file
                .strip_prefix(&self.tachies[index].dir)
                .expect("scanned path is under tachie directory");
            if ui
                .button(relative.to_string_lossy())
                .on_hover_text(
                    "クリック：配置、Ctrl+クリック：パスをコピー、Alt+クリック：親作品IDをコピー",
                )
                .clicked()
            {
                if ui.input(|input| input.modifiers.alt) {
                    if let Some(parent) = &self.tachies[index].parent_work {
                        ui.copy_text(parent.id.clone());
                        self.copied_text = Some(parent.id.clone());
                        self.error = None;
                        ui.ctx().request_repaint();
                    } else {
                        self.error = Some("親作品情報がありません。".to_string());
                    }
                } else if ui.input(|input| input.modifiers.ctrl) {
                    let text = file.to_string_lossy().to_string();
                    ui.copy_text(text.clone());
                    self.copied_text = Some(text);
                    ui.ctx().request_repaint();
                } else if let Err(error) = insert_file(file) {
                    self.error = Some(format!("{error:#}"));
                }
            }
        }
    }

    fn render_parent_works(&mut self, ui: &mut egui::Ui) {
        let copied_remaining = self
            .parent_work_copied_until
            .and_then(|until| until.checked_duration_since(Instant::now()));
        if let Some(remaining) = copied_remaining {
            ui.ctx().request_repaint_after(remaining);
        }
        ui.horizontal(|ui| {
            if ui.button("自動選択").clicked() {
                match extract_tachies(&self.tachies) {
                    Ok(tachies) => {
                        self.parent_work_keys = tachies
                            .into_iter()
                            .filter(|tachie| tachie.parent_work.is_some())
                            .map(|tachie| tachie.key)
                            .collect();
                        self.error = None;
                    }
                    Err(error) => self.error = Some(format!("{error:#}")),
                }
            }
            let mut seen = HashSet::new();
            let ids: Vec<_> = self
                .tachies
                .iter()
                .filter(|tachie| self.parent_work_keys.contains(&tachie.key))
                .filter_map(|tachie| tachie.parent_work.as_ref())
                .map(|parent| parent.id.as_str())
                .filter(|id| seen.insert(*id))
                .collect();
            if ui
                .add_enabled(!ids.is_empty(), egui::Button::new("親作品IDをコピー"))
                .clicked()
            {
                ui.copy_text(ids.join(" "));
                self.parent_work_copied_until = Some(Instant::now() + Duration::from_secs(2));
                ui.ctx().request_repaint();
            }
        });
        ui.label(if copied_remaining.is_some() {
            "コピーしました。"
        } else {
            "対象の立ち絵を選択してください。"
        });
        egui::ScrollArea::vertical()
            .id_salt("parent_works")
            .show(ui, |ui| {
                for index in 0..self.tachies.len() {
                    self.render_parent_work_entry(ui, index);
                }
            });
    }

    fn render_parent_work_entry(&mut self, ui: &mut egui::Ui, index: usize) {
        let tachie = &self.tachies[index];
        let mut included = self.parent_work_keys.contains(&tachie.key);
        ui.push_id(&tachie.key, |ui| {
            if ui
                .add_enabled(
                    tachie.parent_work.is_some(),
                    egui::Checkbox::new(
                        &mut included,
                        format!("{} / {}", tachie.name, tachie.user),
                    ),
                )
                .changed()
            {
                if included {
                    self.parent_work_keys.insert(tachie.key.clone());
                } else {
                    self.parent_work_keys.remove(&tachie.key);
                }
            }
            if let Some(parent) = &tachie.parent_work {
                ui.hyperlink_to(&parent.id, &parent.url);
            } else {
                ui.label("親作品情報がありません。");
            }
        });
    }
}

impl eframe::App for TachimiApp {
    fn logic(&mut self, ctx: &egui::Context, _: &mut eframe::Frame) {
        if let Some(check) = &self.update_check {
            loop {
                match check.receiver.try_recv() {
                    Ok(UpdateMessage::Shallow(updates)) => {
                        for (index, tachie) in self.tachies.iter().enumerate() {
                            if updates
                                .revisions
                                .get(&tachie.key)
                                .copied()
                                .flatten()
                                .is_some_and(|revision| revision != tachie.idx)
                            {
                                self.updates[index] = UpdateStatus::Available;
                            }
                        }
                    }
                    Ok(UpdateMessage::Item(index, status)) => self.updates[index] = status,
                    Err(TryRecvError::Empty) => {
                        ctx.request_repaint_after(Duration::from_millis(200));
                        break;
                    }
                    Err(TryRecvError::Disconnected) => {
                        self.update_check = None;
                        for status in &mut self.updates {
                            if matches!(status, UpdateStatus::Checking) {
                                *status = UpdateStatus::Error;
                            }
                        }
                        break;
                    }
                }
            }
        }
    }
    fn ui(&mut self, ui: &mut egui::Ui, _: &mut eframe::Frame) {
        egui::CentralPanel::default().show(ui, |ui| {
            self.render_toolbar(ui);
            self.render_status(ui);
            ui.separator();
            match self.mode {
                Mode::Placement => self.render_tachie_list(ui),
                Mode::ParentWorks => self.render_parent_works(ui),
            }
        });
    }
}

// TODO: プロジェクトで使用している立ち絵を候補から抽出する。
fn extract_tachies(tachies: &[TachieInfo]) -> Result<Vec<TachieInfo>> {
    let info = crate::EDIT_HANDLE.get_edit_info();
    Ok(crate::EDIT_HANDLE.call_read_section(|read| {
        let mut tachie_keys = HashSet::<String>::new();
        for layer in 0..=info.layer_max {
            for (_pos, object) in read.objects_in_layer(layer) {
                for effect in read.get_effects(object)? {
                    let name = read.get_effect_name(effect)?;
                    for item in crate::EDIT_HANDLE.get_effect_items(&name)? {
                        if !matches!(
                            item.item_type,
                            aviutl2::generic::EffectItemType::File
                                | aviutl2::generic::EffectItemType::Folder
                        ) {
                            continue;
                        }

                        let path = read.get_effect_item_value(effect, &item.name)?;

                        let tachie = tachies.iter().find(|tachie| {
                            path.starts_with(&tachie.dir.to_string_lossy().to_string())
                        });
                        if let Some(tachie) = tachie {
                            tachie_keys.insert(tachie.key.clone());
                        }
                    }
                }
            }
        }
        anyhow::Ok(
            tachies
                .iter()
                .filter(|tachie| tachie_keys.contains(&tachie.key))
                .cloned()
                .collect(),
        )
    })??)
}

fn list_tachies() -> Result<Vec<tachimi_common::TachieInfo>> {
    serde_json::from_slice(&call_cli(&["list"], None)?).context("立ち絵一覧を読み込めませんでした")
}

fn call_cli(args: &[&str], cancelled: Option<&AtomicBool>) -> Result<Vec<u8>> {
    let file = std::fs::File::open(tachimi_common::data_path())
        .context("Tachimi が見つかりません。先に Tachimi を起動してください")?;
    let data: tachimi_common::RootData =
        serde_json::from_reader(file).context("Tachimi の設定を読み込めませんでした")?;
    let mut command = Command::new(data.cli_path);
    command
        .args(args)
        .env("TACHIMI_LOG", "off")
        .creation_flags(0x08000000)
        .stdin(Stdio::null());
    let output = if let Some(cancelled) = cancelled {
        ensure!(!cancelled.load(Ordering::Relaxed), "更新確認を中止しました");
        let mut stdout = tempfile::tempfile()?;
        let mut stderr = tempfile::tempfile()?;
        let mut child = command
            .stdout(stdout.try_clone()?)
            .stderr(stderr.try_clone()?)
            .spawn()
            .context("Tachimi CLI を起動できませんでした。Tachimi を再起動してください")?;
        let status = loop {
            if cancelled.load(Ordering::Relaxed) {
                let _ = child.kill();
                let _ = child.wait();
                anyhow::bail!("更新確認を中止しました");
            }
            match child.try_wait() {
                Ok(Some(status)) => break status,
                Ok(None) => std::thread::park_timeout(Duration::from_millis(100)),
                Err(error) => {
                    let _ = child.kill();
                    let _ = child.wait();
                    return Err(error.into());
                }
            }
        };
        stdout.rewind()?;
        stderr.rewind()?;
        let mut output = std::process::Output {
            status,
            stdout: Vec::new(),
            stderr: Vec::new(),
        };
        stdout.read_to_end(&mut output.stdout)?;
        stderr.read_to_end(&mut output.stderr)?;
        output
    } else {
        command
            .output()
            .context("Tachimi CLI を起動できませんでした。Tachimi を再起動してください")?
    };
    ensure!(
        output.status.success(),
        "Tachimi CLI の実行に失敗しました: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    Ok(output.stdout)
}

fn scan_files(root: &Path) -> Result<Vec<PathBuf>> {
    fn scan(dir: &Path, files: &mut Vec<PathBuf>) -> Result<()> {
        for entry in std::fs::read_dir(dir)
            .with_context(|| format!("フォルダーを読み込めません: {}", dir.display()))?
        {
            let entry = entry?;
            let kind = entry.file_type()?;
            if kind.is_dir() && entry.file_name() != ".tachimi" {
                scan(&entry.path(), files)?;
            } else if kind.is_file()
                && entry.path().extension().is_some_and(|ext| {
                    ext.eq_ignore_ascii_case("png") || ext.eq_ignore_ascii_case("psd")
                })
            {
                files.push(entry.path());
            }
        }
        Ok(())
    }
    let mut files = Vec::new();
    scan(root, &mut files)?;
    files.sort();
    Ok(files)
}

fn insert_file(path: &Path) -> Result<()> {
    ensure!(
        path.is_file(),
        "ファイルが見つかりません: {}",
        path.display()
    );
    if path
        .extension()
        .is_some_and(|ext| ext.eq_ignore_ascii_case("psd"))
    {
        crate::EDIT_HANDLE.call_edit_section(|edit| -> Result<()> {
            let psd_object = edit
                .create_object(
                    "PSDファイル@PSDToolKit",
                    edit.info.layer,
                    edit.info.frame,
                    None,
                )
                .context("PSDToolKit が見つかりません。PSDToolKit をインストールしてください")?;

            edit.set_object_effect_item(
                psd_object,
                "PSDファイル@PSDToolKit",
                0,
                "PSDファイル",
                &path.to_string_lossy(),
            )
            .context("PSDToolKit にファイルを設定できませんでした")?;
            Ok(())
        })??;
    } else {
        crate::EDIT_HANDLE.call_edit_section(|edit| -> Result<()> {
            edit.create_object_from_media_file(path, edit.info.layer, edit.info.frame, None)
                .context("画像を配置できませんでした")?;
            Ok(())
        })??;
    }
    Ok(())
}

fn launch_ui() -> Result<()> {
    let file = std::fs::File::open(tachimi_common::data_path())
        .context("Tachimi が見つかりません。先に Tachimi を起動してください")?;
    let data: tachimi_common::RootData =
        serde_json::from_reader(file).context("Tachimi の設定を読み込めませんでした")?;
    Command::new(data.cli_path)
        .arg("ui")
        .env("TACHIMI_LOG", "off")
        .creation_flags(0x08000000)
        .stdin(Stdio::null())
        .spawn()
        .context("Tachimi UI を起動できませんでした。Tachimi を再起動してください")?;
    Ok(())
}
