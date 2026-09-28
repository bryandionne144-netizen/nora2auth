using System.Collections.ObjectModel;
using System.Text;
using GenShop.Models;
using GenShop.Services;

namespace GenShop.ViewModels;

public sealed class MainViewModel : Observable
{
    private readonly AccountStore _store;
    private readonly Dictionary<long, string> _secrets = new();
    private readonly RelayCommand _loadCommand;
    private readonly RelayCommand _newCodeCommand;
    private readonly RelayCommand _markCommand;
    private long _step = -1;
    private AppPage _page = AppPage.Products;
    private bool _busy;
    private bool _steamOn;
    private bool _rockstarOn;
    private bool _discordOn;
    private int _steamStock;
    private int _rockstarStock;
    private int _discordStock;
    private bool _liveCode;
    private bool _backgroundCopy;
    private bool _revealPassword;
    private bool _revealForm;
    private string _status = "Ajoute un compte dans Settings.";
    private string _formUser = "";
    private string _formPass = "";
    private string _formSecret = "";
    private string _formStatus = "";
    private string _discordUrl = "";
    private string _discordStatus = "";

    public MainViewModel(AccountStore store)
    {
        _store = store;
        ProductOptions = new[]
        {
            new ProductOption("steam", "Gen Steam"),
            new ProductOption("rockstar", "Gen Rockstar"),
            new ProductOption("discord", "Gen Discord")
        };
        SelectedProduct = ProductOptions[0];
        _liveCode = store.GetSetting("live_code") != "0";
        _backgroundCopy = store.GetSetting("background_copy") != "0";
        _discordUrl = store.GetSetting("discord_url") ?? "";
        DbPath = store.Path;

        _loadCommand = new RelayCommand(() => _ = LoadSelectedAsync(), () => !IsBusy);
        _newCodeCommand = new RelayCommand(() => _ = NewCodeAsync(), () => !IsBusy && HasLoaded);
        _markCommand = new RelayCommand(() => _ = MarkUsedAsync(), () => !IsBusy && HasLoaded);
        ShowProductsCommand = new RelayCommand(ShowProducts);
        ShowSettingsCommand = new RelayCommand(ShowSettings);
        ShowDiscordCommand = new RelayCommand(ShowDiscord);
        AddCommand = new RelayCommand(() => _ = AddAsync());
        DeleteCommand = new RelayCommand<long>(id => _ = DeleteAsync(id));
        ToggleRevealCommand = new RelayCommand(ToggleReveal);
        SaveDiscordCommand = new RelayCommand(SaveDiscord);
        OpenDiscordCommand = new RelayCommand(OpenDiscord);

        RefreshStock();
        SteamOn = SteamStock > 0;
        RockstarOn = RockstarStock > 0;
        DiscordOn = DiscordStock > 0;
        ReloadList();
        if (string.Equals(AppState.StartPage, "settings", StringComparison.OrdinalIgnoreCase))
            SetPage(AppPage.Settings);
        else if (string.Equals(AppState.StartPage, "discord", StringComparison.OrdinalIgnoreCase))
            SetPage(AppPage.Discord);
    }

    public Func<string, Task<bool>>? CopyAsync { get; set; }

    public ObservableCollection<LoadedRow> Rows { get; } = new();
    public ObservableCollection<AccountListItem> Accounts { get; } = new();
    public IReadOnlyList<ProductOption> ProductOptions { get; }
    public ProductOption SelectedProduct { get; set; }
    public string DbPath { get; }

    public RelayCommand LoadCommand => _loadCommand;
    public RelayCommand NewCodeCommand => _newCodeCommand;
    public RelayCommand MarkCommand => _markCommand;
    public RelayCommand ShowProductsCommand { get; }
    public RelayCommand ShowSettingsCommand { get; }
    public RelayCommand ShowDiscordCommand { get; }
    public RelayCommand AddCommand { get; }
    public RelayCommand<long> DeleteCommand { get; }
    public RelayCommand ToggleRevealCommand { get; }
    public RelayCommand SaveDiscordCommand { get; }
    public RelayCommand OpenDiscordCommand { get; }

    public bool IsProducts => _page == AppPage.Products;
    public bool IsSettings => _page == AppPage.Settings;
    public bool IsDiscord => _page == AppPage.Discord;
    public bool HasLoaded => Rows.Count > 0;
    public bool IsBusy => _busy;

