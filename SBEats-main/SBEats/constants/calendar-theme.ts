import { AppColor } from './design';

type ThemeColors = typeof AppColor.light;

export function getCalendarTheme(theme: ThemeColors, isDark: boolean) {
  if (isDark) {
    // Keep the previous dark-mode calendar behavior.
    return {
      calendarBackground: theme.inputBackground,
      dayTextColor: theme.text,
      monthTextColor: theme.text,
      textSectionTitleColor: theme.mutedText,
      todayTextColor: theme.tint,
      selectedDayBackgroundColor: theme.calendarSelectedDateBg,
      selectedDayTextColor: theme.calendarSelectedDateText,
      arrowColor: theme.tint,
    };
  }

  // Keep the current light-mode calendar behavior.
  return {
    calendarBackground: theme.inputBackground,
    backgroundColor: theme.inputBackground,
    dayTextColor: theme.text,
    monthTextColor: theme.text,
    textSectionTitleColor: theme.mutedText,
    textDisabledColor: '#bcb5c8',
    arrowColor: theme.tint,
    todayTextColor: theme.tint,
    selectedDayBackgroundColor: theme.calendarSelectedDateBg,
    selectedDayTextColor: theme.calendarSelectedDateText,
    dotColor: theme.tint,
    selectedDotColor: theme.calendarSelectedDateText,
  };
}

export function getCalendarPalette(theme: ThemeColors, isDark: boolean) {
  return {
    surface: theme.surface,
    inputSurface: theme.inputBackground,
    text: theme.text,
    mutedText: theme.mutedText,
    border: theme.border,
    selectedBg: theme.calendarSelectedDateBg,
    selectedText: theme.calendarSelectedDateText,
    dot: theme.tint,
    overlay: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.3)',
  };
}
