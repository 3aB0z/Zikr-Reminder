import { screen, app, BrowserWindow, Menu, Tray, ipcMain, nativeTheme, Notification } from "electron";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { spawn } from "child_process";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// const isDev = true; // Always development mode for now, or check environment
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

// Disable GPU acceleration to prevent GPU process crashes on Windows
app.disableHardwareAcceleration();

// Translations for tray menu
const translations = {
  en: {
    showHide: "Show/Hide",
    pauseReminders: "Pause Reminders",
    resumeReminders: "Resume Reminders",
    settings: "Settings",
    exit: "Exit",
    tooltip: "Zikr Reminder",
  },
  ar: {
    showHide: "إظهار/إخفاء",
    pauseReminders: "إيقاف التذكيرات مؤقتاً",
    resumeReminders: "استئناف التذكيرات",
    settings: "الإعدادات",
    exit: "خروج",
    tooltip: "Zikr Reminder",
  },
};

const t = (key, lang = "en") =>
  translations[lang]?.[key] || translations.en[key] || key;

let mainWindow;
let tray;
let notificationWindow;
let notificationReady = true;
let pendingNotification = null;
let reminderInterval;
let isPaused = false;
let currentLanguage = "en";
const notificationTimers = new Map(); // Track individual timers for each notification
const lastReminderTime = new Map(); // Track last reminder time for each adhkar
let lastSavedSettings = null; // Track last saved settings to prevent duplicates
const dataDir = join(app.getPath("userData"), "data");
const settingsFile = join(dataDir, "settings.json");
const adhkarFile = join(dataDir, "adhkar.json");

// Create data directory if it doesn't exist
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Default settings
const defaultSettings = {
  theme: "system",
  volume: 0.8,
  autoStart: false,
  language: "en", // 'en' or 'ar'
  notificationSound: "default", // 'default', 'bell', 'chime', 'custom', 'none'
  customSoundPath: null, // Path or data URL to custom sound file
  notificationType: "custom", // 'custom' for floating window, 'system' for OS notifications
};

// Default adhkar
const defaultAdhkar = [
  { id: 1, text: "Subhan Allah", category: "general", repeats: 33 },
  { id: 2, text: "Alhamdulillah", category: "general", repeats: 33 },
  { id: 3, text: "Allahu Akbar", category: "general", repeats: 34 },
  { id: 4, text: "La ilaha illallah", category: "general", repeats: 1 },
  { id: 5, text: "Astaghfirullah", category: "general", repeats: 10 },
];

// Load settings
function loadSettings() {
  try {
    if (existsSync(settingsFile)) {
      const settings = JSON.parse(readFileSync(settingsFile, "utf-8"));

      // Migrate: if customSoundPath is a data URL, extract filename and clear it
      if (
        settings.customSoundPath &&
        settings.customSoundPath.startsWith("data:")
      ) {
        console.log("🔄 Migrating customSoundPath from data URL...");
        settings.customSoundPath = null; // Clear the old data URL
        saveSettings(settings); // Save the cleaned settings
      }

      return settings;
    }
    saveSettings(defaultSettings);
    return defaultSettings;
  } catch (error) {
    console.error("Error loading settings:", error);
    return defaultSettings;
  }
}

