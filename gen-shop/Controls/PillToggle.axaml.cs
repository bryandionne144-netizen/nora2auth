using Avalonia;
using Avalonia.Controls;
using Avalonia.Data;
using Avalonia.Input;
using Avalonia.Media;

namespace GenShop.Controls;

public partial class PillToggle : UserControl
{
    public static readonly StyledProperty<bool> IsCheckedProperty =
        AvaloniaProperty.Register<PillToggle, bool>(nameof(IsChecked), defaultBindingMode: BindingMode.TwoWay);

    public static readonly StyledProperty<string> LabelProperty =
        AvaloniaProperty.Register<PillToggle, string>(nameof(Label), string.Empty);

    private static readonly IBrush TrackOn = new SolidColorBrush(Color.Parse("#2F86FF"));
    private static readonly IBrush TrackOff = new SolidColorBrush(Color.Parse("#3A4458"));
    private static readonly IBrush TextOn = new SolidColorBrush(Color.Parse("#E7ECF5"));
    private static readonly IBrush TextOff = new SolidColorBrush(Color.Parse("#5C677A"));

    public PillToggle()
    {
        InitializeComponent();
        ApplyVisual();
    }

    public bool IsChecked
    {
        get => GetValue(IsCheckedProperty);
        set => SetValue(IsCheckedProperty, value);
    }

    public string Label
    {
        get => GetValue(LabelProperty);
        set => SetValue(LabelProperty, value);
    }

    protected override void OnPropertyChanged(AvaloniaPropertyChangedEventArgs change)
    {
        base.OnPropertyChanged(change);
        if (change.Property == IsCheckedProperty || change.Property == IsEnabledProperty || change.Property == LabelProperty)
            ApplyVisual();
    }

    private void Track_OnPointerPressed(object? sender, PointerPressedEventArgs e)
    {
        if (!IsEnabled || !e.GetCurrentPoint(this).Properties.IsLeftButtonPressed)
            return;
        IsChecked = !IsChecked;
        e.Handled = true;
    }

    private void ApplyVisual()
    {
        if (Track is null || Knob is null || Caption is null)
            return;

        Track.Background = IsChecked ? TrackOn : TrackOff;
        Track.Opacity = IsEnabled ? 1 : 0.35;
        Knob.HorizontalAlignment = IsChecked ? Avalonia.Layout.HorizontalAlignment.Right : Avalonia.Layout.HorizontalAlignment.Left;
        Caption.Text = Label;
        Caption.Foreground = IsEnabled ? TextOn : TextOff;
        Track.Cursor = IsEnabled ? new Cursor(StandardCursorType.Hand) : new Cursor(StandardCursorType.Arrow);
    }
}
