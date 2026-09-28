using Avalonia;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Media.Imaging;
using Avalonia.Threading;
using GenShop.ViewModels;

namespace GenShop.Views;

public partial class MainWindow : Window
{
    private readonly DispatcherTimer _timer;

    public MainWindow()
    {
        InitializeComponent();
        _timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
        _timer.Tick += (_, _) => (DataContext as MainViewModel)?.Tick();
        _timer.Start();
        Closed += (_, _) => _timer.Stop();
        Opened += OnOpened;
    }

    private async void OnOpened(object? sender, EventArgs e)
    {
        var path = AppState.ScreenshotPath;
        if (string.IsNullOrWhiteSpace(path))
            return;
        try
        {
            await Task.Delay(250);
            if (DataContext is MainViewModel vm && vm.HasStock && vm.IsProducts)
            {
                vm.CopyAsync = _ => Task.FromResult(true);
                await vm.LoadSelectedAsync();
            }
            await Task.Delay(200);
            var width = Math.Max(1, (int)Bounds.Width);
            var height = Math.Max(1, (int)Bounds.Height);
            var bitmap = new RenderTargetBitmap(new PixelSize(width, height), new Vector(96, 96));
            bitmap.Render(this);
            bitmap.Save(path);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(ex.Message);
        }
        finally
        {
            Close();
        }
    }

    protected override void OnDataContextChanged(EventArgs e)
    {
        base.OnDataContextChanged(e);
        if (DataContext is MainViewModel vm)
            vm.CopyAsync = CopyTextAsync;
    }

    private void Header_OnPointerPressed(object? sender, PointerPressedEventArgs e)
    {
        if (e.Source is Button)
            return;
        if (e.GetCurrentPoint(this).Properties.IsLeftButtonPressed)
            BeginMoveDrag(e);
    }

    private void Close_OnClick(object? sender, Avalonia.Interactivity.RoutedEventArgs e) => Close();

    private async Task<bool> CopyTextAsync(string text)
    {
        var clipboard = TopLevel.GetTopLevel(this)?.Clipboard;
        if (clipboard is null || text.Length == 0 || text.Length > 4096)
            return false;
        try
        {
            await clipboard.SetTextAsync(text);
            return true;
        }
        catch (Exception)
        {
            return false;
        }
    }
}
