// Theme utilities
export const updateDarkMode = (isDark) => {
  if (isDark) {
    document.documentElement.classList.add("dark");
    document.body.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  } else {
    document.documentElement.classList.remove("dark");
    document.body.classList.remove("dark");
    // If the class attribute is now empty, remove it to avoid stray empty attributes
    if (!document.documentElement.classList.length) {
      document.documentElement.removeAttribute("class");
    }
    if (!document.body.classList.length) {
      document.body.removeAttribute("class");
    }
    document.documentElement.style.colorScheme = "light";
  }
};

export const resolveTheme = (theme) => {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return theme === "dark";
};

export const getSystemTheme = () => {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
};

export const watchThemeChanges = (callback) => {
  if (!window.matchMedia) return;

  const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleChange = (e) => {
    callback(e.matches ? "dark" : "light");
  };

  darkModeQuery.addEventListener("change", handleChange);

  return () => darkModeQuery.removeEventListener("change", handleChange);
};
