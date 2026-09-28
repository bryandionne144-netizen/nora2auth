using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using GenShop.Services;
using GenShop.ViewModels;
using GenShop.Views;

namespace GenShop;

public sealed class App : Application
{
    private AccountStore? _store;

    public override void Initialize()
    {
        AvaloniaXamlLoader.Load(this);
    }

    public override void OnFrameworkInitializationCompleted()
    {
        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            _store = new AccountStore(AppState.DbPath);
            desktop.MainWindow = new MainWindow
            {
                DataContext = new MainViewModel(_store)
            };
            desktop.ShutdownRequested += (_, _) => _store.Dispose();
        }

        base.OnFrameworkInitializationCompleted();
    }
}
