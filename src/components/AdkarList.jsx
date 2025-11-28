import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { t } from "../utils/i18n";

const AdkarList = ({ adhkar, onEdit, onDelete, language = "en" }) => {
  const [, setUpdateTrigger] = useState(0);

  // Update next show times only when reminders actually trigger
  useEffect(() => {
    if (adhkar.length === 0) return;

    const calculateNextUpdate = () => {
      // Find the adhkar that will trigger soonest
      let minMsUntilNext = Infinity;

      adhkar.forEach((a) => {
        const createdAt = new Date(a.createdAt);
        const delayMs = a.delayMs || 0;
        const intervalMs = (a.reminderInterval ?? 5) * 60 * 1000;
        const scheduledStartTime = new Date(createdAt.getTime() + delayMs);
        const now = new Date();

        if (now < scheduledStartTime) {
          minMsUntilNext = Math.min(
            minMsUntilNext,
            scheduledStartTime.getTime() - now.getTime()
          );
        } else {
          const timeSinceStart = now.getTime() - scheduledStartTime.getTime();
          const cyclePosition = timeSinceStart % intervalMs;
          const msUntilNextShow =
            cyclePosition === 0 ? 0 : intervalMs - cyclePosition;
          minMsUntilNext = Math.min(minMsUntilNext, msUntilNextShow);
        }
      });

      // Update a bit after the next reminder (add 100ms buffer)
      return minMsUntilNext + 100;
    };

    // Set initial timeout based on next reminder
    const timeout = setTimeout(() => {
      setUpdateTrigger((prev) => prev + 1);
      // Reschedule after update
      scheduleNextUpdate();
    }, calculateNextUpdate());

    const scheduleNextUpdate = () => {
      const nextUpdateTime = calculateNextUpdate();
      setTimeout(() => {
        setUpdateTrigger((prev) => prev + 1);
        scheduleNextUpdate();
      }, nextUpdateTime);
    };

    return () => clearTimeout(timeout);
  }, [adhkar]);
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getNextShowTime = (adhkarItem) => {
    const createdAt = new Date(adhkarItem.createdAt);
    const delayMs = adhkarItem.delayMs || 0;
    const intervalMs = (adhkarItem.reminderInterval ?? 5) * 60 * 1000;
    const scheduledStartTime = new Date(createdAt.getTime() + delayMs);
    const now = new Date();

    // If delay hasn't passed yet, show the scheduled start time
    if (now < scheduledStartTime) {
      return scheduledStartTime;
    }

    // Calculate next occurrence based on interval
    // The reminder shows at: scheduledStartTime + (N * intervalMs) for N = 0, 1, 2, ...
    const timeSinceStart = now.getTime() - scheduledStartTime.getTime();
    const cyclePosition = timeSinceStart % intervalMs;

    // If cyclePosition is 0 or very close (within 1 second), next show is now
    // Otherwise, next show is in (intervalMs - cyclePosition) milliseconds
    const msUntilNextShow =
      cyclePosition === 0 ? 0 : intervalMs - cyclePosition;
    const nextShowTime = new Date(now.getTime() + msUntilNextShow);
    return nextShowTime;
  };

  if (adhkar.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("list.title", language)}
          </h2>
        </div>
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            {t("list.noAdhkar", language)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t("list.title", language)}
        </h2>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        exit="hidden"
        className="space-y-3"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        <AnimatePresence mode="popLayout">
          {adhkar.map((a) => (
            <motion.div
              key={a.id}
              variants={item}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                    {a.text}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Repeats: {a.repeats === -1 ? "∞ (Infinite)" : a.repeats} •
                    Every {a.reminderInterval ?? 5} min
                  </p>
                  <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                    {t("list.nextShow", language)}:{" "}
                    {formatTime(getNextShowTime(a))}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => onEdit(a)}
                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(a.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AdkarList;
