using Avalonia;
using Avalonia.Controls;
using Avalonia.Media;

namespace GenShop.Controls;

public sealed class StarField : Control
{
    private readonly Star[] _stars;

    public StarField()
    {
        IsHitTestVisible = false;
        var rng = new Random(11);
        _stars = new Star[72];
        for (var i = 0; i < _stars.Length; i++)
        {
            _stars[i] = new Star(
                rng.NextDouble(),
                rng.NextDouble(),
                0.35 + rng.NextDouble() * 1.15,
                0.12 + rng.NextDouble() * 0.5);
        }
    }

    public override void Render(DrawingContext context)
    {
        var w = Bounds.Width;
        var h = Bounds.Height;
        if (w <= 1 || h <= 1)
            return;

        foreach (var star in _stars)
        {
            var alpha = (byte)Math.Clamp((int)(star.Alpha * 255), 0, 255);
            var brush = new SolidColorBrush(Color.FromArgb(alpha, 255, 255, 255));
            var point = new Point(star.X * w, star.Y * h);
            context.DrawEllipse(brush, null, point, star.Radius, star.Radius);
        }
    }

    private readonly record struct Star(double X, double Y, double Radius, double Alpha);
}
