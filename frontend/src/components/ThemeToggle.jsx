import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';

  return (
    <div className="theme-toggle-wrapper">
      <div className="theme-toggle" onClick={onToggle} role="button" tabIndex={0} aria-label="Toggle theme">
        <div className="theme-toggle-label">
          {isDark ? <Moon size={18} /> : <Sun size={18} />}
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </div>
        <div className="theme-toggle-track">
          <div className="theme-toggle-thumb" />
        </div>
      </div>
    </div>
  );
}
