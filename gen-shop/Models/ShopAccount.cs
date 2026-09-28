namespace GenShop.Models;

public sealed class ShopAccount
{
    public long Id { get; init; }
    public string Product { get; init; } = "";
    public string Username { get; init; } = "";
    public string Password { get; init; } = "";
    public string Secret { get; init; } = "";
    public bool Delivered { get; init; }
}

public sealed class AccountListItem
{
    public long Id { get; init; }
    public string ProductLabel { get; init; } = "";
    public string Username { get; init; } = "";
    public string State { get; init; } = "";
}

public sealed class ProductOption
{
    public ProductOption(string key, string label)
    {
        Key = key;
        Label = label;
    }

    public string Key { get; }
    public string Label { get; }

    public override string ToString() => Label;
}
