import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { vi } from './locales/vi';
import { en } from './locales/en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: en,
      vi: vi
    },
    lng: "vi", // Mặc định tiếng Việt
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