// Save settings
function saveSettings(settings) {
  try {
    writeFileSync(settingsFile, JSON.stringify(settings, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving settings:", error);
  }
}

// Load adhkar
function loadAdhkar() {
  try {
    if (existsSync(adhkarFile)) {
      return JSON.parse(readFileSync(adhkarFile, "utf-8"));
    }
    saveAdhkar(defaultAdhkar);
    return defaultAdhkar;
  } catch (error) {
    console.error("Error loading adhkar:", error);
    return defaultAdhkar;
  }
}

// Save adhkar
function saveAdhkar(adhkar) {
  try {
    writeFileSync(adhkarFile, JSON.stringify(adhkar, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving adhkar:", error);
  }
}

// Cleanup function to be called before quitting
let isCleaningUp = false;
function cleanup() {
  if (isCleaningUp) return; // Prevent multiple cleanup calls
  isCleaningUp = true;
  console.log("🧹 Cleaning up resources...");

  // Clear all timers
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }

  // Clear all notification timers
  notificationTimers.forEach((timer) => {
    clearTimeout(timer);
    clearInterval(timer);
  });
  notificationTimers.clear();
  lastReminderTime.clear();

  // Close notification window
  if (notificationWindow && !notificationWindow.isDestroyed?.()) {
    notificationWindow.destroy();
    notificationWindow = null;
  }

  // Close main window
  if (mainWindow && !mainWindow.isDestroyed?.()) {
    mainWindow.destroy();
    mainWindow = null;
  }

  // Destroy tray
  if (tray && !tray.isDestroyed?.()) {
    tray.destroy();
    tray = null;
  }

  console.log("✅ Cleanup complete");
}

// Create window
function createWindow() {
  console.log("🪟 Creating main window...");
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    icon: join(__dirname, "icons/icon.ico"),
    show: false,
    webGLPreferences: {
      enabled: false,
    },
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Remove the menu bar
  mainWindow.removeMenu();

  const startUrl = isDev
    ? "http://localhost:7361"
    : `file://${join(__dirname, "../build/index.html").replace(/\\/g, "/")}`;

  console.log("📍 Loading URL:", startUrl);
  console.log("📍 isDev:", isDev);
  console.log("📍 __dirname:", __dirname);

  mainWindow.loadURL(startUrl);

  mainWindow.once("ready-to-show", () => {
    console.log("✅ Window ready to show");
    mainWindow.show();
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error("❌ Failed to load:", errorCode, errorDescription);
    }
  );

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

// Create tray
// Update tray context menu without recreating the tray
function updateTrayMenu() {
  try {
    if (!tray) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: isPaused
          ? t("resumeReminders", currentLanguage)
          : t("pauseReminders", currentLanguage),
        type: "checkbox",
        checked: isPaused,
        click: () => {
          isPaused = !isPaused;
          console.log("⏯️ Reminder paused state from tray:", isPaused);
          // Update tray menu immediately to show new state
          updateTrayMenu();
          if (mainWindow) {
            // Send the active state (opposite of paused) to app
            mainWindow.webContents.send("reminder-status-changed", !isPaused);
          }
          // Handle reminder state change
          if (!isPaused) {
            startReminders();
          } else if (reminderInterval) {
            clearInterval(reminderInterval);
            reminderInterval = null;
          }
        },
      },
      {
        label: t("settings", currentLanguage),
        click: () => {
          console.log("⚙️ Settings clicked from tray");
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: t("exit", currentLanguage),
        click: () => {
          console.log("🚪 Exiting app");
          app.isQuitting = true;
          
          // Destroy tray immediately to remove icon from system tray
          if (tray && !tray.isDestroyed?.()) {
            tray.destroy();
            tray = null;
          }
          
          cleanup();
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
  } catch (error) {
    console.error("❌ Error updating tray menu:", error);
  }
}

function createTray() {
  try {
    const iconPath = join(__dirname, "icons/tray-icon.ico");
    console.log("🖼️ Tray icon path:", iconPath);

    // Load language from settings
    const settings = loadSettings();
    currentLanguage = settings.language || "en";

    // Check if tray already exists
    if (tray) {
      tray.destroy();
    }

    // Try to create tray with icon, fall back to app icon if needed
    let trrayIcon = iconPath;
    if (!existsSync(iconPath)) {
      console.warn("⚠️ Tray icon not found, trying app icon");
      const appIcon = join(__dirname, "icons/icon.ico");
      if (existsSync(appIcon)) {
        trrayIcon = appIcon;
      } else {
        console.error("❌ No icon files found!");
        return;
      }
    }

    tray = new Tray(trrayIcon);
    console.log("✅ Tray created successfully");

    // Use the updateTrayMenu function to set initial menu
    updateTrayMenu();
    tray.setToolTip(t("tooltip", currentLanguage));

    tray.on("click", () => {
      console.log("🖱️ Tray clicked");
      if (mainWindow) {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
      }
    });

    tray.on("right-click", () => {
      console.log("🖱️ Tray right-clicked");
    });
  } catch (error) {
    console.error("❌ Error creating tray:", error);
  }
}

// Helper function to detect if text contains Arabic characters
function isArabic(text) {
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
}

// Helper function to get notification sound path
function getNotificationSoundPath(
  soundType = "default",
  customSoundPath = null
) {
  try {
    const soundMap = {
      default: "notification-default.wav",
      bell: "notification-bell.wav",
      chime: "notification-chime.wav",
      none: null,
    };

    let soundPath = null;

    if (soundType === "custom" && customSoundPath) {
      // Handle filename (stored in custom-sounds directory)
      if (!customSoundPath.startsWith("data:")) {
        soundPath = join(
          app.getPath("userData"),
          "custom-sounds",
          customSoundPath
        );
      } else {
        // Handle legacy data URL format
        const base64Data = customSoundPath.split(",")[1];
        const tempDir = join(app.getPath("userData"), "temp");
        if (!existsSync(tempDir)) {
          mkdirSync(tempDir, { recursive: true });
        }
        soundPath = join(tempDir, "custom-notification.wav");
        writeFileSync(soundPath, Buffer.from(base64Data, "base64"));
      }
    } else {
      const soundFile = soundMap[soundType] || soundMap["default"];
      if (!soundFile) return null; // Don't play if sound is "none"
      soundPath = join(__dirname, "sounds", soundFile);
    }

    // Check if sound file exists
    if (!existsSync(soundPath)) {
      console.warn(`⚠️ Sound file not found: ${soundPath}`);
      return null;
    }

    return soundPath;
  } catch (error) {
    console.error("❌ Error getting notification sound path:", error);
    return null;
  }
}

// Play notification sound for system notifications
function playNotificationSound(soundPath, volume = 0.8) {
  if (!soundPath) return;
  
  try {
    console.log(`🔊 Attempting to play sound: ${soundPath}`);
    console.log(`📁 Sound file exists: ${existsSync(soundPath)}`);
    console.log(`🔉 Volume level: ${Math.round(volume * 100)}%`);
    
    if (process.platform === "win32") {
      // Windows: Create a VBScript to play sound with volume control
      const vbscriptPath = join(app.getPath("userData"), "play-sound.vbs");
      // Convert volume (0.0-1.0) to WMPlayer scale (0-100)
      const volumeLevel = Math.round(volume * 100);
      const vbscript = `Set objPlayer = CreateObject("WMPlayer.OCX.7")
objPlayer.URL = "${soundPath.replace(/"/g, '""')}"
objPlayer.settings.volume = ${volumeLevel}
objPlayer.controls.play()
WScript.Sleep(5000)`;
      
      writeFileSync(vbscriptPath, vbscript);
      
      // Execute VBScript
      const vbsProcess = spawn("cscript.exe", [vbscriptPath], { 
        detached: true, 
        stdio: "ignore",
        windowsHide: true 
      });
      vbsProcess.unref();
      
      console.log(`✅ VBScript sound playback initiated: ${soundPath} at ${volumeLevel}% volume`);
    } else if (process.platform === "darwin") {
      // macOS: use afplay
      const afplayProcess = spawn("afplay", [soundPath], { 
        detached: true, 
        stdio: "ignore" 
      });
      afplayProcess.unref();
      console.log(`✅ macOS sound playback initiated: ${soundPath}`);
    } else {
      // Linux: use paplay
      const paplayProcess = spawn("paplay", [soundPath], { 
        detached: true, 
        stdio: "ignore" 
      });
      paplayProcess.unref();
      console.log(`✅ Linux sound playback initiated: ${soundPath}`);
    }
  } catch (error) {
    console.error("❌ Error playing notification sound:", error);
  }
}

// Create floating notification window (persistent, off-screen approach)
function createNotificationWindow(
  adhkar,
  soundType = "default",
  soundPath = null,
  volume = 0.8,
  theme = "dark"
) {
  try {
    console.log("🪟 NOTIFICATION QUEUED - ADHKAR TEXT:", adhkar.text);
    
    // If notification is already showing, queue this one
    if (!notificationReady) {
      console.log("⏳ Notification busy, queueing:", adhkar.text);
      pendingNotification = { adhkar, soundType, soundPath, volume, theme };
      return;
    }
    
    // Mark as not ready while displaying
    notificationReady = false;
    
    // If notification window doesn't exist, create it (once only)
    if (!notificationWindow) {
      console.log("🔨 Creating persistent notification window");
      
      // Get screen dimensions to position in bottom-left
      const primaryDisplay = screen.getPrimaryDisplay();
      const { height } = primaryDisplay.workAreaSize;

      notificationWindow = new BrowserWindow({
        width: 250,
        height: 70,
        x: 0,
        y: height - 73,
        frame: false,
        transparent: true,
        backgroundColor: "#00000000",
        alwaysOnTop: true,
        skipTaskbar: true,
        focusable: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        },
        vibrancy: "fullscreen-ui", // on MacOS
        backgroundMaterial: "acrylic", // on Windows 11
      });
    }

    // Create notification HTML with embedded audio
    const isArabicText = isArabic(adhkar.text);
    
    // Handle theme - if "system" is set, detect system preference
    let themeToUse = theme;
    if (theme === "system") {
      // Get system theme preference
      themeToUse = nativeTheme.shouldUseDarkColors ? "dark" : "light";
    }
    
    const isDarkMode = themeToUse === "dark";

    // Load audio file as base64 data URL for reliable playback
    let audioDataUrl = "";
    if (soundType !== "none" && soundPath) {
      try {
        const audioBuffer = readFileSync(soundPath);
        audioDataUrl = `data:audio/wav;base64,${audioBuffer.toString(
          "base64"
        )}`;
        console.log(
          `📢 Audio converted to data URL, size: ${audioBuffer.length} bytes`
        );
      } catch (error) {
        console.error(`❌ Error loading audio file: ${error.message}`);
      }
    }

    const audioElement =
      soundType !== "none" && audioDataUrl
        ? `<audio id="notificationSound" preload="auto"><source src="${audioDataUrl}" type="audio/wav"></audio>`
        : "";

    const notificationHTML = `
      <!DOCTYPE html>
      <html dir="${isArabicText ? "rtl" : "ltr"}">
        <head>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              overflow-x: hidden;
              width: 100%;
              height: 100%;
              background: transparent !important;
              direction: ${isArabicText ? "rtl" : "ltr"};
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Arabic Typesetting', Arial, sans-serif;
              display: flex;
              align-items: end;
              justify-content: flex-start;
              width: 100%;
              height: 100%;
            }
            .notification {
              animation: slideIn 0.3s ease-out forwards;
              overflow-x: hidden;
              display: flex;
              align-items: start;
              justify-content: space-between;
              font-size: 14px;
              font-weight: 500;
              width: 100%;
              height: 100%;
              gap: 8px;
              padding: 12px;
              animation-play-state: running;
              flex-direction: row;
            }
            .notification.closing {
              animation: slideOut 0.3s ease-in forwards;
            }
            .notification-tint {
              background: ${
                isDarkMode
                  ? "rgba(15, 23, 42, 0.70)"
                  : "rgba(248, 250, 252, 0.70)"
              };
              border: 1px solid ${
                isDarkMode
                  ? "rgba(148, 163, 184, 0.3)"
                  : "rgba(203, 213, 225, 0.5)"
              };
              border-radius: 12px;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 4px 6px;
              gap: 8px;
              box-shadow: 0px 0px 12px 0px ${isDarkMode ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"};
              color: ${isDarkMode ? "white" : "#1a1a1a"};
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: background 0.2s ease;
            }
            .notification-tint:hover {
              background: ${
                isDarkMode
                  ? "rgba(15, 23, 42, 0.85)"
                  : "rgba(248, 250, 252, 0.85)"
              };
            }
            .notification-text {
              flex: 1;
              overflow: hidden;
              text-align: ${isArabicText ? "right" : "left"};
              margin-right: ${isArabicText ? "8px" : "0px"};
              margin-left: ${isArabicText ? "0px" : "8px"};
              display: flex;
              align-items: center;
              white-space: pre-wrap;
              word-wrap: break-word;
              line-height: 1.3;
              max-height: 100%;
            }
            .close-btn {
              background: transparent;
              border: none;
              color: ${isDarkMode ? "#FF002B" : "#d32f2f"};
              width: 24px;
              height: 24px;
              min-width: 24px;
              min-height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              font-size: 18px;
              padding: 0;
              font-weight: bold;
              transition: color 0.2s;
              flex-shrink: 0;
              margin-left: auto;
              order: 99;
            }
            .close-btn:hover {
              color: ${isDarkMode ? "#D10023" : "#b71c1c"};
            }
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateX(-300px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
            @keyframes slideOut {
              from {
                opacity: 1;
                transform: translateX(0);
              }
              to {
                opacity: 0;
                transform: translateX(-300px);
              }
            }
          </style>
        </head>
        <body>
          ${audioElement}
          <div class="notification"> 
            <div class="notification-tint"> 
              <div class="notification-text">${adhkar.text}</div>
              <span class="close-btn">✕</span>
            </div>
          </div>
          <script>
            // Play audio immediately when notification loads
            const notificationVolume = parseFloat(${volume});
            console.log('=== NOTIFICATION WINDOW SCRIPT STARTING ===');
            console.log('Volume setting:', notificationVolume);
            
            let isHovering = false;
            let closeTimeout = null;
            let audioFinished = false;
            let isClosing = false;
            let audioStarted = false;
            
            const notification = document.querySelector('.notification');
            const notificationTint = document.querySelector('.notification-tint');
            const audioElement = document.getElementById('notificationSound');
            
            // Function to close notification with animation
            function closeNotification(event) {
              event?.stopPropagation();
              if (isClosing) return;
              isClosing = true;
              if (closeTimeout) clearTimeout(closeTimeout);
              console.log('🔴 Closing notification');
              notification.classList.add('closing');
              setTimeout(() => {
                window.close();
              }, 400);
            }
            
            // Make entire notification clickable to close
            notificationTint.addEventListener('click', closeNotification);
            
            console.log('Audio element found:', !!audioElement);
            if (audioElement) {
              console.log('Audio element attributes:');
              console.log('  - id:', audioElement.id);
              console.log('  - src:', audioElement.src);
              console.log('  - sources count:', audioElement.querySelectorAll('source').length);
              audioElement.querySelectorAll('source').forEach((src, i) => {
                console.log('  - source[' + i + '].src length:', src.src?.length || 0);
                console.log('  - source[' + i + '].type:', src.type);
              });
              
              // Set volume and play
              audioElement.volume = notificationVolume;
              console.log('Volume set to:', audioElement.volume);
              
              audioElement.play()
                .then(() => {
                  audioStarted = true;
                  console.log('✅ Audio playing successfully!');
                  // Schedule close after audio ends
                  scheduleCloseAfterAudio();
                })
                .catch((err) => {
                  console.error('❌ Error playing audio:', err.name, err.message);
                  audioFinished = true;
                  scheduleClose();
                });
              
              // Wait for audio to finish
              audioElement.addEventListener('ended', () => {
                console.log('✅ Audio finished playing');
                audioFinished = true;
                // Only close if not hovering
                if (!isHovering) {
                  scheduleClose();
                }
              }, { once: true });
              
              audioElement.addEventListener('error', () => {
                console.error('❌ Audio error, closing notification');
                audioFinished = true;
                if (!isHovering) {
                  scheduleClose();
                }
              }, { once: true });
            } else {
              console.log('❌ No audio element found in notification');
              audioFinished = true;
              scheduleClose();
            }
            
            console.log('Setting up hover listeners');
            
            // Hover on notification element
            notification.addEventListener('mouseenter', () => {
              console.log('🖱️ Mouse entered notification - pausing close');
              isHovering = true;
              if (closeTimeout) {
                clearTimeout(closeTimeout);
                closeTimeout = null;
              }
            });
            
            notification.addEventListener('mouseleave', () => {
              console.log('🖱️ Mouse left notification - resuming close if audio finished');
              isHovering = false;
              // Only schedule close if audio has finished
              if (audioFinished && !closeTimeout) {
                scheduleClose();
              }
            });
            
            // Also hover on the tint for better detection
            notificationTint.addEventListener('mouseenter', () => {
              console.log('🖱️ Mouse entered tint - pausing close');
              isHovering = true;
              if (closeTimeout) {
                clearTimeout(closeTimeout);
                closeTimeout = null;
              }
            });
            
            notificationTint.addEventListener('mouseleave', () => {
              console.log('🖱️ Mouse left tint - resuming close if audio finished');
              isHovering = false;
              if (audioFinished && !closeTimeout) {
                scheduleClose();
              }
            });
            
            function scheduleCloseAfterAudio() {
              // Auto-close 1 second after audio ends, but respect hover
              audioElement.addEventListener('ended', () => {
                if (!isHovering) {
                  scheduleClose();
                }
              }, { once: true });
            }
            
            function scheduleClose() {
              if (closeTimeout) return; // Already scheduled
              console.log('⏱️ Scheduling close in 1 second');
              closeTimeout = setTimeout(() => {
                if (!isHovering) {
                  console.log('🔴 Auto-closing notification');
                  notification.classList.add('closing');
                  setTimeout(() => {
                    window.close();
                  }, 400);
                } else {
                  console.log('⏸️ Close canceled - still hovering');
                  closeTimeout = null;
                }
              }, 1000);
            }
            
            console.log('=== NOTIFICATION WINDOW SCRIPT LOADED ===');
          </script>
        </body>
      </html>
    `;

    const dataUrl =
      "data:text/html;charset=UTF-8," + encodeURIComponent(notificationHTML);
    
    console.log("📋 Loading notification URL into existing window");
    
    // Track load state
    let contentLoaded = false;
    const loadHandler = () => {
      contentLoaded = true;
      console.log("✅ Notification content loaded, showing window");
      // Show the window only after content is loaded
      if (notificationWindow && !notificationWindow.isVisible()) {
        notificationWindow.show();
        console.log("🪟 Notification window shown (after content load)");
      }
    };
    
    // Remove old listeners if any
    notificationWindow.webContents.removeAllListeners("did-finish-load");
    notificationWindow.webContents.removeAllListeners("did-fail-load");
    
    // Add new listeners
    const finishLoadHandler = loadHandler;
    notificationWindow.webContents.on("did-finish-load", finishLoadHandler);
    
    notificationWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
      console.error("❌ Notification failed to load:", errorCode, errorDescription);
      contentLoaded = true;
      // Show anyway after a timeout
      setTimeout(() => {
        if (notificationWindow && !notificationWindow.isVisible()) {
          notificationWindow.show();
        }
      }, 500);
    });

    // Hide window and load new content
    if (notificationWindow.isVisible()) {
      notificationWindow.hide();
    }
    
    // Load the new content
    notificationWindow.loadURL(dataUrl);
    
    // Timeout fallback - show after max 800ms even if not loaded
    const showTimeout = setTimeout(() => {
      if (notificationWindow && !notificationWindow.isVisible()) {
        console.log("⚠️ Content load timeout, showing window anyway");
        notificationWindow.show();
      }
    }, 800);
    
    // Clean up timeout if content loads
    const originalShowTimeout = (notificationWindow._showTimeout = setTimeout(() => {
      clearTimeout(showTimeout);
    }, 1000));

    // Remove old closed listener if exists to prevent accumulation
    notificationWindow.removeAllListeners("closed");
    
    notificationWindow.on("closed", () => {
      if (notificationTimers.has("current")) {
        clearTimeout(notificationTimers.get("current"));
        notificationTimers.delete("current");
      }
      clearTimeout(showTimeout);
      clearTimeout(originalShowTimeout);
      // Mark notification as ready for next one
      notificationReady = true;
      // If there's a pending notification, show it now
      if (pendingNotification) {
        const pending = pendingNotification;
        pendingNotification = null;
        createNotificationWindow(pending.adhkar, pending.soundType, pending.soundPath, pending.volume, pending.theme);
      }
    });
    
    // Prevent window from actually closing - just hide it
    // Remove old close listener to prevent accumulation
    notificationWindow.removeAllListeners("close");
    
    notificationWindow.on("close", (event) => {
      console.log("🔇 Notification window close attempted, hiding instead");
      event.preventDefault();
      notificationWindow.hide();
      // Emit closed event manually to trigger our handlers
      setImmediate(() => {
        notificationWindow.emit("closed");
      });
    });
  } catch (error) {
    console.error("❌ Error creating notification window:", error);
    notificationReady = true;
  }
}

// Start reminders - each adhkar gets its own timer
function startReminders() {
  const settings = loadSettings();
  const adhkar = loadAdhkar();

  console.log("⏰ Starting reminders with individual timers per adhkar");
  console.log("📿 Loaded adhkar count:", adhkar.length);

  // Clear any existing reminder intervals
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }

  // Clear all existing adhkar timers
  adhkar.forEach((a) => {
    const timerId = `adhkar-${a.id}`;
    if (notificationTimers.has(timerId)) {
      clearInterval(notificationTimers.get(timerId));
      notificationTimers.delete(timerId);
    }
    // Clear first reminder timeout
    const firstReminderId = `first-reminder-${a.id}`;
    if (notificationTimers.has(firstReminderId)) {
      clearTimeout(notificationTimers.get(firstReminderId));
      notificationTimers.delete(firstReminderId);
    }
  });

  if (adhkar.length > 0) {
    // Set a master interval that checks all adhkar timers
    reminderInterval = setInterval(() => {
      const now = Date.now();

      adhkar.forEach((adhkarItem) => {
        if (isPaused) return;

        const adhkarId = adhkarItem.id;
        const interval = (adhkarItem.reminderInterval ?? 5) * 60 * 1000; // Convert minutes to ms
        const delayMs = adhkarItem.delayMs ?? 0; // Get delay in milliseconds
        const createdAt = new Date(adhkarItem.createdAt).getTime();
        const scheduledStartTime = createdAt + delayMs; // When this adhkar should start showing

        // Don't show this adhkar if the delay period hasn't passed
        if (now < scheduledStartTime) {
          return;
        }

        // Calculate when this adhkar should be shown
        // It should show at: scheduledStartTime, scheduledStartTime + interval, scheduledStartTime + 2*interval, etc.
        const timeSinceStart = now - scheduledStartTime;
        const cyclePosition = timeSinceStart % interval;

        // If we're within 1 second of the scheduled time, show it
        // The tolerance of 1000ms is because we check every 1 second
        if (cyclePosition < 1000) {
          const lastTime = lastReminderTime.get(adhkarId) ?? -1;
          // Only show if we haven't shown it in this cycle
          if (lastTime < scheduledStartTime || now - lastTime >= interval) {
            const currentTime = new Date(now).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            });
            console.log(
              `🕌 [${currentTime}] Sending reminder: ${adhkarItem.text}`
            );
            
            // Use system notification or custom window based on setting
            if (settings.notificationType === "system") {
              // System built-in notification
              try {
                const notification = new Notification({
                  title: "Zikr Reminder",
                  body: adhkarItem.text,
                  icon: join(__dirname, "icons/icon.png"),
                  urgency: "low",
                  silent: true, // Disable system sound
                });
                notification.show();
              } catch (notifErr) {
                console.error("Error creating system notification:", notifErr);
              }
              
              // Play custom sound if not set to "none"
              if (settings.notificationSound !== "none") {
                const soundPath = getNotificationSoundPath(
                  settings.notificationSound,
                  settings.customSoundPath
                );
                playNotificationSound(soundPath, settings.volume);
              }
            } else {
              // Custom floating window notification
              const soundPath = getNotificationSoundPath(
                settings.notificationSound,
                settings.customSoundPath
              );
              createNotificationWindow(
                adhkarItem,
                settings.notificationSound,
                soundPath,
                settings.volume,
                settings.theme
              );
            }
            
            if (mainWindow) {
              mainWindow.webContents.send("new-reminder", adhkarItem);
            }
            // Update the last reminder time for this adhkar
            lastReminderTime.set(adhkarId, now);
          }
        }
      });
    }, 1000); // Check every second

    console.log("⏰ Master reminder interval started");
  }
}

