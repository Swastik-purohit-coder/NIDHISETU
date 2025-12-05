import { createContext, useCallback, useContext } from "react";
import { LingoProvider as BaseLingoProvider } from "@lingo.dev/_react/client";

export const DEFAULT_LOCALE = "en";

export const LocaleContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  dictionary: {},
});

let localeRef = DEFAULT_LOCALE;
let dictionaryRef = {};
let setLocaleRef = () => {};

export const syncLocaleState = ({ locale, dictionary, setLocale }) => {
  localeRef = locale;
  dictionaryRef = dictionary;
  setLocaleRef = setLocale;
};

export const useAppLocale = () => useContext(LocaleContext);

export const setAppLocale = (nextLocale) => {
  if (typeof setLocaleRef !== "function") {
    return;
  }

  if (typeof nextLocale === "function") {
    setLocaleRef((current) => nextLocale(current));
    return;
  }

  setLocaleRef(nextLocale);
};

export const useT = () => {
  const { dictionary } = useAppLocale();
  return useCallback(
    (key, fallback) => dictionary?.[key] ?? fallback ?? key,
    [dictionary]
  );
};

export const t = (key, fallback) => dictionaryRef?.[key] ?? fallback ?? key;

export const LingoProvider = BaseLingoProvider;

export * from "@lingo.dev/_react/client";
