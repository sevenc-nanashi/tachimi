using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using YukkuriMovieMaker.Plugin;
using YukkuriMovieMaker.Project.Items;
using YukkuriMovieMaker.Settings;

namespace Tachimi;

public sealed class TachimiPlugin : IToolPlugin
{
    public string Name => "Tachimi";
    public bool AllowMultipleInstances => false;
    public Type ViewModelType => typeof(TachimiModel);
    public Type ViewType => typeof(TachimiView);
}

public sealed class TachimiModel : YukkuriMovieMaker.Commons.Bindable, ITimelineToolViewModel
{
    public TimelineToolInfo? Info
    {
        get;
        private set;
    }
    public bool CanPlace => Info is not null;
    public void SetTimelineToolInfo(TimelineToolInfo info)
    {
        Info = info;
        OnPropertyChanged(nameof(CanPlace));
    }
}

internal sealed record ParentWork(string id, string url);
internal sealed record Tachie(string key, string name, string user, string dir, long idx, ParentWork? parent_work);
internal sealed record RootData(string cli_path);
internal sealed record Updates(Dictionary<string, long?> revisions);

internal static class Cli
{
    public static Process Start(params string[] args)
    {
        var appName = Environment.GetEnvironmentVariable("TACHIMI_APP_NAME") ?? "tachimi";
        var path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), appName, "data.json");
        if (!File.Exists(path)) throw new IOException("Tachimi が見つかりません。先に Tachimi を起動してください。");
        var data = JsonSerializer.Deserialize<RootData>(File.ReadAllText(path)) ?? throw new IOException("Tachimi の設定を読み込めません。");
        var info = new ProcessStartInfo(data.cli_path)
        {
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8
        };
        info.Environment["TACHIMI_LOG"] = "off";
        foreach (var arg in args) info.ArgumentList.Add(arg);
        return Process.Start(info) ?? throw new IOException("Tachimi CLI を起動できません。");

    }
    public static async Task<T> Run<T>(CancellationToken token, params string[] args)
    {
        token.ThrowIfCancellationRequested();
        using var process = Start(args);
        using var registration = token.Register(() =>
        {
            try
            {
                if (!process.HasExited) process.Kill(true);
            }
            catch (InvalidOperationException)
            {
            }
        });
        var output = process.StandardOutput.ReadToEndAsync(token);
        var error = process.StandardError.ReadToEndAsync(token);
        await process.WaitForExitAsync(token);
        var text = await output;
        var message = await error;
        if (process.ExitCode != 0) throw new IOException($"Tachimi CLI の実行に失敗しました: {message}");
        return JsonSerializer.Deserialize<T>(text) ?? throw new IOException("CLI の応答が空です。");

    }
}

public sealed class TachimiView : UserControl
{
    readonly StackPanel entries = new();
    readonly StackPanel parents = new();
    readonly TextBlock copiedText = new() { TextWrapping = TextWrapping.Wrap };
    readonly TextBlock status = new()
    {
        TextWrapping = TextWrapping.Wrap
    };
    readonly Dictionary<string, CheckBox> checks = new();
    List<Tachie> tachies = [];
    CancellationTokenSource? loading;
    TachimiModel Model => (TachimiModel)DataContext;

