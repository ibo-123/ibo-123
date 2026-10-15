export const getTheme = (): 'light' | 'dark' => {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return 'light';
};

export const applyTheme = (theme: 'light' | 'dark') => {
  localStorage.setItem('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    document.body.classList.add('dark-mode', 'dark');
    document.documentElement.classList.add('dark-mode', 'dark');
  } else {
    document.body.classList.remove('dark-mode', 'dark');
    document.documentElement.classList.remove('dark-mode', 'dark');
  }
};

export const toggleTheme = (): 'light' | 'dark' => {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
};

// Apply saved theme before React mounts to avoid a light flash
if (typeof document !== 'undefined') {
  applyTheme(getTheme());
}