// IPC Handlers
ipcMain.handle("get-settings", loadSettings);
ipcMain.handle("get-adhkar", loadAdhkar);

ipcMain.on("save-settings", (event, settings) => {
  // Filter out unwanted fields that shouldn't be saved
  const allowedFields = [
    "theme",
    "volume",
    "autoStart",
    "language",
    "notificationSound",
    "customSoundPath",
    "notificationType",
  ];
  
  const cleanedSettings = {};
  allowedFields.forEach((field) => {
    if (field in settings) {
      cleanedSettings[field] = settings[field];
    }
  });

  // Check if settings are identical to last saved settings (prevent duplicates)
  if (
    lastSavedSettings &&
    JSON.stringify(lastSavedSettings) === JSON.stringify(cleanedSettings)
  ) {
    console.log("⏭️ Skipping duplicate settings save");
    return;
  }

  console.log("💾 Saving settings:", cleanedSettings);

  // Load previous settings to detect what changed
  const previousSettings = loadSettings();

  saveSettings(cleanedSettings);
  lastSavedSettings = JSON.parse(JSON.stringify(cleanedSettings)); // Store a copy

  // Notify renderer windows about updated settings so they can react immediately
  try {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send("settings-updated", cleanedSettings);
    }
  } catch (err) {
    console.error("Error sending settings-updated:", err);
  }

  // Restart reminders to pick up new settings (especially volume, notification sound)
  startReminders();

  // If theme changed, update any active notification window colors
  if (cleanedSettings.theme !== previousSettings.theme && notificationWindow) {
    try {
      // Re-resolve the theme to actual dark/light
      let themeToUse = cleanedSettings.theme;
      if (cleanedSettings.theme === "system") {
        themeToUse = nativeTheme.shouldUseDarkColors ? "dark" : "light";
      }
      const isDarkMode = themeToUse === "dark";
      
      // Send theme update to notification window
      notificationWindow.webContents.executeJavaScript(`
        const isDark = ${isDarkMode};
        document.querySelector('.notification-tint').style.background = isDark 
          ? 'rgba(15, 23, 42, 0.70)' 
          : 'rgba(248, 250, 252, 0.70)';
        document.querySelector('.notification-tint').style.borderColor = isDark 
          ? 'rgba(148, 163, 184, 0.3)' 
          : 'rgba(203, 213, 225, 0.5)';
        document.querySelector('.notification-tint').style.color = isDark ? 'white' : '#1a1a1a';
        document.querySelector('.close-btn').style.color = isDark ? '#FF002B' : '#d32f2f';
      `).catch(err => console.error("Failed to update notification theme:", err));
    } catch (err) {
      console.error("Error updating notification theme:", err);
    }
  }

  // Only recreate tray if language changed
  if (cleanedSettings.language !== previousSettings.language) {
    console.log("🌐 Language changed, recreating tray");
    currentLanguage = cleanedSettings.language || "en";
    createTray();
  }

  // No reminder-specific settings are being saved currently
  // All reminders use interval-based timing
});