    public bool SteamOn
    {
        get => _steamOn;
        set => Set(ref _steamOn, value);
    }

    public bool RockstarOn
    {
        get => _rockstarOn;
        set => Set(ref _rockstarOn, value);
    }

    public bool DiscordOn
    {
        get => _discordOn;
        set => Set(ref _discordOn, value);
    }

    public int SteamStock => _steamStock;
    public int RockstarStock => _rockstarStock;
    public int DiscordStock => _discordStock;
    public bool SteamAvailable => _steamStock > 0;
    public bool RockstarAvailable => _rockstarStock > 0;
    public bool DiscordAvailable => _discordStock > 0;
    public string SteamStockText => _steamStock.ToString();
    public string RockstarStockText => _rockstarStock.ToString();
    public string DiscordStockText => _discordStock.ToString();

    public bool LiveCode
    {
        get => _liveCode;
        set
        {
            if (!Set(ref _liveCode, value))
                return;
            _store.SetSetting("live_code", value ? "1" : "0");
        }
    }

    public bool BackgroundCopy
    {
        get => _backgroundCopy;
        set
        {
            if (!Set(ref _backgroundCopy, value))
                return;
            _store.SetSetting("background_copy", value ? "1" : "0");
        }
    }

    public bool RevealPassword => _revealPassword;
    public string RevealLabel => _revealPassword ? "Masquer" : "Afficher";

    public string Status
    {
        get => _status;
        private set => Set(ref _status, value);
    }

    public string FormUser
    {
        get => _formUser;
        set => Set(ref _formUser, value);
    }

    public string FormPass
    {
        get => _formPass;
        set => Set(ref _formPass, value);
    }

    public string FormSecret
    {
        get => _formSecret;
        set => Set(ref _formSecret, value);
    }

    public string FormStatus
    {
        get => _formStatus;
        private set => Set(ref _formStatus, value);
    }

    public bool RevealForm
    {
        get => _revealForm;
        set
        {
            if (!Set(ref _revealForm, value))
                return;
            OnPropertyChanged(nameof(PasswordMask));
        }
    }

    public char PasswordMask => _revealForm ? '\0' : '•';

    public string DiscordUrl
    {
        get => _discordUrl;
        set => Set(ref _discordUrl, value);
    }

    public string DiscordStatus
    {
        get => _discordStatus;
        private set => Set(ref _discordStatus, value);
    }

    public bool HasStock => SteamAvailable || RockstarAvailable || DiscordAvailable;

    public Task LoadSelectedAsync() => LoadAsync();

    public void Tick()
    {
        if (!LiveCode || Rows.Count == 0)
            return;

        var now = DateTimeOffset.UtcNow;
        var step = now.ToUnixTimeSeconds() / 30;
        var remain = Totp.SecondsRemaining(now) + "s";
        if (step != _step)
        {
            _step = step;
            foreach (var row in Rows)
            {
                if (!_secrets.TryGetValue(row.Id, out var secret))
                    continue;
                if (!Totp.TryCompute(secret, now, out var code, out _))
                    continue;
                row.CodeDigits = code;
                row.Code = FormatCode(code);
            }
        }

        foreach (var row in Rows)
            row.Remain = remain;
    }

    private async Task LoadAsync()
    {
        if (IsBusy)
            return;
        var selected = SelectedKeys();
        if (selected.Count == 0)
        {
            Status = "Active un produit.";
            return;
        }

        SetBusy(true);
        Status = "Recherche…";
        try
        {
            var found = await Task.Run(() =>
            {
                var rows = new List<ShopAccount>();
                var missing = new List<string>();
                foreach (var key in selected)
                {
                    var row = _store.NextAvailable(key);
                    if (row is null)
                        missing.Add(AccountStore.ProductLabel(key));
                    else
                        rows.Add(row);
                }
                return (rows, missing);
            });

            Publish(found.rows, out var failed);
            if (Rows.Count == 0)
            {
                Status = failed ?? "Aucun compte en stock.";
                return;
            }

            var copied = await CopyIfNeeded();
            var status = copied
                ? "Copié en arrière-plan."
                : BackgroundCopy
                    ? "Code affiché. Presse-papiers indisponible."
                    : "Compte chargé.";
            if (found.missing.Count > 0)
                status = string.Join(", ", found.missing) + " : aucun stock. " + status;
            if (failed is not null)
                status = failed + " " + status;
            Status = status;
        }
        catch (InvalidOperationException ex)
        {
            Status = ex.Message;
        }
        catch (Exception)
        {
            Status = "Échec du chargement.";
        }
        finally
        {
            SetBusy(false);
        }
    }

