// Storage utilities for managing adhkar and settings
export const getAdhkar = async () => {
  try {
    if (window.electron) {
      const result = await window.electron.getAdhkar();
      return result || [];
    }
  } catch (error) {
    console.error("Error getting adhkar:", error);
  }
  return [];
};

export const saveAdhkar = (adhkar) => {
  try {
    if (window.electron) {
      window.electron.saveAdhkar(adhkar);
    }
  } catch (error) {
    console.error("Error saving adhkar:", error);
  }
};

export const getSettings = async () => {
  try {
    if (window.electron) {
      const result = await window.electron.getSettings();
      return result || { theme: "dark" };
    }
  } catch (error) {
    console.error("Error getting settings:", error);
  }
  return { theme: "dark" };
};

export const saveSettings = (settings) => {
  try {
    if (window.electron) {
      window.electron.saveSettings(settings);
    }
  } catch (error) {
    console.error("Error saving settings:", error);
  }
};

export const addAdhkar = async (
  text,
  category = "general",
  repeats = 1,
  reminderInterval = 5,
  infiniteRepeat = false,
  delayMs = 0
) => {
  try {
    const adhkar = await getAdhkar();
    const newId =
      adhkar.length > 0 ? Math.max(...adhkar.map((a) => a.id)) + 1 : 1;
    const newAdhkar = {
      id: newId,
      text,
      category,
      repeats,
      reminderInterval,
      infiniteRepeat,
      delayMs,
      createdAt: new Date().toISOString(),
    };
    adhkar.push(newAdhkar);
    saveAdhkar(adhkar);
    return newAdhkar;
  } catch (error) {
    console.error("Error adding adhkar:", error);
    return null;
  }
};

export const updateAdhkar = async (id, updates) => {
  try {
    const adhkar = await getAdhkar();
    const index = adhkar.findIndex((a) => a.id === id);
    if (index !== -1) {
      adhkar[index] = { ...adhkar[index], ...updates };
      saveAdhkar(adhkar);
    }
  } catch (error) {
    console.error("Error updating adhkar:", error);
  }
};

export const deleteAdhkar = async (id) => {
  try {
    const adhkar = await getAdhkar();
    const filtered = adhkar.filter((a) => a.id !== id);
    saveAdhkar(filtered);
  } catch (error) {
    console.error("Error deleting adhkar:", error);
  }
};

export const showNotification = (title, body) => {
  try {
    if (window.electron) {
      window.electron.showNotification(title, body);
    }
  } catch (error) {
    console.error("Error showing notification:", error);
  }
};

export const toggleReminder = (paused) => {
  try {
    if (window.electron) {
      window.electron.toggleReminder(paused);
    }
  } catch (error) {
    console.error("Error toggling reminder:", error);
  }
};
