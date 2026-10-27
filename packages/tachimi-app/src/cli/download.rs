use anyhow::Context;
use usage_rs::Args;

#[derive(Args)]
pub struct Download {
    #[usage(long = "key")]
    pub key: String,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct DownloadInfo {}

pub fn run(config: &crate::config::Config, args: &Download) -> anyhow::Result<()> {
    anyhow::ensure!(
        !args.key.is_empty()
            && args
                .key
                .bytes()
                .all(|c| c.is_ascii_alphanumeric() || c == b'-' || c == b'_'),
        "Key must contain only ASCII letters, digits, hyphens, or underscores"
    );
    let agent = ureq::Agent::new_with_defaults();
    let info = crate::api::fetch_info(&agent, &args.key)?;

    std::fs::create_dir_all(&config.tachie_dir)?;
    let destination = config.tachie_dir.join(format!("{}-{}", args.key, info.idx));
    if destination.exists() {
        std::fs::remove_dir_all(&destination)
            .context("Failed to remove existing tachie directory")?;
    }

    let staging = tempfile::tempdir_in(&config.tachie_dir)?;
    download_archive(&agent, &info.download, staging.path(), &config.tachie_dir)?;
    save_metadata(&agent, &args.key, info, staging.path())?;
    std::fs::rename(staging.path(), &destination).context("Failed to save tachie")?;
    println!("{}", serde_json::to_string_pretty(&DownloadInfo {})?);
    Ok(())
}

fn download_archive(
    agent: &ureq::Agent,
    url: &str,
    destination: &std::path::Path,
    temp_dir: &std::path::Path,
) -> anyhow::Result<()> {
    let mut archive_file = tempfile::tempfile_in(temp_dir)?;
    let mut response = agent.get(url).call().context("Failed to download ZIP")?;
    std::io::copy(&mut response.body_mut().as_reader(), &mut archive_file)?;
    let mut archive = zip::ZipArchive::new(archive_file).context("Failed to open ZIP")?;
    archive
        .extract(destination)
        .context("Failed to extract ZIP")
}

fn save_metadata(
    agent: &ureq::Agent,
    key: &str,
    info: crate::api::TachieApiResponse,
    destination: &std::path::Path,
) -> anyhow::Result<()> {
    let metadata_dir = destination.join(".tachimi");
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
            url: format!("https://tachie.net/w/{key}"),
            name: info.title,
            user: info.user,
            sha: info.sha,
            parent_work_url: info.parent_work_url,
            idx: info.idx,
        },
    )?;
    Ok(())
}