    public TachimiView()
    {
        var root = new DockPanel
        {
            Margin = new Thickness(8)
        };
        var toolbar = new StackPanel();
        toolbar.Children.Add(Button("一覧を更新", async () => await Refresh()));
        toolbar.Children.Add(Button("UIを起動", async () =>
        {
            using var process = Cli.Start("ui");
            await Task.WhenAll(process.StandardOutput.ReadToEndAsync(), process.StandardError.ReadToEndAsync(), process.WaitForExitAsync());
            if (process.ExitCode != 0) throw new IOException("UI の起動に失敗しました。");
        }));
        toolbar.Children.Add(status);
        toolbar.Children.Add(copiedText);
        DockPanel.SetDock(toolbar, Dock.Top);
        root.Children.Add(toolbar);
        var tabs = new TabControl();
        tabs.Items.Add(new TabItem
        {
            Header = "立ち絵を配置",
            Content = new ScrollViewer
            {
                Content = entries,
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto
            }
        });
        var parentPanel = new DockPanel();
        var actions = new StackPanel();
        var autoSelect = Button("自動選択", () =>
        {
            AutoSelect();
            return Task.CompletedTask;
        });
        autoSelect.SetBinding(IsEnabledProperty, nameof(TachimiModel.CanPlace));
        actions.Children.Add(autoSelect);
        actions.Children.Add(Button("親作品IDをコピー", () =>
        {
            var ids = tachies.Where(t => checks[t.key].IsChecked == true && t.parent_work != null).Select(t => t.parent_work!.id).Distinct().ToArray();
            if (ids.Length > 0)
            {
                Clipboard.SetText(string.Join(" ", ids));
                status.Text = "コピーしました。";
            }
            return Task.CompletedTask;
        }));
        DockPanel.SetDock(actions, Dock.Top);
        parentPanel.Children.Add(actions);
        parentPanel.Children.Add(new ScrollViewer
        {
            Content = parents,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto
        });
        tabs.Items.Add(new TabItem
        {
            Header = "親作品",
            Content = parentPanel
        });
        root.Children.Add(tabs);
        Content = root;
        Loaded += async (_, _) => await Refresh();
        Unloaded += (_, _) =>
        {
            loading?.Cancel();
        };

    }

    Button Button(string label, Func<Task> action)
    {
        var button = new Button
        {
            Content = label,
            Margin = new Thickness(2),
            HorizontalContentAlignment = HorizontalAlignment.Left
        };
        button.Click += async (_, _) =>
        {
            try
            {
                await action();
            }
            catch (OperationCanceledException)
            {
            }
            catch (Exception ex)
            {
                status.Text = ex.Message;
            }
        };
        return button;

    }

