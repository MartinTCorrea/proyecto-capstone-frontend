import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
}) => {
  const { isDark, toggleTheme } = useTheme();

  const label = isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      className={`p-2 rounded-lg transition-all duration-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex items-center space-x-2 ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-5 h-5 text-amber-400 transition-transform duration-300 hover:rotate-45" />
        ) : (
          <Moon className="w-5 h-5 text-slate-600 transition-transform duration-300 hover:-rotate-12" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {isDark ? 'Modo Claro' : 'Modo Oscuro'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
