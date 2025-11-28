import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, RotateCcw, Percent, Volume2 } from "lucide-react";
import { getSettings, saveSettings } from "../utils/storage";
import { t } from "../utils/i18n";
import { updateDarkMode, resolveTheme } from "../utils/theme";

const SettingsPanel = ({ language = "en", onLanguageChange, onThemeChange }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loaded = await getSettings();
    setSettings(loaded);
    setLoading(false);
  };

  const handleChange = (key, value) => {
    setSettings((prev) => {
      return {
        ...prev,
        [key]: value,
      };
    });
  };

  const handleSave = () => {
    saveSettings(settings);
    // Apply theme after saving
    const isDark = resolveTheme(settings.theme);
    updateDarkMode(isDark);
    
    // Notify parent of theme change
    onThemeChange?.(isDark);
    
    // Notify parent of language change if applicable
    onLanguageChange?.(settings.language);
  };

  const handleReset = async () => {
    if (window.confirm(t("settings.confirmReset", language))) {
      await loadSettings();
    }
  };

  const handleCustomSoundUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Read file and send to electron for saving
      const reader = new FileReader();
      reader.onload = () => {
        if (window.electron) {
          window.electron.saveCustomSound?.(file.name, reader.result);
        }
        // Store just the filename after file is sent to be saved
        handleChange("customSoundPath", file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTestSound = async () => {
    if (window.electron) {
      window.electron.testNotificationSound?.(
        settings.notificationSound,
        settings.volume,
        settings.customSoundPath
      );
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t("settings.title", language)}
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-6">
        {/* Theme */}
        <div className="pb-6 border-b border-slate-200 dark:border-slate-700">
          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3">
            {t("settings.theme", language)}
          </label>
          <div className="flex gap-4 flex-wrap">
            {["system", "light", "dark"].map((theme) => (
              <label
                key={theme}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="theme"
                  value={theme}
                  checked={settings.theme === theme}
                  onChange={(e) => handleChange("theme", e.target.value)}
                  className="w-4 h-4"
                />
                <span className="flex items-center gap-2 capitalize text-slate-700 dark:text-slate-300">
                  {t(`settings.${theme}`, language)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Volume */}
        <div className="pb-6 border-b border-slate-200 dark:border-slate-700">
          <label className="text-sm font-bold text-slate-900 dark:text-white mb-3 block">
            <span className="flex items-center gap-1.5">
              <p>{t("settings.volume", language)}:</p>
              <span className="flex items-center">
                {language === "ar" && (
                  <Percent size={16} className="inline-block" />
                )}
                {Math.round(settings.volume * 100)}
                {language !== "ar" && (
                  <Percent size={16} className="inline-block" />
                )}
              </span>
            </span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.volume * 100}
            onChange={(e) =>
              handleChange("volume", parseFloat(e.target.value) / 100)
            }
            className="w-full"
          />
        </div>

        {/* Auto Start */}
        <div className="pb-6 border-b border-slate-200 dark:border-slate-700">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoStart}
              onChange={(e) => handleChange("autoStart", e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-slate-900 dark:text-white">
              {t("settings.autoStart", language)}
            </span>
          </label>
        </div>

        {/* Notification Type */}
        <div className="pb-6 border-b border-slate-200 dark:border-slate-700">
          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3">
            {t("settings.notificationType", language)}
          </label>
          <div className="flex gap-4 flex-wrap">
            {["custom", "system"].map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="notificationType"
                  value={type}
                  checked={settings.notificationType === type}
                  onChange={(e) => handleChange("notificationType", e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  {type === "custom"
                    ? t("settings.notificationCustom", language)
                    : t("settings.notificationSystem", language)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="pb-6 border-b border-slate-200 dark:border-slate-700">
          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3">
            {t("settings.language", language)}
          </label>
          <select
            value={settings.language || "en"}
            onChange={(e) => handleChange("language", e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="en">English</option>
            <option value="ar">العربية (Arabic)</option>
          </select>
        </div>

        {/* Notification Sound */}
        <div className="pb-6 border-b border-slate-200 dark:border-slate-700">
          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3">
            {t("settings.notificationSound", language)}
          </label>
          <div className="space-y-3">
            <select
              value={settings.notificationSound || "default"}
              onChange={(e) =>
                handleChange("notificationSound", e.target.value)
              }
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="custom">
                {t("settings.soundCustom", language)}
              </option>
              <option value="default">
                {t("settings.soundDefault", language)}
              </option>
              <option value="bell">{t("settings.soundBell", language)}</option>
              <option value="chime">
                {t("settings.soundChime", language)}
              </option>
              <option value="none">{t("settings.soundNone", language)}</option>
            </select>
            {settings.notificationSound === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".mp3,.wav,.m4a,.ogg"
                  onChange={(e) => handleCustomSoundUpload(e)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            )}
            {settings.customSoundPath &&
              settings.notificationSound === "custom" && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t("settings.soundLoaded", language)}
                </p>
              )}
            <button
              onClick={handleTestSound}
              disabled={settings.notificationSound === "none"}
              className="w-full mt-3 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-200 dark:disabled:hover:bg-slate-700"
            >
              <Volume2 size={18} />
              {t("settings.testSound", language)}
            </button>
            <div className="flex items-center gap-1.5">
              <p>{t("settings.soundInfo", language)}:</p>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {t("settings.soundDelayInfo", language)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <RotateCcw size={18} />
            {t("btn.reset", language)}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            <Save size={18} />
            {t("btn.save", language)}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPanel;
