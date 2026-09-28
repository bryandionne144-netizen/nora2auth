using GenShop.ViewModels;

namespace GenShop.Services;

public static class SelfTest
{
    private const string RfcSecret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

    public static int Run()
    {
        try
        {
            RunAsync().GetAwaiter().GetResult();
            Console.WriteLine("selftest ok");
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(ex.ToString());
            return 1;
        }
    }

    private static async Task RunAsync()
    {
        AssertTotp(59, "287082");
        AssertTotp(1111111109, "081804");
        AssertTotp(1111111111, "050471");
        AssertTotp(1234567890, "005924");
        AssertTotp(2000000000, "279037");
        AssertTotp(20000000000, "353130");

        if (Totp.TryNormalize("!!!!!!!!", out _, out _))
            throw new InvalidOperationException("secret invalide accepté");
        if (!Totp.TryNormalize("otpauth://totp/Gen:demo?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&issuer=Gen", out var fromUri, out var uriError))
            throw new InvalidOperationException(uriError);
        if (!string.Equals(fromUri, RfcSecret, StringComparison.Ordinal))
            throw new InvalidOperationException("otpauth non lu");

        var db = Path.Combine(Path.GetTempPath(), "gen-selftest-" + Guid.NewGuid().ToString("N") + ".db");
        try
        {
            using var store = new AccountStore(db);
            var id = store.Add("steam", "demo_user", "demo_pass", RfcSecret);
            if (store.CountAvailable("steam") != 1)
                throw new InvalidOperationException("stock");
            var row = store.NextAvailable("steam") ?? throw new InvalidOperationException("lecture");
            if (row.Id != id || row.Username != "demo_user" || row.Password != "demo_pass")
                throw new InvalidOperationException("ligne");
            if (!Totp.TryCompute(row.Secret, DateTimeOffset.FromUnixTimeSeconds(59), out var code, out var error))
                throw new InvalidOperationException(error);
            if (code != "287082")
                throw new InvalidOperationException("code " + code);
            if (!store.MarkDelivered(id) || store.CountAvailable("steam") != 0)
                throw new InvalidOperationException("livraison");
            if (store.NextAvailable("steam") is not null)
                throw new InvalidOperationException("encore en stock");

            store.Add("discord", "d_user", "d_pass", RfcSecret);
            var vm = new MainViewModel(store);
            var copied = new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);
            vm.CopyAsync = text =>
            {
                copied.TrySetResult(text);
                return Task.FromResult(true);
            };
            await vm.LoadSelectedAsync().WaitAsync(TimeSpan.FromSeconds(5));
            if (!vm.HasLoaded || vm.Rows.Count != 1)
                throw new InvalidOperationException("chargement ui");
            var payload = await copied.Task.WaitAsync(TimeSpan.FromSeconds(5));
            if (!payload.StartsWith("discord:d_user:d_pass:", StringComparison.Ordinal))
                throw new InvalidOperationException("presse-papiers " + payload);
            var otp = payload[(payload.LastIndexOf(':') + 1)..];
            if (!Totp.TryCompute(RfcSecret, DateTimeOffset.UtcNow, out var expected, out var otpError))
                throw new InvalidOperationException(otpError);
            if (!string.Equals(otp, expected, StringComparison.Ordinal) && !PreviousWindow(otp))
                throw new InvalidOperationException("code ui " + otp + " attendu " + expected);
            if (vm.Rows[0].Username != "d_user" || vm.Rows[0].CodeDigits != otp)
                throw new InvalidOperationException("ligne ui");
        }
        finally
        {
            TryDelete(db);
            TryDelete(db + "-wal");
            TryDelete(db + "-shm");
        }
    }

    private static bool PreviousWindow(string otp)
    {
        return Totp.TryCompute(RfcSecret, DateTimeOffset.UtcNow.AddSeconds(-30), out var previous, out _)
            && string.Equals(otp, previous, StringComparison.Ordinal);
    }

    private static void AssertTotp(long unix, string expected)
    {
        if (!Totp.TryCompute(RfcSecret, DateTimeOffset.FromUnixTimeSeconds(unix), out var code, out var error))
            throw new InvalidOperationException(error);
        if (!string.Equals(code, expected, StringComparison.Ordinal))
            throw new InvalidOperationException("TOTP " + unix + " = " + code + " attendu " + expected);
    }

    private static void TryDelete(string path)
    {
        try
        {
            if (File.Exists(path))
                File.Delete(path);
        }
        catch (IOException)
        {
        }
    }
}
