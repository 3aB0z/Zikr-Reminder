import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Zap,
  Settings,
  Pause,
  Play,
  ArrowRightToLine,
  ArrowLeftToLine,
} from "lucide-react";
import AdkarForm from "./components/AdkarForm";
import AdkarList from "./components/AdkarList";
import SettingsPanel from "./components/SettingsPanel";
import {
  getAdhkar,
  addAdhkar,
  updateAdhkar,
  deleteAdhkar,
} from "./utils/storage";
import { t } from "./utils/i18n";
import { updateDarkMode, resolveTheme } from "./utils/theme";
import "./styles/index.css";

function App() {
  const [currentTab, setCurrentTab] = useState("adhkar");
  const [adhkar, setAdhkar] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(null);
  const [isRemindersActive, setIsRemindersActive] = useState(true);
  const [language, setLanguage] = useState("en");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  useEffect(() => {
    loadAdhkar();
    setupElectronListeners();
    loadTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Also apply theme when it changes (from settings panel)
  useEffect(() => {
    if (darkMode !== null) {
      updateDarkMode(darkMode);
    }
  }, [darkMode]);

  const loadAdhkar = async () => {
    try {
      const loaded = await getAdhkar();
      setAdhkar(loaded || []);
    } catch (error) {
      console.error("Error loading adhkar:", error);
      setAdhkar([]);
    }
    setLoading(false);
  };

  const loadTheme = async () => {
    try {
      if (window.electron) {
        const settings = await window.electron.getSettings?.();
        if (settings?.theme) {
          const isDarkMode = resolveTheme(settings.theme);

          // Apply theme immediately
          updateDarkMode(isDarkMode);
          // Then set state (this will trigger the useEffect but it will match the already-applied theme)
          setDarkMode(isDarkMode);
        }
        if (settings?.language) {
          setLanguage(settings.language);
        }
      }
    } catch (error) {
      console.error("Error loading theme:", error);
    }
  };

  // Also apply theme when it changes (from settings panel)
  useEffect(() => {
    if (darkMode !== null) {
      updateDarkMode(darkMode);
    }
  }, [darkMode]);

  const setupElectronListeners = () => {
    if (window.electron) {
      window.electron.onNewReminder?.((data) => {
        // Floating notification is handled by the main process
      });
      window.electron.onReminderStatusChanged?.((isActive) => {
        setIsRemindersActive(isActive);
      });

      // Listen for sound play events and use HTML5 audio
      window.electron.onPlaySound?.((data) => {
        const { soundPath, soundType } = data;
        if (soundType !== "none" && soundPath) {
          const audio = new Audio();
          // Convert Windows path to file:// URL format with proper slash normalization
          const normalizedPath = soundPath.replace(/\\/g, "/");
          audio.src = `file:///${normalizedPath}`;
          audio.volume = 0.8; // Set default volume
          audio.play().catch((err) => {
            console.error("Error playing sound:", err);
          });
          console.log(
            `🎵 Audio element created and playing from: file:///${normalizedPath}`
          );
        }
      });

      // Listen for test audio playback (without notification)
      window.electron.onPlayAudioTest?.((data) => {
        const { audioUrl, volume } = data;
        if (audioUrl) {
          const audio = new Audio();
          audio.src = audioUrl;
          audio.volume = parseFloat(volume) || 0.8;
          audio.play().catch((err) => {
            console.error("Error playing test audio:", err);
          });
          console.log(`🔊 Test audio playing with volume: ${audio.volume}`);
        }
      });

      // Listen for settings updates from main process
      window.electron.onSettingsUpdated?.((settings) => {
        try {
          if (settings?.theme) {
            const isDark = resolveTheme(settings.theme);
            // Apply immediately and set state
            updateDarkMode(isDark);
            setDarkMode(isDark);
          }
          if (settings?.language) {
            setLanguage(settings.language);
          }
        } catch (err) {
          console.error("Error handling settings-updated:", err);
        }
      });
    }
  };

  const handleAddAdhkar = async (data) => {
    if (editingItem) {
      // When editing, reset the createdAt timestamp so it shows from current time
      const updatedData = {
        ...data,
        createdAt: new Date().toISOString(),
      };
      await updateAdhkar(editingItem.id, updatedData);
      setEditingItem(null);
    } else {
      await addAdhkar(
        data.text,
        data.category,
        data.repeats,
        data.reminderInterval,
        data.infiniteRepeat,
        data.delayMs
      );
    }
    await loadAdhkar();
  };

  const handleDeleteAdhkar = async (id) => {
    if (window.confirm("Are you sure you want to delete this adhkar?")) {
      await deleteAdhkar(id);
      await loadAdhkar();
    }
  };

  const handleToggleReminders = () => {
    const newState = !isRemindersActive;
    setIsRemindersActive(newState);
    if (window.electron) {
      // Send the PAUSED state (opposite of active)
      window.electron.toggleReminder?.(!newState);
    }
  };

  const tabs = [
    { id: "adhkar", label: t("tab.adhkar", language), icon: Zap },
    { id: "settings", label: t("tab.settings", language), icon: Settings },
  ];

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div
      className="w-screen h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* Header */}
      <header className="bg-linear-to-r from-primary-500 to-secondary-500 text-white px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <Zap size={28} />
            <h1 className="text-2xl font-bold">{t("app.title", language)}</h1>
          </div>
          <button
            onClick={handleToggleReminders}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-white text-slate-900 hover:bg-slate-100 shadow-md dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700`}
          >
            {isRemindersActive ? (
              <>
                <Pause size={18} />
                <span>{t("btn.pause", language)}</span>
              </>
            ) : (
              <>
                <Play size={18} />
                <span>{t("btn.resume", language)}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar */}
        <div
          className={`${
            sidebarCollapsed ? "w-20" : "w-48"
          } bg-slate-50 dark:bg-slate-900 ${
            language === "ar" ? "border-l" : "border-r"
          } border-slate-200 dark:border-slate-700 flex flex-col p-4 transition-all duration-300`}
        >
          <nav className="flex-1 overflow-y-auto space-y-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`w-full h-[46px] flex items-center justify-start gap-3 overflow-x-hidden ${
                    language === "ar" ? "pr-3.5 pl-2.5" : "pl-3.5 pr-2.5"
                  } rounded-lg transition-colors ${
                    currentTab === tab.id
                      ? "bg-primary-500 text-white"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                  title={sidebarCollapsed ? tab.label : ""}
                >
                  <Icon size={20} className="min-w-5" />
                  {!sidebarCollapsed && (
                    <span className="font-medium">{tab.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

          <span className="w-full h-4 mb-4 border-b border-slate-200 dark:border-slate-700" />

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="size-[46px] self-end bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center shrink-0"
            title={sidebarCollapsed ? "Expand" : "Collapse"}
          >
            {language === "ar" ? (
              sidebarCollapsed ? (
                <ArrowLeftToLine size={20} />
              ) : (
                <ArrowRightToLine size={20} />
              )
            ) : sidebarCollapsed ? (
              <ArrowRightToLine size={20} />
            ) : (
              <ArrowLeftToLine size={20} />
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {currentTab === "adhkar" && (
              <motion.div
                key="adhkar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-10"
              >
                <AdkarForm
                  editingItem={editingItem}
                  onSubmit={handleAddAdhkar}
                  onCancel={() => setEditingItem(null)}
                  language={language}
                />
                <AdkarList
                  adhkar={adhkar}
                  onEdit={setEditingItem}
                  onDelete={handleDeleteAdhkar}
                  language={language}
                />
              </motion.div>
            )}

            {currentTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SettingsPanel
                  language={language}
                  onLanguageChange={setLanguage}
                  onThemeChange={setDarkMode}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default App;
