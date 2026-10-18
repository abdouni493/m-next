const KEY = 'theme';

/** Applies the saved admin theme before React renders (called from main.tsx). */
export function initTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    const dark = saved ? saved === 'dark' : false;
    document.documentElement.classList.toggle('dark', dark);
  } catch { /* storage unavailable */ }
}

/** Toggles dark mode, persists it and returns the new state. */
export function toggleTheme(): boolean {
  const dark = !document.documentElement.classList.contains('dark');
  document.documentElement.classList.toggle('dark', dark);
  try { localStorage.setItem(KEY, dark ? 'dark' : 'light'); } catch { /* ignore */ }
  return dark;
}
