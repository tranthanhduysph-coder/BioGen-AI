import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { vi } from './locales/vi';
import { en } from './locales/en';

// Khởi tạo i18n
i18n
  .use(initReactI18next) // Kết nối với React
  .init({
    resources: {
      en: en, // Nguồn ngôn ngữ Anh
      vi: vi  // Nguồn ngôn ngữ Việt
    },
    lng: "vi", // Ngôn ngữ mặc định ban đầu là Tiếng Việt
    fallbackLng: "en", // Nếu không tìm thấy key tiếng Việt thì dùng tiếng Anh
    debug: true, // Bật debug để xem lỗi trong Console nếu có
    interpolation: {
      escapeValue: false // React đã tự động xử lý XSS nên không cần escape
    },
    react: {
        useSuspense: false // Tắt Suspense để tránh lỗi loading trắng trang
    }
  });

export default i18n;
