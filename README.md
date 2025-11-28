# Zikr Reminder - Islamic Adhkar Notification App

A Windows desktop application for Islamic adhkar reminders with system tray integration, glassmorphic notifications, and customizable settings.

## Features

✨ **Core Features:**

- 🕌 Automatic adhkar reminders at customizable intervals
- 🔔 Floating glassmorphic notifications that appear above all windows
- 🎨 Dark/Light theme support
- 📌 System tray integration with context menu
- ⏸️ Pause/Resume reminders
- 🎵 Volume control
- 📱 Add/Edit/Delete custom adhkar
- 💾 Persistent storage (automatic save)

⚡ **Technical:**

- Built with Electron + React
- Real-time notifications with smooth animations
- Offline-first (no internet required)
- Compact & lightweight
- Always-on-top notification windows

## Quick Start

### Installation

1. **Install Dependencies:**

   ```bash
   npm install
   ```

2. **Start Development:**

   ```bash
   npm start
   ```

   - React dev server starts on `http://localhost:3000`
   - Electron app opens automatically
   - First reminder appears in 10 seconds

3. **Build for Windows:**
   ```bash
   npm run build-electron
   ```
   Creates `Zikr-Reminder.exe` installer in `dist/` folder

## Usage

### Main Window

- **Add Adhkar:** Click "+" button, enter text, click Add
- **Reminder Interval:** Adjust in Settings panel (default: 5 minutes)
- **Pause/Resume:** Click pause icon (⏸️) / play icon (▶️)
- **Settings:** Click gear icon ⚙️ to customize theme and volume

### Notifications

- Floating window appears at bottom-left corner every reminder interval
- Very transparent glassmorphic design with 50px blur
- Shows only the adhkar text (minimal, clean)
- Close button (X) to dismiss manually
- Auto-closes after 5 seconds
- Smooth slide animations (in/out)
- Always appears above all other windows

### System Tray

- **Left-click:** Show/Hide app window
- **Right-click:** Context menu with options:
  - Show App - Open main window
  - Pause/Resume Reminders - Toggle reminders on/off
  - Settings - Access app settings
  - Exit - Quit application
- App minimizes to tray (doesn't close)

## File Structure

```
public/
├── main.js              # Electron main process (windows, tray, reminders)
├── preload.js           # IPC bridge for secure communication
└── icons/              # App and tray icons

src/
├── App.jsx             # Main React component
├── components/         # React components
├── styles/             # CSS styling
└── utils/              # Helper functions
```

## Configuration

**Key Files:**

- `.env` - BROWSER=none (prevents browser auto-open)
- `package.json` - Dependencies & scripts
- `tailwind.config.js` - Tailwind CSS configuration

## Customization

### Notification Duration

Edit `public/main.js`, find `createNotificationWindow()` function and change:

```javascript
setTimeout(() => {
  notificationWindow.destroy();
}, 5000); // milliseconds (5 seconds)
```

### Reminder Interval

In Settings panel or edit `public/main.js`:

```javascript
reminderInterval: 5, // minutes
```

### Default Adhkar

Edit `public/main.js`, find `defaultAdhkar` array

## Data Storage

- **Settings:** `%APPDATA%/zikr-reminder/data/settings.json`
- **Adhkar:** `%APPDATA%/zikr-reminder/data/adhkar.json`

## npm Scripts

- `npm start` - Start development (Electron + React)
- `npm run build-electron` - Build Windows installer
- `npm run build` - Build React production bundle

## Troubleshooting

**App won't start?**

- Run `npm install` again
- Delete `node_modules/` and reinstall

**Notifications not appearing?**

- Check reminder interval in Settings (default: 5 minutes)
- Wait at least 10 seconds after app launch

**Icons missing?**

- Icons auto-generate on first run in `public/icons/`

---

**Version:** 1.0.0 Production Ready
