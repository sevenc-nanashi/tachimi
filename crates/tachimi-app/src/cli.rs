use usage_rs::{Args, Cli, Subcommands};

#[derive(Cli)]
#[usage(bin = "tachimi", version = "0.1.0", completion)]
pub struct Greet {
    #[usage(subcommand)]
    pub(crate) command: Commands,
}

#[derive(Subcommands)]
pub enum Commands {
    ListUpdates(ListUpdates),
}

#[derive(Args)]
pub struct ListUpdates {
    #[usage(long = "all", help = "Show all updates")]
    pub all: bool,
}
