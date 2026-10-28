#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
#[serde(default)]
pub struct Config {
    pub tachie_dir: std::path::PathBuf,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            tachie_dir: tachimi_common::data_dir().join("tachies"),
        }
    }
}

pub fn load_config() -> anyhow::Result<Config> {
    let config_path = tachimi_common::data_dir().join("config.json");
    match std::fs::File::open(config_path) {
        Ok(file) => {
            let mut config: Config = serde_json::from_reader(file)?;
            config.tachie_dir = dunce::simplified(&config.tachie_dir).to_path_buf();
            Ok(config)
        }
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(Config::default()),
        Err(error) => Err(error.into()),
    }
}

pub fn save_config(config: &Config) -> anyhow::Result<()> {
    let dir = tachimi_common::data_dir();
    let mut file = tempfile::NamedTempFile::new_in(&dir)?;
    serde_json::to_writer_pretty(file.as_file_mut(), config)?;
    file.as_file().sync_all()?;
    file.persist(dir.join("config.json"))?;
    Ok(())
}
