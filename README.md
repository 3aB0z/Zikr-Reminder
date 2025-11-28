# Zikr Reminder - Islamic Adhkar Desktop App

<div align="center">

![Zikr Reminder](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows-0078d4)

**A modern desktop application for Islamic adhkar reminders with glassmorphic notifications and system tray integration.**

[Download](#-installation) • [Features](#-features) • [Usage](#-usage) • [Development](#-development)

</div>

---

## 📥 Installation

### For Users (Recommended)

**Download and run the app in 30 seconds:**

1. Go to the [Releases](https://github.com/yourusername/Zikr-Reminder/releases) page
2. Download `Zikr Reminder 1.0.0.exe` from the latest release
3. Run the `.exe` file
4. The app will start and create a system tray icon
5. Done! 🎉

**That's it!** No installation wizard, no setup. Just download and run.

### System Requirements

- **Windows 7** or later (Windows 10/11 recommended)
- **100 MB** free disk space
- **No internet** required (works offline)

### First Launch

When you first run the app:
- A system tray icon appears (look for the Islamic icon in the bottom-right)
- Click the icon to open the app window
- Right-click for options (Pause, Resume, Settings, Exit)
- First reminder will appear within 10 seconds

---

## ✨ Features

### 🕌 Core Features

- **Automatic Reminders** - Customizable intervals (default: 5 minutes)
- **Floating Notifications** - Glassmorphic design with blur effects
- **Dark/Light Mode** - Auto-detect system theme or manual selection
- **System Tray** - Control app from notification area
- **Pause/Resume** - Stop reminders without closing the app
- **Volume Control** - Adjust notification volume (0-100%)
- **Custom Adhkar** - Add, edit, delete your own adhkar
- **Auto-Save** - All settings saved automatically
- **Always-On-Top** - Notifications appear above all windows
- **Multilingual** - English & Arabic support

### ⚡ Technical Features

- **Built with Electron + React** - Modern desktop tech stack
- **Smooth Animations** - Framer Motion for fluid UI
- **Tailwind CSS** - Beautiful, responsive design
- **Offline-First** - No internet connection needed
- **Lightweight** - ~200MB total size
- **Fast Launch** - Opens in < 2 seconds

---

## 🎮 Usage

### Main Window

| Button | Action |
|--------|--------|
| **+** | Add new adhkar |
| **Pause** (⏸️) | Pause all reminders |
| **Settings** (⚙️) | Configure theme and volume |
| **Language** (🌐) | Switch between English/Arabic |

### Notifications

When a reminder triggers:
- A beautiful notification appears at the bottom-left corner
- Shows your adhkar text in a glassmorphic window
- Auto-closes after 5 seconds (or click anywhere to dismiss)
- Plays a sound (if enabled)
- Won't interfere with your work

### System Tray (Right-click menu)

```
Zikr Reminder
├── Show/Hide        → Toggle main window
├── Pause/Resume     → Control reminders
├── Settings         → App preferences
└── Exit             → Quit application
```

### Settings

**Theme:**
- System (auto-detect)
- Light mode
- Dark mode

**Sound:**
- Default bell
- Chime
- Custom sound (upload your own)
- Muted

**Notification Type:**
- Floating window (custom glassmorphic)
- System notification (Windows)

**Reminder Interval:**
- Adjustable in minutes (1-60 min)

---

## 📂 Default Adhkar

The app comes pre-loaded with classic Islamic adhkar:

1. Subhan Allah (سبحان الله) - 33 times
2. Alhamdulillah (الحمد لله) - 33 times
3. Allahu Akbar (الله أكبر) - 34 times
4. La ilaha illallah (لا إله إلا الله) - 1 time
5. Astaghfirullah (أستغفر الله) - 10 times

You can add more or customize these as needed.

---

## 🛠️ Development

### For Developers

**Setup development environment:**

```bash
# Clone the repository
git clone https://github.com/yourusername/Zikr-Reminder.git
cd Zikr-Reminder

# Install dependencies
npm install

# Start development (Electron + React)
npm start
```

This will:
- Start React dev server on `http://localhost:7361`
- Open Electron app automatically
- Enable hot-reload (changes update instantly)

### Build for Production

```bash
# Create optimized .exe file
npm run build-electron
```

Output: `dist/Zikr Reminder 1.0.0.exe`

### Project Structure

```
.
├── public/
│   ├── main.js              # Electron main process
│   ├── preload.js           # IPC security bridge
│   ├── notification-preload.js
│   └── icons/               # .ico files
├── src/
│   ├── App.jsx              # Main React component
│   ├── components/
│   │   ├── AdkarForm.jsx
│   │   ├── AdkarList.jsx
│   │   ├── NotificationPopup.jsx
│   │   └── SettingsPanel.jsx
│   ├── styles/
│   │   └── index.css
│   ├── utils/
│   │   ├── storage.js
│   │   ├── theme.js
│   │   └── i18n.js
│   └── index.js
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

### Key Files Explained

| File | Purpose |
|------|---------|
| `public/main.js` | Manages windows, tray, reminders, IPC |
| `public/preload.js` | Secure bridge between app and system |
| `src/App.jsx` | React UI - adhkar list, settings |
| `src/utils/storage.js` | Save/load user data |
| `src/utils/theme.js` | Dark/light mode logic |

### Customization Examples

**Change reminder interval:**

Edit `public/main.js`, find `startReminders()` and modify the interval.

**Change notification duration:**

Find `createNotificationWindow()` in `public/main.js`:
```javascript
setTimeout(() => {
  notificationWindow.hide(); // Currently hides after 5000ms
}, 5000);
```

**Add custom sounds:**

Place `.wav` or `.mp3` files in `public/sounds/` and reference in settings.

---

## 📊 Data Storage

All your data is stored locally (never sent anywhere):

- **Settings:** `%APPDATA%\Zikr Reminder\data\settings.json`
- **Adhkar:** `%APPDATA%\Zikr Reminder\data\adhkar.json`

You can backup these files for restore on another PC.

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **App crashes on startup** | Delete `%APPDATA%\Zikr Reminder` and restart |
| **No notifications showing** | Check reminder interval in settings (min 1 min) |
| **Tray icon not visible** | Look in hidden icons area (click arrow in tray) |
| **App runs slow** | Close other heavy applications |
| **Sound not playing** | Check volume settings and Windows volume |

---

## 🚀 npm Scripts

```bash
npm start              # Development mode (Electron + React)
npm run dev            # React dev server only
npm run build          # Build React production files
npm run build-electron # Create .exe installer
npm run preview        # Preview production build
```

---

## 📜 License

MIT License - See [LICENSE](LICENSE) file for details

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs on GitHub Issues
- Submit pull requests
- Suggest features
- Improve documentation

---

## 📧 Support

Have questions or issues?

- Open a [GitHub Issue](https://github.com/yourusername/Zikr-Reminder/issues)
- Check existing issues first
- Provide details about your system and the problem

---

## 📝 Changelog

### v1.0.0 (Current)

✅ Initial release
✅ Floating glassmorphic notifications
✅ System tray integration
✅ Dark/Light theme support
✅ Volume control with audio
✅ Custom adhkar management
✅ English & Arabic support
✅ Offline-first architecture

---

<div align="center">

**Made with ❤️ for the Muslim community**

[⬆ Back to top](#zikr-reminder---islamic-adhkar-desktop-app)

</div>
