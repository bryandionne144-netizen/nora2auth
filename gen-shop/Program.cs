using Avalonia;
using GenShop.Services;

namespace GenShop;

internal static class Program
{
    [STAThread]
    public static int Main(string[] args)
    {
        if (Has(args, "--selftest"))
            return SelfTest.Run();

        AppState.DbPath = Value(args, "--db");
        AppState.ScreenshotPath = Value(args, "--screenshot");
        AppState.StartPage = Value(args, "--page");
        BuildAvaloniaApp().StartWithClassicDesktopLifetime(args);
        return 0;
    }

    public static AppBuilder BuildAvaloniaApp()
        => AppBuilder.Configure<App>()
            .UsePlatformDetect()
            .WithInterFont()
            .LogToTrace();

    private static bool Has(string[] args, string flag)
    {
        foreach (var arg in args)
        {
            if (string.Equals(arg, flag, StringComparison.OrdinalIgnoreCase))
                return true;
        }
        return false;
    }

    private static string? Value(string[] args, string flag)
    {
        for (var i = 0; i < args.Length - 1; i++)
        {
            if (string.Equals(args[i], flag, StringComparison.OrdinalIgnoreCase))
                return args[i + 1];
        }
        return null;
    }
}
