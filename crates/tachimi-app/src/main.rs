mod cli;

fn main() {
    if std::env::args().len() == 1 {
        // コマンド未指定時はGUIを起動する

        return;
    }
    let greet = cli::Greet::parse();
    match greet.command {
        cli::Commands::ListUpdates(list_updates) => {
            if list_updates.all {
                println!("Listing all updates...");
            } else {
                println!("Listing recent updates...");
            }
        }
    }
}
