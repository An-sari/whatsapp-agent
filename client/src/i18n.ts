import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      "nav": {
        "home": "Home",
        "conversations": "Live Chats",
        "contacts": "Contacts",
        "integrations": "Integrations",
        "agentConfig": "AI Agent",
        "analytics": "Analytics",
        "settings": "Settings"
      },
      "home": {
        "welcome": "Welcome to WhatsApp AI Sales Agent",
        "description": "Your 24/7 automated sales and support assistant.",
        "getStarted": "Get Started",
        "quickLinks": "Quick Links"
      },
      "conversations": {
        "title": "Live Chats",
        "searchPlaceholder": "Search by phone number...",
        "noConversations": "No conversations found.",
        "typeMessage": "Type a message",
        "aiSuggestion": "AI Suggestion",
        "useReply": "Use this reply",
        "voiceRecording": "Recording voice message...",
        "voiceTranscribed": "Voice message recorded and transcribed (Simulated)"
      },
      "integrations": {
        "title": "Integrations",
        "subtitle": "Connect WhatsApp events to your external systems",
        "addNew": "Add New Webhook",
        "description": "We'll send a POST request to this URL whenever a message is received or a lead is qualified.",
        "friendlyName": "Friendly Name",
        "webhookUrl": "Webhook URL",
        "secret": "Webhook Secret (Optional)",
        "create": "Create Webhook",
        "active": "Active Webhooks",
        "noWebhooks": "No active webhooks found. Add one above to start integrating.",
        "back": "Back to Chats"
      },
      "common": {
        "loading": "Loading...",
        "error": "Error",
        "save": "Save",
        "delete": "Delete",
        "cancel": "Cancel",
        "back": "Back"
      }
    }
  },
  ar: {
    translation: {
      "nav": {
        "home": "الرئيسية",
        "conversations": "المحادثات المباشرة",
        "contacts": "جهات الاتصال",
        "integrations": "التكاملات",
        "agentConfig": "وكيل الذكاء الاصطناعي",
        "analytics": "التحليلات",
        "settings": "الإعدادات"
      },
      "home": {
        "welcome": "مرحباً بك في وكيل مبيعات واتساب بالذكاء الاصطناعي",
        "description": "مساعد المبيعات والدعم الآلي الخاص بك على مدار الساعة طوال أيام الأسبوع.",
        "getStarted": "ابدأ الآن",
        "quickLinks": "روابط سريعة"
      },
      "conversations": {
        "title": "المحادثات المباشرة",
        "searchPlaceholder": "البحث برقم الهاتف...",
        "noConversations": "لم يتم العثور على محادثات.",
        "typeMessage": "اكتب رسالة",
        "aiSuggestion": "اقتراح الذكاء الاصطناعي",
        "useReply": "استخدم هذا الرد",
        "voiceRecording": "جاري تسجيل رسالة صوتية...",
        "voiceTranscribed": "تم تسجيل الرسالة الصوتية ونسخها (محاكاة)"
      },
      "integrations": {
        "title": "التكاملات",
        "subtitle": "ربط أحداث واتساب بأنظمتك الخارجية",
        "addNew": "إضافة خطاف ويب جديد",
        "description": "سنرسل طلب POST إلى عنوان URL هذا كلما تم استلام رسالة أو تأهيل عميل محتمل.",
        "friendlyName": "الاسم الودي",
        "webhookUrl": "عنوان URL لخطاف الويب",
        "secret": "سر خطاف الويب (اختياري)",
        "create": "إنشاء خطاف ويب",
        "active": "خطافات الويب النشطة",
        "noWebhooks": "لم يتم العثور على خطافات ويب نشطة. أضف واحداً أعلاه لبدء التكامل.",
        "back": "العودة للمحادثات"
      },
      "common": {
        "loading": "جاري التحميل...",
        "error": "خطأ",
        "save": "حفظ",
        "delete": "حذف",
        "cancel": "إلغاء",
        "back": "رجوع"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie'],
    }
  });

// Set direction based on language
i18n.on('languageChanged', (lng) => {
  document.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

// Initial direction
document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = i18n.language;

export default i18n;
