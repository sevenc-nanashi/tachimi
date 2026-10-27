mod api;
mod cli;
mod config;

fn sync_data() -> anyhow::Result<std::fs::File> {
    let data_path = tachimi_common::data_path();
    tracing::info!("Data path: {:?}", data_path);
    let data_dir = data_path.parent().expect("Failed to get parent directory");
    std::fs::create_dir_all(data_dir)?;
    let data_lock = std::fs::File::options()
        .read(true)
        .write(true)
        .create(true)
        .truncate(false)
        .open(data_dir.join("data.lock"))?;
    data_lock.lock()?;
    let mut data_file = tempfile::NamedTempFile::new_in(data_dir)?;
    serde_json::to_writer_pretty(
        data_file.as_file_mut(),
        &tachimi_common::RootData {
            cli_path: std::env::current_exe().expect("Failed to get current executable path"),
        },
    )?;
    data_file.persist(data_path)?;

    Ok(data_lock)
}

fn run_gui() -> anyhow::Result<()> {
    let cli_path = std::env::current_exe().expect("Failed to get current executable path");
    let gui_path = cli_path.with_file_name("tachimi-gui.exe");
    tracing::info!("GUI path: {:?}", gui_path);

    if !gui_path.exists() {
        anyhow::bail!("GUI executable not found: {:?}", gui_path);
    }

    std::process::Command::new(gui_path)
        .arg(std::env::current_exe().expect("Failed to get current executable path"))
        .spawn()?;

    Ok(())
}

fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_writer(std::io::stderr)
        .with_env_filter(
            tracing_subscriber::EnvFilter::builder()
                .with_default_directive(tracing::Level::INFO.into())
                .with_env_var("TACHIMI_LOG")
                .from_env()?,
        )
        .init();

    let data_lock = sync_data()?;

    if std::env::args().len() == 1 {
        // コマンド未指定時はGUIを起動する
        run_gui()?;

        return Ok(());
    }

    let cli = cli::Greet::parse();
    let config = config::load_config()?;
    drop(data_lock);
    match cli.command {
        cli::Commands::Version(version) => cli::version::run(&config, &version),
        cli::Commands::List(list) => cli::list::run(&config, &list),
        cli::Commands::Download(download) => cli::download::run(&config, &download),
        cli::Commands::Fetch(fetch) => cli::fetch::run(&config, &fetch),
        cli::Commands::Info(info) => cli::info::run(&config, &info),
        cli::Commands::ShallowFetch(fetch) => cli::shallow_fetch::run(&config, &fetch),
    }
}