    private async Task NewCodeAsync()
    {
        if (IsBusy || Rows.Count == 0)
            return;
        _step = -1;
        Tick();
        var copied = await CopyIfNeeded();
        Status = copied ? "Nouveau code copié." : "Code affiché.";
    }

    private async Task MarkUsedAsync()
    {
        if (IsBusy || Rows.Count == 0)
            return;
        var ids = Rows.Select(row => row.Id).ToArray();
        SetBusy(true);
        try
        {
            await Task.Run(() =>
            {
                foreach (var id in ids)
                    _store.MarkDelivered(id);
            });
            ClearLoaded();
            RefreshStock();
            Status = "Marqué livré.";
        }
        catch (InvalidOperationException ex)
        {
            Status = ex.Message;
        }
        catch (Exception)
        {
            Status = "Échec du marquage.";
        }
        finally
        {
            SetBusy(false);
        }
    }

    private async Task AddAsync()
    {
        if (SelectedProduct is null)
        {
            FormStatus = "Produit inconnu.";
            return;
        }
        var product = SelectedProduct.Key;
        var user = FormUser;
        var pass = FormPass;
        var secret = FormSecret;
        try
        {
            await Task.Run(() => _store.Add(product, user, pass, secret));
            FormUser = "";
            FormPass = "";
            FormSecret = "";
            FormStatus = "Compte ajouté.";
            ReloadList();
            RefreshStock();
        }
        catch (InvalidOperationException ex)
        {
            FormStatus = ex.Message;
        }
        catch (Exception)
        {
            FormStatus = "Échec de l'ajout.";
        }
    }

    private async Task DeleteAsync(long id)
    {
        try
        {
            var removed = await Task.Run(() => _store.Delete(id));
            if (!removed)
            {
                FormStatus = "Compte introuvable.";
                return;
            }
            if (_secrets.ContainsKey(id))
            {
                ClearLoaded();
                Status = "Compte retiré.";
            }
            FormStatus = "Compte retiré.";
            ReloadList();
            RefreshStock();
        }
        catch (InvalidOperationException ex)
        {
            FormStatus = ex.Message;
        }
        catch (Exception)
        {
            FormStatus = "Échec du retrait.";
        }
    }

    private void ShowProducts()
    {
        RefreshStock();
        SetPage(AppPage.Products);
    }

    private void ShowSettings()
    {
        ReloadList();
        SetPage(AppPage.Settings);
    }

    private void ShowDiscord() => SetPage(AppPage.Discord);

    private void ToggleReveal()
    {
        _revealPassword = !_revealPassword;
        OnPropertyChanged(nameof(RevealPassword));
        OnPropertyChanged(nameof(RevealLabel));
        foreach (var row in Rows)
            row.RefreshMask(_revealPassword);
    }

    private void SaveDiscord()
    {
        if (!TryHttps(DiscordUrl, out var uri, out var error))
        {
            if (string.IsNullOrWhiteSpace(DiscordUrl))
            {
                _store.SetSetting("discord_url", "");
                DiscordStatus = "Lien effacé.";
                return;
            }
            DiscordStatus = error;
            return;
        }

        _store.SetSetting("discord_url", uri.AbsoluteUri);
        DiscordUrl = uri.AbsoluteUri;
        DiscordStatus = "Lien enregistré.";
    }

