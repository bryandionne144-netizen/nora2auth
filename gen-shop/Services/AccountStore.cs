using System.Runtime.InteropServices;
using GenShop.Models;
using Microsoft.Data.Sqlite;

namespace GenShop.Services;

public sealed class AccountStore : IDisposable
{
    public const int UsernameMax = 128;
    public const int PasswordMax = 256;

    private readonly string _path;
    private readonly object _gate = new();
    private bool _disposed;

    public AccountStore(string? path = null)
    {
        _path = string.IsNullOrWhiteSpace(path) ? DefaultPath() : path;
        if (_path.Length > 1024)
            throw new InvalidOperationException("Chemin de base trop long.");

        var dir = System.IO.Path.GetDirectoryName(_path);
        if (string.IsNullOrEmpty(dir))
            throw new InvalidOperationException("Chemin de base invalide.");

        Directory.CreateDirectory(dir);
        lock (_gate)
        {
            using var connection = Open();
            using var cmd = connection.CreateCommand();
            cmd.CommandText =
                """
                CREATE TABLE IF NOT EXISTS accounts (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  product TEXT NOT NULL CHECK(product IN ('steam','rockstar','discord')),
                  username TEXT NOT NULL,
                  password TEXT NOT NULL,
                  totp_secret TEXT NOT NULL,
                  delivered INTEGER NOT NULL DEFAULT 0 CHECK(delivered IN (0,1)),
                  created_utc TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS settings (
                  key TEXT PRIMARY KEY,
                  value TEXT NOT NULL
                );
                """;
            cmd.ExecuteNonQuery();
        }

        TryLockDown(_path);
        TryLockDown(dir);
    }

    public string Path => _path;

