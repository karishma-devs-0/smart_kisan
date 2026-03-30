import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en';
import hi from './locales/hi';
import pa from './locales/pa';
import mr from './locales/mr';
import te from './locales/te';
import ta from './locales/ta';
import kn from './locales/kn';
import bn from './locales/bn';
import gu from './locales/gu';
import ml from './locales/ml';

const LANGUAGE_KEY = '@smartkisan_language';

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
    } catch (e) {}
    callback('en');
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (e) {}
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      pa: { translation: pa },
      mr: { translation: mr },
      te: { translation: te },
      ta: { translation: ta },
      kn: { translation: kn },
      bn: { translation: bn },
      gu: { translation: gu },
      ml: { translation: ml },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
