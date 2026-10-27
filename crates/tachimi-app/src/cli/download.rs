use anyhow::Context;
use usage_rs::Args;

#[derive(Args)]
pub struct Download {
    #[usage(long = "key")]
    pub key: String,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct DownloadInfo {}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct TachieApiResponse {
    pub title: String,
    pub user: String,
    pub sha: String,
    #[serde(rename = "parentWorkUrl")]
    pub parent_work_url: Option<String>,
    pub thumbnail: String,
    pub date: String,
    pub idx: usize,
    pub download: String,
}

pub fn run(config: &crate::config::Config, args: &Download) -> anyhow::Result<()> {
    anyhow::ensure!(
        !args.key.is_empty()
            && args
                .key
                .bytes()
                .all(|c| c.is_ascii_alphanumeric() || c == b'-' || c == b'_'),
        "Key must contain only ASCII letters, digits, hyphens, or underscores"
    );
    let api_base = match std::env::var("TACHIMI_API_BASE") {
        Ok(value) => value,
        Err(std::env::VarError::NotPresent) => "https://tachimi.sevenc7c.com".to_owned(),
        Err(error) => return Err(error.into()),
    };
    let agent = ureq::Agent::new_with_defaults();
    let mut response = agent
        .get(format!("{}/api/tachie", api_base))
        .query("key", &args.key)
        .call()
        .context("Failed to fetch tachie information")?;
    let info: TachieApiResponse = serde_json::from_reader(response.body_mut().as_reader())
        .context("Failed to parse tachie information")?;

    std::fs::create_dir_all(&config.tachie_dir)?;
    let destination = config.tachie_dir.join(format!("{}-{}", args.key, info.idx));
    anyhow::ensure!(
        !destination.try_exists()?,
        "Tachie already exists: {:?}",
        destination
    );
    let staging = tempfile::tempdir_in(&config.tachie_dir)?;
    let mut archive_file = tempfile::tempfile_in(&config.tachie_dir)?;
    let mut response = agent
        .get(&info.download)
        .call()
        .context("Failed to download ZIP")?;
    std::io::copy(&mut response.body_mut().as_reader(), &mut archive_file)?;
    let mut archive = zip::ZipArchive::new(archive_file).context("Failed to open ZIP")?;
    archive
        .extract(staging.path())
        .context("Failed to extract ZIP")?;

    let metadata_dir = staging.path().join(".tachimi");
    std::fs::create_dir(&metadata_dir)?;
    let mut response = agent
        .get(&info.thumbnail)
        .call()
        .context("Failed to download thumbnail")?;
    std::io::copy(
        &mut response.body_mut().as_reader(),
        &mut std::fs::File::create(metadata_dir.join("thumbnail.png"))?,
    )?;
    serde_json::to_writer_pretty(
        std::fs::File::create(metadata_dir.join("data.json"))?,
        &super::list::TachieData {
            url: format!("https://tachie.net/w/{}", args.key),
            name: info.title,
            user: info.user,
            sha: info.sha,
            parent_work_url: info.parent_work_url,
            idx: info.idx,
        },
    )?;
    std::fs::rename(staging.path(), &destination).context("Failed to save tachie")?;
    println!("{}", serde_json::to_string_pretty(&DownloadInfo {})?);
    Ok(())
}
