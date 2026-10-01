// Android dialogs (alerts, the date and time pickers) take their buttons and highlights from the theme's colorAccent,
// which otherwise defaults to Android's teal. Point it at the app's amber.
const { AndroidConfig, withAndroidColors, withAndroidStyles } = require("expo/config-plugins");

module.exports = function withAndroidAccent(config, { color }) {
  config = withAndroidColors(config, (c) => {
    c.modResults = AndroidConfig.Colors.assignColorValue(c.modResults, { name: "colorAccent", value: color });
    return c;
  });
  return withAndroidStyles(config, (c) => {
    // The app theme covers alerts and the clock picker. The birthday wheel is the date-picker library's own dialog
    // style, which doesn't inherit the app theme; the library leaves SpinnerDatePickerDialog empty for apps to override.
    for (const parent of [AndroidConfig.Styles.getAppThemeGroup(), { name: "SpinnerDatePickerDialog", parent: "SpinnerDatePickerDialogBase" }]) {
      c.modResults = AndroidConfig.Styles.assignStylesValue(c.modResults, { add: true, parent, name: "colorAccent", value: "@color/colorAccent" });
    }
    // That wheel is Android's own DatePickerDialog, whose buttons read the platform attribute rather than AppCompat's.
    c.modResults = AndroidConfig.Styles.assignStylesValue(c.modResults, {
      add: true,
      parent: { name: "SpinnerDatePickerDialog", parent: "SpinnerDatePickerDialogBase" },
      name: "android:colorAccent",
      value: "@color/colorAccent",
    });
    return c;
  });
};
