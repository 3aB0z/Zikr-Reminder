const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  getSettings: () => ipcRenderer.invoke("get-settings"),
  getAdhkar: () => ipcRenderer.invoke("get-adhkar"),
  saveSettings: (settings) => ipcRenderer.send("save-settings", settings),
  saveAdhkar: (adhkar) => ipcRenderer.send("save-adhkar", adhkar),
  showNotification: (title, body) =>
    ipcRenderer.send("show-notification", { title, body }),
  toggleReminder: (paused) => ipcRenderer.send("toggle-reminder", paused),
  testNotificationSound: (soundType, volume, customSoundPath) =>
    ipcRenderer.send(
      "test-notification-sound",
      soundType,
      volume,
      customSoundPath
    ),
  saveCustomSound: (filename, fileData) =>
    ipcRenderer.send("save-custom-sound", filename, fileData),
  onNewReminder: (callback) =>
    ipcRenderer.on("new-reminder", (event, data) => callback(data)),
  onReminderStatusChanged: (callback) =>
    ipcRenderer.on("reminder-status-changed", (event, isActive) =>
      callback(isActive)
    ),
  onPlaySound: (callback) =>
    ipcRenderer.on("play-sound", (event, data) => callback(data)),
  onPlayAudioTest: (callback) =>
    ipcRenderer.on("play-audio-test", (event, data) => callback(data)),
  onSettingsUpdated: (callback) =>
    ipcRenderer.on("settings-updated", (event, settings) => callback(settings)),
  removeReminder: (callback) =>
    ipcRenderer.removeListener("new-reminder", callback),
  removeReminderStatusChanged: (callback) =>
    ipcRenderer.removeListener("reminder-status-changed", callback),
  removePlaySound: (callback) =>
    ipcRenderer.removeListener("play-sound", callback),
  removePlayAudioTest: (callback) =>
    ipcRenderer.removeListener("play-audio-test", callback),
});
