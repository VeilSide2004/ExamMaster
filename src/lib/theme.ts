export type ThemePreference = 'system' | 'light' | 'dark';

export function getThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const pref = localStorage.getItem('exammaster_theme_preference');
    if (pref === 'system' || pref === 'light' || pref === 'dark') {
      return pref as ThemePreference;
    }
    const legacy = localStorage.getItem('exammaster_theme');
    if (legacy === 'dark' || legacy === 'light') {
      return legacy as ThemePreference;
    }
  } catch (e) {}
  return 'system';
}

export function getResolvedTheme(pref?: ThemePreference): 'light' | 'dark' {
  const currentPref = pref || getThemePreference();
  if (currentPref === 'dark') return 'dark';
  if (currentPref === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function applyTheme(pref: ThemePreference): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const resolved = getResolvedTheme(pref);
  try {
    localStorage.setItem('exammaster_theme_preference', pref);
    localStorage.setItem('exammaster_theme', resolved);

    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    window.dispatchEvent(new CustomEvent('exammaster_theme_change', { detail: { pref, resolved } }));
  } catch (e) {}
  return resolved;
}
