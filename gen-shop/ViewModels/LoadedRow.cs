namespace GenShop.ViewModels;

public sealed class LoadedRow : Observable
{
    private string _code = "";
    private string _remain = "";
    private string _passwordText = "••••••••";

    public long Id { get; init; }
    public string ProductKey { get; init; } = "";
    public string Product { get; init; } = "";
    public string Username { get; init; } = "";
    public string Password { get; init; } = "";
    public string CodeDigits { get; set; } = "";

    public string Code
    {
        get => _code;
        set => Set(ref _code, value);
    }

    public string Remain
    {
        get => _remain;
        set => Set(ref _remain, value);
    }

    public string PasswordText
    {
        get => _passwordText;
        set => Set(ref _passwordText, value);
    }

    public void RefreshMask(bool reveal) => PasswordText = reveal ? Password : "••••••••";
}
