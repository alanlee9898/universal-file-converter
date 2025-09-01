'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="relative w-11 h-11 rounded-xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-gray-200 dark:border-gray-700 hover:bg-white/90 dark:hover:bg-gray-900/90 transition-all duration-500 hover:scale-105 hover:shadow-lg group overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-amber-200/20 to-orange-300/20 dark:from-blue-600/20 dark:to-indigo-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 text-amber-600 group-hover:text-amber-500" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 text-indigo-500 group-hover:text-indigo-400" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
