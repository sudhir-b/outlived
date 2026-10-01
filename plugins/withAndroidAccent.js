// Android dialogs (alerts, the date and time pickers) take their buttons and highlights from the theme's colorAccent,
// which otherwise defaults to Android's teal. Point it at the app's accent.
const { AndroidConfig, withAndroidColors, withAndroidStyles } = require("expo/config-plugins");

module.exports = function withAndroidAccent(config, { color }) {
  config = withAndroidColors(config, (c) => {
    c.modResults = AndroidConfig.Colors.assignColorValue(c.modResults, { name: "colorAccent", value: color });
    return c;
  });
  return withAndroidStyles(config, (c) => {
    // The app theme covers alerts and the clock picker. The birthday wheel uses the date-picker library's own dialog
    // style, which doesn't inherit the app theme (its buttons are coloured from code, in Onboarding.tsx).
    for (const parent of [AndroidConfig.Styles.getAppThemeGroup(), { name: "SpinnerDatePickerDialog", parent: "SpinnerDatePickerDialogBase" }]) {
      c.modResults = AndroidConfig.Styles.assignStylesValue(c.modResults, { add: true, parent, name: "colorAccent", value: "@color/colorAccent" });
    }
    return c;
  });
};
