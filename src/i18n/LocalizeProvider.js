import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_LOCALE,
  LingoProvider,
  LocaleContext,
  syncLocaleState,
} from './lingoShim';

import enMod from '../lingo/en.json';
import hiMod from '../lingo/hi.json';
import orMod from '../lingo/or.json';
import bnMod from '../lingo/bn.json';

const STORAGE_KEY = '@nidhisetu.locale';
const normalizeDict = (mod) => mod?.default ?? mod ?? {};

const EN = normalizeDict(enMod);
const DICTIONARIES = {
  en: EN,
  hi: normalizeDict(hiMod),
  or: normalizeDict(orMod),
  bn: normalizeDict(bnMod),
};
const getDictionaryFor = (locale) => {
  const target = DICTIONARIES[locale] || EN;
  // Merge English fallback first, then override with target locale
  return { ...EN, ...target };
};

export const LocalizeProvider = ({ children }) => {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && DICTIONARIES[saved]) {
          setLocaleState(saved);
        }
      } catch (error) {
        console.warn('Failed to load stored locale', error);
      } finally {
        setHydrated(true);
      }
    };

    bootstrap();
  }, []);

  const setLocale = useCallback((nextLocale) => {
    setLocaleState((current) => {
      const resolved = typeof nextLocale === 'function' ? nextLocale(current) : nextLocale;
      if (!resolved || !DICTIONARIES[resolved]) {
        return current;
      }
      return resolved;
    });
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const persist = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, locale);
      } catch (error) {
        console.warn('Failed to persist locale', error);
      }
    };

    persist();
  }, [locale, hydrated]);

  const dictionary = useMemo(() => getDictionaryFor(locale), [locale]);

  const contextValue = useMemo(
    () => ({
      locale,
      setLocale,
      dictionary,
    }),
    [locale, setLocale, dictionary]
  );

  useEffect(() => {
    syncLocaleState(contextValue);
  }, [contextValue]);

  const lingoDictionary = useMemo(
    () => ({
      files: {
        app: {
          entries: dictionary,
        },
      },
    }),
    [dictionary]
  );

  return (
    <LingoProvider dictionary={lingoDictionary}>
      <LocaleContext.Provider value={contextValue}>
        {children}
      </LocaleContext.Provider>
    </LingoProvider>
  );
};

export default LocalizeProvider;