ipcMain.on("save-adhkar", (event, adhkar) => {
  console.log("💾 Saving adhkar, count:", adhkar.length);
  saveAdhkar(adhkar);
  startReminders(); // Restart reminders with new adhkar
});

ipcMain.on("show-notification", (event, { title, body }) => {
  console.log("📢 Manual notification request:", title, body);
  // Now sending only to frontend via IPC
  if (mainWindow) {
    mainWindow.webContents.send("show-custom-notification", { title, body });
  }
});

ipcMain.on("toggle-reminder", (event, paused) => {
  console.log("⏯️ Toggle reminder from app - paused:", paused);
  isPaused = paused;
  if (!paused) {
    // If resuming, trigger a reminder immediately
    startReminders();
  } else if (reminderInterval) {
    // If pausing, clear the interval
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
  // Update tray menu to reflect new state
  updateTrayMenu();
});

ipcMain.on(
  "test-notification-sound",
  (event, soundType, volume, customSoundPath) => {
    console.log(
      "🔊 TEST HANDLER EXECUTING - Playing test sound via main window audio"
    );
    console.log("🔊 Testing notification sound:", soundType);

    // Get sound path
    const soundPath = getNotificationSoundPath(
      soundType,
      volume,
      customSoundPath
    );

    // Play audio through main window using HTML5 Audio API (same as notification system)
    if (soundPath && existsSync(soundPath)) {
      try {
        const audioBuffer = readFileSync(soundPath);
        const audioDataUrl = `data:audio/wav;base64,${audioBuffer.toString(
          "base64"
        )}`;
        console.log(`📢 Test audio loaded, size: ${audioBuffer.length} bytes`);

        // Send to main window to play audio via IPC
        if (mainWindow) {
          mainWindow.webContents.send("play-audio-test", {
            audioUrl: audioDataUrl,
            volume: volume,
          });
          console.log("✅ Test sound sent to main window");
        }
      } catch (error) {
        console.error(`❌ Error loading audio file: ${error.message}`);
      }
    } else {
      console.warn("⚠️ Sound file not found:", soundPath);
    }
  }
);

// Save custom sound file
ipcMain.on("save-custom-sound", (event, filename, fileData) => {
  try {
    console.log("💾 Saving custom sound:", filename);

    const customSoundsDir = join(app.getPath("userData"), "custom-sounds");
    if (!existsSync(customSoundsDir)) {
      mkdirSync(customSoundsDir, { recursive: true });
    }

    const filepath = join(customSoundsDir, filename);

    // Extract base64 data and save to file
    if (fileData.startsWith("data:")) {
      const base64Data = fileData.split(",")[1];
      writeFileSync(filepath, Buffer.from(base64Data, "base64"));
      console.log("✅ Custom sound saved:", filepath);
    }
  } catch (error) {
    console.error("❌ Error saving custom sound:", error);
  }
});

// App events
app.on("ready", () => {
  console.log("🚀 App ready event fired");
  createWindow();
  createTray();
  startReminders();
});

app.on("window-all-closed", () => {
  console.log("🪟 All windows closed");
  if (process.platform !== "darwin") {
    app.isQuitting = true;
    cleanup();
    app.quit();
  }
});

app.on("activate", () => {
  console.log("🔄 App activated");
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on("before-quit", () => {
  console.log("🚪 Before quit event");
  if (!app.isQuitting) {
    app.isQuitting = true;
    cleanup();
  }
});

// Force exit after 2 seconds if not fully closed
app.on("quit", () => {
  console.log("🛑 Quit event - forcing exit");
  setTimeout(() => {
    process.exit(0);
  }, 2000);
});
