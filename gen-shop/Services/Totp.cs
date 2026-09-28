using System.Buffers.Binary;
using System.Security.Cryptography;

namespace GenShop.Services;

public static class Totp
{
    public const int SecretMaxChars = 128;
    public const int KeyMaxBytes = 80;
    private const string Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    public static bool TryNormalize(string raw, out string secret, out string error)
    {
        secret = "";
        error = "";
        if (string.IsNullOrWhiteSpace(raw))
        {
            error = "Secret 2FA vide.";
            return false;
        }

        var text = raw.Trim();
        if (text.Length > 512)
        {
            error = "Secret 2FA trop long.";
            return false;
        }

        if (text.StartsWith("otpauth://", StringComparison.OrdinalIgnoreCase))
        {
            if (!TrySecretFromOtpAuth(text, out text, out error))
                return false;
        }

        Span<char> cleaned = stackalloc char[SecretMaxChars];
        var n = 0;
        foreach (var ch in text)
        {
            if (ch is ' ' or '-' or '\t' or '=')
                continue;
            if (n >= SecretMaxChars)
            {
                error = "Secret 2FA trop long.";
                return false;
            }
            cleaned[n++] = char.ToUpperInvariant(ch);
        }

        if (n == 0)
        {
            error = "Secret 2FA vide.";
            return false;
        }

        secret = new string(cleaned[..n]);
        if (!TryCompute(secret, DateTimeOffset.UnixEpoch, out _, out error))
            return false;
        return true;
    }

    public static bool TryCompute(string secret, DateTimeOffset now, out string code, out string error)
    {
        code = "";
        error = "";
        if (string.IsNullOrEmpty(secret) || secret.Length > SecretMaxChars)
        {
            error = "Secret 2FA invalide.";
            return false;
        }

        Span<byte> key = stackalloc byte[KeyMaxBytes];
        if (!TryDecodeBase32(secret, key, out var keyLength, out error))
            return false;

        Span<byte> counter = stackalloc byte[8];
        BinaryPrimitives.WriteInt64BigEndian(counter, now.ToUnixTimeSeconds() / 30);
        Span<byte> hash = stackalloc byte[20];
        var written = HMACSHA1.HashData(key[..keyLength], counter, hash);
        CryptographicOperations.ZeroMemory(key[..keyLength]);
        if (written != 20)
        {
            error = "Code 2FA illisible.";
            return false;
        }

        var offset = hash[19] & 0x0f;
        var binary = ((hash[offset] & 0x7f) << 24)
            | (hash[offset + 1] << 16)
            | (hash[offset + 2] << 8)
            | hash[offset + 3];
        code = (binary % 1_000_000).ToString("D6");
        return true;
    }

    public static int SecondsRemaining(DateTimeOffset now)
    {
        var mod = (int)(now.ToUnixTimeSeconds() % 30);
        return mod == 0 ? 30 : 30 - mod;
    }

    private static bool TrySecretFromOtpAuth(string raw, out string secret, out string error)
    {
        secret = "";
        error = "";
        if (!Uri.TryCreate(raw, UriKind.Absolute, out var uri))
        {
            error = "Lien otpauth invalide.";
            return false;
        }

        var query = uri.Query.TrimStart('?');
        if (query.Length > 512)
        {
            error = "Lien otpauth trop long.";
            return false;
        }

        foreach (var part in query.Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var kv = part.Split('=', 2);
            if (kv.Length == 2 && kv[0].Equals("secret", StringComparison.OrdinalIgnoreCase))
            {
                secret = Uri.UnescapeDataString(kv[1]);
                return true;
            }
        }

        error = "Secret absent du lien otpauth.";
        return false;
    }

    private static bool TryDecodeBase32(string secret, Span<byte> destination, out int written, out string error)
    {
        written = 0;
        error = "";
        var buffer = 0;
        var bits = 0;
        foreach (var ch in secret)
        {
            var value = Alphabet.IndexOf(ch);
            if (value < 0)
            {
                error = "Secret 2FA invalide (base32 attendu).";
                return false;
            }

            buffer = (buffer << 5) | value;
            bits += 5;
            if (bits < 8)
                continue;

            bits -= 8;
            if (written >= destination.Length)
            {
                error = "Secret 2FA trop long.";
                return false;
            }

            destination[written++] = (byte)((buffer >> bits) & 0xFF);
        }

        if (written == 0)
        {
            error = "Secret 2FA vide.";
            return false;
        }

        return true;
    }
}