    async Task Refresh()
    {
        copiedText.Text = "";
        loading?.Cancel();
        using var source = new CancellationTokenSource();
        loading = source;
        var token = source.Token;
        try
        {
            status.Text = "読み込み中...";
            var list = await Cli.Run<List<Tachie>>(token, "list");
            token.ThrowIfCancellationRequested();
            var selected = checks.Where(pair => pair.Value.IsChecked == true).Select(pair => pair.Key).ToHashSet();
            tachies = list;
            entries.Children.Clear();
            parents.Children.Clear();
            checks.Clear();
            var labels = new Dictionary<string, TextBlock>();
            foreach (var tachie in list)
            {
                var label = new TextBlock
                {
                    Text = $"{tachie.name} / {tachie.user}（更新確認中）"
                };
                labels.Add(tachie.key, label);
                var files = new StackPanel();
                var expander = new Expander
                {
                    Header = label,
                    Content = files
                };
                expander.Expanded += (_, _) =>
                {
                    try
                    {
                        files.Children.Clear();
                        foreach (var file in Scan(tachie.dir).Order())
                        {
                            var button = Button(Path.GetRelativePath(tachie.dir, file), () =>
                            {
                                Insert(file, tachie.parent_work);
                                return Task.CompletedTask;
                            });
                            button.ToolTip = "クリック：配置、Ctrl＋クリック：パスをコピー、Alt＋クリック：親作品IDをコピー";
                            button.SetBinding(IsEnabledProperty, nameof(TachimiModel.CanPlace));
                            files.Children.Add(button);
                        }
                        if (files.Children.Count == 0) files.Children.Add(new TextBlock
                        {
                            Text = "PSD・PNG ファイルが見つかりません。"
                        });
                    }
                    catch (Exception ex)
                    {
                        status.Text = ex.Message;
                    }
                };
                entries.Children.Add(expander);
                var check = new CheckBox
                {
                    Content = $"{tachie.name} / {tachie.user} ({tachie.parent_work?.id})",
                    IsEnabled = tachie.parent_work != null,
                    IsChecked = tachie.parent_work != null && selected.Contains(tachie.key),
                    Margin = new Thickness(2)
                };
                checks.Add(tachie.key, check);
                parents.Children.Add(check);

            }
            status.Text = list.Count == 0 ? "立ち絵が見つかりません。UIから追加してください。" : "更新を確認中...";
            try
            {
                var shallow = await Cli.Run<Updates>(token, "shallow-fetch");
                token.ThrowIfCancellationRequested();
                foreach (var t in list) if (shallow.revisions.TryGetValue(t.key, out var revision) && revision > t.idx) labels[t.key].Text = $"{t.name} / {t.user}（更新あり）";
            }
            catch (Exception ex) when (ex is not OperationCanceledException && !token.IsCancellationRequested)
            {
                status.Text = ex.Message;
            }
            for (int i = 0;
i < list.Count;
i++)
            {
                if (i > 0) await Task.Delay(1000, token);
                var t = list[i];
                string result;
                try
                {
                    var update = await Cli.Run<Updates>(token, "fetch", "--key", t.key);
                    if (!update.revisions.TryGetValue(t.key, out var revision) || revision is null) throw new IOException("更新情報がありません。");
                    result = revision > t.idx ? "（更新あり）" : "";
                }
                catch (Exception ex) when (ex is not OperationCanceledException && !token.IsCancellationRequested)
                {
                    result = "（更新確認失敗）";
                }
                token.ThrowIfCancellationRequested();
                labels[t.key].Text = $"{t.name} / {t.user}{result}";

            }
            if (list.Count > 0) status.Text = "立ち絵の追加・更新はUIから行えます。";

        }
        catch (OperationCanceledException)
        {
        }
        catch (Exception ex)
        {
            if (!token.IsCancellationRequested) status.Text = ex.Message;
        }
        finally
        {
            if (ReferenceEquals(loading, source)) loading = null;
        }

    }
    static IEnumerable<string> Scan(string dir)
    {
        foreach (var entry in new DirectoryInfo(dir).EnumerateFileSystemInfos())
        {
            if ((entry.Attributes & FileAttributes.ReparsePoint) != 0) continue;
            if (entry is DirectoryInfo && entry.Name != ".tachimi")
            {
                foreach (var file in Scan(entry.FullName)) yield return file;
            }
            else if (entry is FileInfo && (entry.Extension.Equals(".png", StringComparison.OrdinalIgnoreCase) || entry.Extension.Equals(".psd", StringComparison.OrdinalIgnoreCase))) yield return entry.FullName;

        }

    }
    void Insert(string file, ParentWork? parentWork)
    {
        if ((Keyboard.Modifiers & ModifierKeys.Alt) != 0)
        {
            if (parentWork is null) throw new InvalidOperationException("親作品情報がありません。");
            Clipboard.SetText(parentWork.id);
            copiedText.Text = $"コピーしました: {parentWork.id}";
            return;
        }
        if ((Keyboard.Modifiers & ModifierKeys.Control) != 0)
        {
            Clipboard.SetText(file);
            copiedText.Text = $"コピーしました: {file}";
            return;
        }
        if (Model.Info is null) throw new InvalidOperationException("プロジェクトを開いてください。");
        if (!File.Exists(file)) throw new IOException("ファイルが見つかりません。");
        ICommand? command = CommandSettings.Default[CommandType.AddFileItem];
        string[] paths = [file];
        if (command is null || !command.CanExecute(paths)) throw new InvalidOperationException("現在は配置できません。");
        command.Execute(paths);

    }
    void AutoSelect()
    {
        var info = Model.Info ?? throw new InvalidOperationException("プロジェクトを開いてください。");
        var items = info.Scenes.AllScenes.SelectMany(s => s.Timeline.Items).ToArray();
        var characters = items.OfType<VoiceItem>().Select(i => i.Character)
            .Concat(items.OfType<TachieItem>().Select(i => i.Character))
            .Concat(items.OfType<TachieFaceItem>().Select(i => i.Character))
            .Distinct();
        var paths = items.SelectMany(i => i.GetFiles())
            .Concat(characters.SelectMany(c => c.GetFiles()))
            .Select(path => Path.TrimEndingDirectorySeparator(Path.GetFullPath(path)))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        foreach (var t in tachies)
        {
            var directory = Path.TrimEndingDirectorySeparator(Path.GetFullPath(t.dir));
            var prefix = directory + Path.DirectorySeparatorChar;
            checks[t.key].IsChecked = t.parent_work != null && paths.Any(p =>
                p.Equals(directory, StringComparison.OrdinalIgnoreCase) ||
                p.StartsWith(prefix, StringComparison.OrdinalIgnoreCase));

        }

    }
}
