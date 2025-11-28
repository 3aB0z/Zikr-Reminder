import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Save, X } from "lucide-react";
import { t } from "../utils/i18n";

const AdkarForm = ({ editingItem, onSubmit, onCancel, language = "en" }) => {
  const [text, setText] = useState("");
  const [repeats, setRepeats] = useState("1");
  const [infiniteRepeat, setInfiniteRepeat] = useState(false);
  const [reminderInterval, setReminderInterval] = useState("5");
  const [delayHours, setDelayHours] = useState("0");
  const [delayMinutes, setDelayMinutes] = useState("0");
  const [delaySeconds, setDelaySeconds] = useState("0");

  useEffect(() => {
    if (editingItem) {
      setText(editingItem.text);
      // Check if infiniteRepeat flag is set or if repeats is -1
      const isInfinite =
        editingItem.infiniteRepeat || editingItem.repeats === -1;
      setInfiniteRepeat(isInfinite);
      // Show 1 if infinite, otherwise show the repeats value
      const repeatsValue = isInfinite
        ? 1
        : editingItem.repeats ?? editingItem.count ?? 1;
      setRepeats(repeatsValue.toString());
      setReminderInterval((editingItem.reminderInterval ?? 5).toString());

      // Handle delay time
      const delayMs = editingItem.delayMs || 0;
      const hours = Math.floor(delayMs / 3600000);
      const minutes = Math.floor((delayMs % 3600000) / 60000);
      const seconds = Math.floor((delayMs % 60000) / 1000);
      setDelayHours(hours.toString());
      setDelayMinutes(minutes.toString());
      setDelaySeconds(seconds.toString());
    } else {
      setText("");
      setRepeats("1");
      setInfiniteRepeat(false);
      setReminderInterval("5");
      setDelayHours("0");
      setDelayMinutes("0");
      setDelaySeconds("0");
    }
  }, [editingItem]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      // When editing, reset delay to 0 (show immediately)
      // When creating new, use the specified delay
      const delayMs = editingItem
        ? 0
        : (parseInt(delayHours) || 0) * 3600000 +
          (parseInt(delayMinutes) || 0) * 60000 +
          (parseInt(delaySeconds) || 0) * 1000;
      onSubmit({
        text: text.trim(),
        repeats: infiniteRepeat ? -1 : parseInt(repeats) || 1,
        infiniteRepeat,
        reminderInterval: parseInt(reminderInterval) || 5,
        delayMs,
      });
      setText("");
      setRepeats("1");
      setInfiniteRepeat(false);
      setReminderInterval("5");
      setDelayHours("0");
      setDelayMinutes("0");
      setDelaySeconds("0");
    }
  };

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
          {t("tab.adhkar", language)}
        </h2>
      </div>

      <motion.form
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 mb-6"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">
          {editingItem
            ? t("form.editAdhkar", language)
            : t("form.addNew", language)}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t("form.text", language)}
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("form.placeholder", language)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t("form.repeats", language)}
              </label>
              <input
                type="number"
                value={repeats}
                onChange={(e) => setRepeats(e.target.value)}
                min="1"
                max="1000"
                disabled={infiniteRepeat}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="infiniteRepeat"
                  checked={infiniteRepeat}
                  onChange={(e) => setInfiniteRepeat(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                />
                <label
                  htmlFor="infiniteRepeat"
                  className="text-sm text-slate-700 dark:text-slate-300"
                >
                  {t("form.infinite", language)}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t("form.interval", language)}
              </label>
              <input
                type="number"
                value={reminderInterval}
                onChange={(e) => setReminderInterval(e.target.value)}
                min="1"
                max="1440"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t("form.startAfter", language)}
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t("form.hours", language)}
                </label>
                <input
                  type="number"
                  value={delayHours}
                  onChange={(e) => setDelayHours(e.target.value)}
                  min="0"
                  max="23"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t("form.minutes", language)}
                </label>
                <input
                  type="number"
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(e.target.value)}
                  min="0"
                  max="59"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t("form.seconds", language)}
                </label>
                <input
                  type="number"
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(e.target.value)}
                  min="0"
                  max="59"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            {editingItem && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <X size={18} />
                {t("btn.cancel", language)}
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors flex items-center gap-2"
            >
              {editingItem ? (
                <>
                  <Save size={18} />
                  {t("btn.update", language)}
                </>
              ) : (
                <>
                  <Plus size={18} />
                  {t("btn.add", language)}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
};

export default AdkarForm;