    public static string DefaultPath()
    {
        var root = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        if (string.IsNullOrWhiteSpace(root))
            root = System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".local", "share");
        return System.IO.Path.Combine(root, "Gen", "gen.db");
    }

    public long Add(string product, string username, string password, string secretRaw)
    {
        product = NormalizeProduct(product);
        username = RequireText(username, "Utilisateur", UsernameMax);
        password = RequireText(password, "Mot de passe", PasswordMax);
        if (!Totp.TryNormalize(secretRaw, out var secret, out var error))
            throw new InvalidOperationException(error);

        return InLock(connection =>
        {
            using var cmd = connection.CreateCommand();
            cmd.CommandText =
                """
                INSERT INTO accounts (product, username, password, totp_secret, delivered, created_utc)
                VALUES ($product, $username, $password, $secret, 0, $created);
                """;
            Add(cmd, "$product", product);
            Add(cmd, "$username", username);
            Add(cmd, "$password", password);
            Add(cmd, "$secret", secret);
            Add(cmd, "$created", DateTimeOffset.UtcNow.ToString("O"));
            if (cmd.ExecuteNonQuery() != 1)
                throw new InvalidOperationException("Compte non enregistré.");

            using var idCmd = connection.CreateCommand();
            idCmd.CommandText = "SELECT last_insert_rowid();";
            var id = idCmd.ExecuteScalar();
            if (id is not long value || value <= 0)
                throw new InvalidOperationException("Compte non enregistré.");
            return value;
        });
    }

    public int CountAvailable(string product)
    {
        product = NormalizeProduct(product);
        return InLock(connection =>
        {
            using var cmd = connection.CreateCommand();
            cmd.CommandText = "SELECT COUNT(*) FROM accounts WHERE product = $product AND delivered = 0;";
            Add(cmd, "$product", product);
            var count = cmd.ExecuteScalar();
            return count switch
            {
                long n => checked((int)Math.Min(n, int.MaxValue)),
                int n => n,
                _ => 0
            };
        });
    }

    public ShopAccount? NextAvailable(string product)
    {
        product = NormalizeProduct(product);
        return InLock(connection =>
        {
            using var cmd = connection.CreateCommand();
            cmd.CommandText =
                """
                SELECT id, product, username, password, totp_secret
                FROM accounts
                WHERE product = $product AND delivered = 0
                ORDER BY id
                LIMIT 1;
                """;
            Add(cmd, "$product", product);
            using var reader = cmd.ExecuteReader();
            if (!reader.Read())
                return null;
            return ReadAccount(reader, delivered: false);
        });
    }

    public bool MarkDelivered(long id)
    {
        if (id <= 0)
            return false;
        return InLock(connection =>
        {
            using var cmd = connection.CreateCommand();
            cmd.CommandText = "UPDATE accounts SET delivered = 1 WHERE id = $id AND delivered = 0;";
            Add(cmd, "$id", id);
            return cmd.ExecuteNonQuery() == 1;
        });
    }

    public bool Delete(long id)
    {
        if (id <= 0)
            return false;
        return InLock(connection =>
        {
            using var cmd = connection.CreateCommand();
            cmd.CommandText = "DELETE FROM accounts WHERE id = $id;";
            Add(cmd, "$id", id);
            return cmd.ExecuteNonQuery() == 1;
        });
    }

    public IReadOnlyList<AccountListItem> List(int limit = 200)
    {
        if (limit < 1)
            limit = 1;
        if (limit > 500)
            limit = 500;

        return InLock(connection =>
        {
            using var cmd = connection.CreateCommand();
            cmd.CommandText =
                """
                SELECT id, product, username, delivered
                FROM accounts
                ORDER BY delivered ASC, id DESC
                LIMIT $limit;
                """;
            Add(cmd, "$limit", limit);
            using var reader = cmd.ExecuteReader();
            var list = new List<AccountListItem>();
            while (reader.Read())
            {
                var product = reader.GetString(1);
                var delivered = reader.GetInt64(3) != 0;
                list.Add(new AccountListItem
                {
                    Id = reader.GetInt64(0),
                    ProductLabel = ProductLabel(product),
                    Username = reader.GetString(2),
                    State = delivered ? "livré" : "en stock"
                });
            }
            return (IReadOnlyList<AccountListItem>)list;
        });
    }

    public string? GetSetting(string key)
    {
        key = RequireKey(key);
        return InLock(connection =>
        {
            using var cmd = connection.CreateCommand();
            cmd.CommandText = "SELECT value FROM settings WHERE key = $key LIMIT 1;";
            Add(cmd, "$key", key);
            return cmd.ExecuteScalar() as string;
        });
    }

    public void SetSetting(string key, string value)
    {
        key = RequireKey(key);
        if (value.Length > 300)
            throw new InvalidOperationException("Réglage trop long.");
        InLock(connection =>
        {
            using var cmd = connection.CreateCommand();
            cmd.CommandText =
                """
                INSERT INTO settings (key, value) VALUES ($key, $value)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value;
                """;
            Add(cmd, "$key", key);
            Add(cmd, "$value", value);
            cmd.ExecuteNonQuery();
            return 0;
        });
    }

    public void Dispose()
    {
        _disposed = true;
        SqliteConnection.ClearAllPools();
    }

    public static string ProductLabel(string product) => product switch
    {
        "steam" => "Gen Steam",
        "rockstar" => "Gen Rockstar",
        "discord" => "Gen Discord",
        _ => product
    };

    public static string NormalizeProduct(string product)
    {
        var key = (product ?? "").Trim().ToLowerInvariant();
        if (key is "steam" or "rockstar" or "discord")
            return key;
        throw new InvalidOperationException("Produit inconnu.");
    }

    private T InLock<T>(Func<SqliteConnection, T> action)
    {
        lock (_gate)
        {
            try
            {
                using var connection = Open();
                return action(connection);
            }
            catch (SqliteException ex)
            {
                throw new InvalidOperationException("Base refusée (" + ex.SqliteErrorCode + ").");
            }
        }
    }

    private SqliteConnection Open()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        var builder = new SqliteConnectionStringBuilder
        {
            DataSource = _path,
            Mode = SqliteOpenMode.ReadWriteCreate,
            Cache = SqliteCacheMode.Shared,
            Pooling = true
        };
        var connection = new SqliteConnection(builder.ToString());
        try
        {
            connection.Open();
            using var pragma = connection.CreateCommand();
            pragma.CommandText = "PRAGMA busy_timeout=3000;";
            pragma.ExecuteNonQuery();
            return connection;
        }
        catch (SqliteException ex)
        {
            connection.Dispose();
            throw new InvalidOperationException("Base illisible (" + ex.SqliteErrorCode + ").");
        }
    }

    private static ShopAccount ReadAccount(SqliteDataReader reader, bool delivered)
    {
        return new ShopAccount
        {
            Id = reader.GetInt64(0),
            Product = reader.GetString(1),
            Username = reader.GetString(2),
            Password = reader.GetString(3),
            Secret = reader.GetString(4),
            Delivered = delivered
        };
    }

    private static string RequireText(string value, string label, int max)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new InvalidOperationException(label + " vide.");
        var text = value.Trim();
        if (text.Length > max)
            throw new InvalidOperationException(label + " trop long.");
        if (text.IndexOfAny(['\r', '\n', '\0']) >= 0)
            throw new InvalidOperationException(label + " invalide.");
        return text;
    }

    private static string RequireKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key) || key.Length > 64)
            throw new InvalidOperationException("Réglage invalide.");
        foreach (var ch in key)
        {
            if (ch is not ((>= 'a' and <= 'z') or '_' ))
                throw new InvalidOperationException("Réglage invalide.");
        }
        return key;
    }

    private static void Add(SqliteCommand cmd, string name, string value)
    {
        cmd.Parameters.AddWithValue(name, value);
    }

    private static void Add(SqliteCommand cmd, string name, long value)
    {
        cmd.Parameters.AddWithValue(name, value);
    }

    private static void TryLockDown(string path)
    {
        if (OperatingSystem.IsWindows())
            return;
        try
        {
            chmod(path, Directory.Exists(path) ? 0x1C0 : 0x180);
        }
        catch (DllNotFoundException)
        {
        }
        catch (EntryPointNotFoundException)
        {
        }
    }

    [DllImport("libc", SetLastError = true, CharSet = CharSet.Ansi)]
    private static extern int chmod(string pathname, int mode);
}
