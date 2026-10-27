pub mod download;
pub mod fetch;
pub mod info;
pub mod list;
pub mod shallow_fetch;
pub mod version;
use usage_rs::{Cli, Subcommands};

#[derive(Cli)]
#[usage(bin = "tachimi", version = "0.1.0", completion)]
pub struct Greet {
    #[usage(subcommand)]
    pub command: Commands,
}

#[derive(Subcommands)]
pub enum Commands {
    Version(version::Version),
    List(list::List),
    Download(download::Download),
    Fetch(fetch::Fetch),
    Info(info::Info),
    ShallowFetch(shallow_fetch::ShallowFetch),
}
