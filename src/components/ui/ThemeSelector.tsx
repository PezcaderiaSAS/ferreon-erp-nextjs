import React from 'react';
import { useTheme, ThemeType } from '../../hooks/useTheme';
import { Palette } from 'lucide-react';

export const ThemeSelector: React.FC = () => {
  const { theme, changeTheme } = useTheme();
  
  const themes: { id: ThemeType; name: string; colorClass: string }[] = [
    { id: 'base', name: 'Tech Dark', colorClass: 'bg-green-500' },
    { id: 'earth', name: 'Digital Earth', colorClass: 'bg-orange-400' },
    { id: 'emerald-gold', name: 'Emerald & Gold', colorClass: 'bg-yellow-500' },
  ];

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover/50 transition-colors border border-transparent hover:border-theme-border/50">
        <Palette className="h-5 w-5" />
        <span className="hidden sm:inline-block text-sm font-medium">Tema</span>
      </button>
      
      <div className="absolute right-0 mt-2 w-48 py-2 bg-theme-surface/95 backdrop-blur-xl border border-theme-border/50 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top-right scale-95 group-hover:scale-100">
        <div className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wider mb-1">
          Elegir Estilo
        </div>
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => changeTheme(t.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
              theme === t.id 
                ? 'bg-theme-surface-hover/80 text-theme-primary font-medium' 
                : 'text-theme-muted hover:bg-theme-surface-hover/40 hover:text-theme-primary'
            }`}
          >
            <div className={`w-4 h-4 rounded-full shadow-inner ${t.colorClass} ${theme === t.id ? 'ring-2 ring-offset-2 ring-offset-theme-body ring-brand-400' : ''}`} />
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
};
