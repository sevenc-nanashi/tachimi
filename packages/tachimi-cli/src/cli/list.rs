use anyhow::Context;
use tachimi_common::{ParentWork, TachieInfo};

use usage_rs::Args;

#[derive(Args)]
pub struct List {}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct TachieData {
    pub key: String,
    pub url: String,
    pub name: String,
    pub user: String,
    pub sha: String,
    pub parent_work_url: Option<String>,
    pub idx: usize,
}

pub fn run(config: &crate::config::Config, _list: &List) -> anyhow::Result<()> {
    let tachie_infos = list_tachies(config)?;
    println!("{}", serde_json::to_string_pretty(&tachie_infos)?);
    Ok(())
}

pub(super) fn list_tachies(config: &crate::config::Config) -> anyhow::Result<Vec<TachieInfo>> {
    let tachie_dir = &config.tachie_dir;
    if !tachie_dir.exists() {
        anyhow::bail!("Tachie directory does not exist: {:?}", tachie_dir);
    }
    let mut tachie_infos: Vec<TachieInfo> = Vec::new();

    for entry in std::fs::read_dir(tachie_dir)? {
        let entry = entry?;
        let path = entry.path();
        match read_tachie_dir(&path) {
            Ok(tachie_info) => tachie_infos.push(tachie_info),
            Err(e) => {
                tracing::error!("Failed to read tachie directory {:?}: {:?}", path, e);
            }
        }
    }
    Ok(tachie_infos)
}

#[hooq::hooq(anyhow)]
fn read_tachie_dir(tachie_dir: &std::path::Path) -> anyhow::Result<TachieInfo> {
    let root = tachie_dir.join(".tachimi");
    let data_path = root.join("data.json");
    let data_file = std::fs::File::open(&data_path)
        .map_err(|e| anyhow::anyhow!("Failed to open data file {:?}: {:?}", data_path, e))?;
    let tachie_data: TachieData = serde_json::from_reader(data_file)
        .map_err(|e| anyhow::anyhow!("Failed to parse data file {:?}: {:?}", data_path, e))?;
    let thumbnail_path = root.join("thumbnail.png");
    let parent_work = tachie_data
        .parent_work_url
        .map(|url| -> anyhow::Result<ParentWork> {
            let id = lazy_regex::regex_find!(r"[a-z]{2}[0-9]+", &url)
                .with_context(|| format!("Parent work ID not found in URL: {url}"))?
                .to_owned();
            Ok(ParentWork { url, id })
        })
        .transpose()?;
    Ok(TachieInfo {
        dir: tachie_dir.to_path_buf(),
        key: tachie_data.key,
        url: tachie_data.url,
        name: tachie_data.name,
        user: tachie_data.user,
        sha: tachie_data.sha,
        parent_work,
        idx: tachie_data.idx,
        thumbnail: thumbnail_path,
    })
}

pub(super) fn find_tachie_dir(
    config: &crate::config::Config,
    key: &str,
) -> anyhow::Result<Option<std::path::PathBuf>> {
    let mut matches = list_tachies(config)?
        .into_iter()
        .filter(|item| item.key == key);
    let Some(item) = matches.next() else {
        return Ok(None);
    };
    anyhow::ensure!(
        matches.next().is_none(),
        "同じキーの立ち絵が複数あります: {key}"
    );
    let root = config.tachie_dir.canonicalize()?;
    let dir = item.dir.canonicalize()?;
    anyhow::ensure!(
        dir.parent() == Some(root.as_path()) && !std::fs::symlink_metadata(&item.dir)?.is_symlink(),
        "立ち絵フォルダが保存先の直下にありません: {:?}",
        item.dir
    );
    Ok(Some(item.dir))
}
