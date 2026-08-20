import { useState, useEffect } from 'react';

export type ThemeType = 'base' | 'earth' | 'emerald-gold';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeType>('base');

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('erp-theme') as ThemeType;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const changeTheme = (newTheme: ThemeType) => {
    setTheme(newTheme);
    localStorage.setItem('erp-theme', newTheme);
    if (newTheme === 'base') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  return { theme, changeTheme };
}
