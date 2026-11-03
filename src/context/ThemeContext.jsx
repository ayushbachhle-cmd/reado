import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { LIGHT_COLORS, DARK_COLORS } from '../constants/colors';
import { StorageService } from '../services/storageService';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState('system'); // 'system' | 'light' | 'dark'
  const [isReady, setIsReady] = useState(false);

  // Restore saved theme preference on app start
  useEffect(() => {
    async function loadTheme() {
      try {
        const settings = await StorageService.getSettings();
        if (settings && settings.theme) {
          setThemePreferenceState(settings.theme);
        }
      } catch (err) {
        console.warn('Failed to load theme preference:', err);
      } finally {
        setIsReady(true);
      }
    }
    loadTheme();
  }, []);

  const setThemePreference = async (pref) => {
    setThemePreferenceState(pref);
    try {
      await StorageService.updateSettings({ theme: pref });
    } catch (err) {
      console.warn('Failed to persist theme preference:', err);
    }
  };

  const isDark = useMemo(() => {
    if (themePreference === 'system') {
      return systemColorScheme === 'dark';
    }
    return themePreference === 'dark';
  }, [themePreference, systemColorScheme]);

  const colors = useMemo(() => {
    return isDark ? DARK_COLORS : LIGHT_COLORS;
  }, [isDark]);

  const neuStyles = useMemo(() => {
    const borderColor = colors.border;
    const shadowColor = colors.shadow;

    return {
      neuBorder: {
        borderWidth: 2,
        borderColor,
      },
      neuBorderThick: {
        borderWidth: 2.5,
        borderColor,
      },
      neuShadowSm: Platform.select({
        web: {
          boxShadow: `2px 2px 0px ${shadowColor}`,
        },
        default: {
          shadowColor,
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 3,
        },
      }),
      neuShadow: Platform.select({
        web: {
          boxShadow: `3px 3px 0px ${shadowColor}`,
        },
        default: {
          shadowColor,
          shadowOffset: { width: 3, height: 3 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 4,
        },
      }),
      neuShadowLg: Platform.select({
        web: {
          boxShadow: `4px 4px 0px ${shadowColor}`,
        },
        default: {
          shadowColor,
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 6,
        },
      }),
    };
  }, [colors]);

  return (
    <ThemeContext.Provider
      value={{
        themePreference,
        setThemePreference,
        isDark,
        colors,
        isReady,
        ...neuStyles,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