    private void OpenDiscord()
    {
        if (!TryHttps(DiscordUrl, out var uri, out var error))
        {
            DiscordStatus = error;
            return;
        }

        try
        {
            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = uri.AbsoluteUri,
                UseShellExecute = true
            });
            DiscordStatus = "Ouvert.";
        }
        catch (Exception)
        {
            DiscordStatus = "Impossible d'ouvrir le lien.";
        }
    }

    private void RefreshStock()
    {
        SetStock(ref _steamStock, _store.CountAvailable("steam"), nameof(SteamStock), nameof(SteamAvailable), nameof(SteamStockText));
        SetStock(ref _rockstarStock, _store.CountAvailable("rockstar"), nameof(RockstarStock), nameof(RockstarAvailable), nameof(RockstarStockText));
        SetStock(ref _discordStock, _store.CountAvailable("discord"), nameof(DiscordStock), nameof(DiscordAvailable), nameof(DiscordStockText));
        if (_steamStock == 0)
            SteamOn = false;
        if (_rockstarStock == 0)
            RockstarOn = false;
        if (_discordStock == 0)
            DiscordOn = false;
    }

    private void SetStock(ref int field, int value, string stockName, string availableName, string textName)
    {
        if (field == value)
            return;
        field = value;
        OnPropertyChanged(stockName);
        OnPropertyChanged(availableName);
        OnPropertyChanged(textName);
    }

    private void ReloadList()
    {
        Accounts.Clear();
        foreach (var item in _store.List())
            Accounts.Add(item);
    }

    private List<string> SelectedKeys()
    {
        var keys = new List<string>(3);
        if (SteamOn && SteamAvailable)
            keys.Add("steam");
        if (RockstarOn && RockstarAvailable)
            keys.Add("rockstar");
        if (DiscordOn && DiscordAvailable)
            keys.Add("discord");
        return keys;
    }

    private void Publish(List<ShopAccount> rows, out string? failed)
    {
        failed = null;
        ClearLoaded();
        var now = DateTimeOffset.UtcNow;
        _step = now.ToUnixTimeSeconds() / 30;
        var remain = Totp.SecondsRemaining(now) + "s";
        foreach (var row in rows)
        {
            if (!Totp.TryCompute(row.Secret, now, out var code, out var error))
            {
                failed = error;
                continue;
            }

            _secrets[row.Id] = row.Secret;
            var line = new LoadedRow
            {
                Id = row.Id,
                ProductKey = row.Product,
                Product = AccountStore.ProductLabel(row.Product),
                Username = row.Username,
                Password = row.Password,
                CodeDigits = code,
                Code = FormatCode(code),
                Remain = remain
            };
            line.RefreshMask(_revealPassword);
            Rows.Add(line);
        }

        OnPropertyChanged(nameof(HasLoaded));
        _newCodeCommand.RaiseCanExecuteChanged();
        _markCommand.RaiseCanExecuteChanged();
    }

    private async Task<bool> CopyIfNeeded()
    {
        if (!BackgroundCopy || Rows.Count == 0 || CopyAsync is null)
            return false;

        var payload = new StringBuilder();
        foreach (var row in Rows)
        {
            if (payload.Length > 0)
                payload.Append('\n');
            payload.Append(row.ProductKey);
            payload.Append(':');
            payload.Append(row.Username);
            payload.Append(':');
            payload.Append(row.Password);
            payload.Append(':');
            payload.Append(row.CodeDigits);
        }

        if (payload.Length == 0 || payload.Length > 4096)
            return false;
        return await CopyAsync(payload.ToString());
    }

    private void ClearLoaded()
    {
        _secrets.Clear();
        Rows.Clear();
        _step = -1;
        OnPropertyChanged(nameof(HasLoaded));
        _newCodeCommand.RaiseCanExecuteChanged();
        _markCommand.RaiseCanExecuteChanged();
    }

    private void SetPage(AppPage page)
    {
        if (_page == page)
            return;
        _page = page;
        OnPropertyChanged(nameof(IsProducts));
        OnPropertyChanged(nameof(IsSettings));
        OnPropertyChanged(nameof(IsDiscord));
    }

    private void SetBusy(bool value)
    {
        if (!Set(ref _busy, value, nameof(IsBusy)))
            return;
        _loadCommand.RaiseCanExecuteChanged();
        _newCodeCommand.RaiseCanExecuteChanged();
        _markCommand.RaiseCanExecuteChanged();
    }

    private static string FormatCode(string digits)
        => digits.Length == 6 ? digits[..3] + " " + digits[3..] : digits;

    private static bool TryHttps(string raw, out Uri uri, out string error)
    {
        uri = null!;
        error = "";
        var text = (raw ?? "").Trim();
        if (text.Length == 0)
        {
            error = "Lien vide.";
            return false;
        }
        if (text.Length > 300 || !Uri.TryCreate(text, UriKind.Absolute, out var parsed) || parsed.Scheme != Uri.UriSchemeHttps)
        {
            error = "Lien https uniquement.";
            return false;
        }
        uri = parsed;
        return true;
    }

    private enum AppPage
    {
        Products,
        Settings,
        Discord
    }
}
