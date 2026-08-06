export type ThemePreference = 'light';

export function getThemePreference(): ThemePreference {
  return 'light';
}

export function getResolvedTheme(): 'light' {
  return 'light';
}

export function applyTheme(): 'light' {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('exammaster_theme_preference', 'light');
      localStorage.setItem('exammaster_theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } catch (e) {}
  }
  return 'light';
}
