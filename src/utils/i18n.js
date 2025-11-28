// Localization strings for the app
const translations = {
  en: {
    // Header
    "app.title": "Zikr Reminder",
    "app.subtitle": "Islamic Adhkar Reminders",

    // Buttons
    "btn.add": "Add",
    "btn.save": "Save",
    "btn.update": "Update",
    "btn.cancel": "Cancel",
    "btn.delete": "Delete",
    "btn.edit": "Edit",
    "btn.reset": "Reset",
    "btn.pause": "Pause",
    "btn.resume": "Resume",

    // Tabs
    "tab.adhkar": "Adhkar",
    "tab.settings": "Settings",

    // Form Labels
    "form.text": "Adhkar Text",
    "form.placeholder": "e.g., Subhan Allah",
    "form.repeats": "Repeats",
    "form.infinite": "Repeat Infinitely",
    "form.interval": "Reminder Interval (min)",
    "form.startAfter": "Start After (from now)",
    "form.hours": "Hours",
    "form.minutes": "Minutes",
    "form.seconds": "Seconds",
    "form.addNew": "Add New Adhkar",
    "form.editAdhkar": "Edit Adhkar",

    // List
    "list.title": "Your Adhkar List",
    "list.nextShow": "Next show",
    "list.noAdhkar": "No adhkar added yet. Start by adding one!",

    // Settings
    "settings.title": "Settings",
    "settings.theme": "Theme",
    "settings.light": "Light",
    "settings.dark": "Dark",
    "settings.system": "System",
    "settings.volume": "Volume",
    "settings.autoStart": "Auto-start with Windows",
    "settings.language": "Language",
    "settings.notificationSound": "Notification Sound",
    "settings.soundDefault": "Default",
    "settings.soundBell": "Bell",
    "settings.soundChime": "Chime",
    "settings.soundCustom": "Custom",
    "settings.soundNone": "None (Silent)",
    "settings.soundLoaded": "✓ Custom sound loaded",
    "settings.testSound": "Test Sound",
    "settings.confirmReset": "Reset all settings to default?",
    "settings.soundInfo": "Note",
    "settings.soundDelayInfo":
      "There may be a slight delay when playing the test sound.",
    "settings.notificationType": "Notification Style",
    "settings.notificationCustom": "Custom Floating Window",
    "settings.notificationSystem": "System Built-in",

    // Tray Menu
    "tray.pauseReminders": "Pause Reminders",
    "tray.resumeReminders": "Resume Reminders",
    "tray.settings": "Settings",
    "tray.exit": "Exit",
    "tray.tooltip": "Zikr Reminder - Islamic Adhkar Reminders",
  },
  ar: {
    // Header
    "app.title": "Zikr Reminder",
    "app.subtitle": "تذكيرات الأذكار الإسلامية",

    // Buttons
    "btn.add": "إضافة",
    "btn.save": "حفظ",
    "btn.update": "تحديث",
    "btn.cancel": "إلغاء",
    "btn.delete": "حذف",
    "btn.edit": "تعديل",
    "btn.reset": "إعادة تعيين",
    "btn.pause": "إيقاف مؤقت",
    "btn.resume": "استئناف",

    // Tabs
    "tab.adhkar": "الأذكار",
    "tab.settings": "الإعدادات",

    // Form Labels
    "form.text": "نص الذكر",
    "form.placeholder": "مثال: سبحان الله",
    "form.repeats": "التكرارات",
    "form.infinite": "كرر بلا نهاية",
    "form.interval": "فترة التذكير (دقيقة)",
    "form.startAfter": "ابدأ بعد (من الآن)",
    "form.hours": "ساعات",
    "form.minutes": "دقائق",
    "form.seconds": "ثواني",
    "form.addNew": "إضافة ذكر جديد",
    "form.editAdhkar": "تعديل الذكر",

    // List
    "list.title": "قائمة الأذكار الخاصة بك",
    "list.nextShow": "العرض التالي",
    "list.noAdhkar": "لم يتم إضافة أي أذكار بعد. ابدأ بإضافة واحدة!",

    // Settings
    "settings.title": "الإعدادات",
    "settings.theme": "المظهر",
    "settings.light": "فاتح",
    "settings.dark": "غامق",
    "settings.system": "نظامي",
    "settings.volume": "مستوى الصوت",
    "settings.autoStart": "البدء تلقائياً مع Windows",
    "settings.language": "اللغة",
    "settings.notificationSound": "صوت التنبيه",
    "settings.soundDefault": "افتراضي",
    "settings.soundBell": "جرس",
    "settings.soundChime": "رنين",
    "settings.soundCustom": "مخصص",
    "settings.soundNone": "بدون صوت",
    "settings.soundLoaded": "✓ تم تحميل الصوت المخصص",
    "settings.testSound": "اختبار الصوت",
    "settings.confirmReset": "إعادة تعيين جميع الإعدادات إلى الافتراضية؟",
    "settings.soundInfo": "ملاحظة",
    "settings.soundDelayInfo":
      "قد يكون هناك تأخير بسيط في تشغيل الصوت المختبر.",
    "settings.notificationType": "نمط التنبيه",
    "settings.notificationCustom": "نافذة عائمة مخصصة",
    "settings.notificationSystem": "نظام مدمج",

    // Tray Menu
    "tray.pauseReminders": "إيقاف التذكيرات مؤقتاً",
    "tray.resumeReminders": "استئناف التذكيرات",
    "tray.settings": "الإعدادات",
    "tray.exit": "خروج",
    "tray.tooltip": "Zikr Reminder - Islamic Adhkar Reminders",
  },
};

// Get translation for a key
export const t = (key, lang = "en") => {
  return translations[lang]?.[key] || translations.en[key] || key;
};

// Get all translations for a language
export const getTranslations = (lang = "en") => {
  return translations[lang] || translations.en;
};

export default translations;
