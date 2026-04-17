(function (globalScope) {
  const STORAGE_KEY = 'pomodoro-settings';
  const DEFAULT_SETTINGS = {
    focus_minutes: 25,
    short_break_minutes: 5,
    long_break_minutes: 15,
    long_break_interval: 4,
  };

  function canUseLocalStorage() {
    try {
      return typeof globalScope.localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  function readJsonScript(scriptId, fallbackValue) {
    const element = document.getElementById(scriptId);

    if (!element) {
      return fallbackValue;
    }

    try {
      return JSON.parse(element.textContent || 'null') ?? fallbackValue;
    } catch {
      return fallbackValue;
    }
  }

  function validateSettings(settings) {
    const errors = {};
    const rules = {
      focus_minutes: [1, 120],
      short_break_minutes: [1, 60],
      long_break_minutes: [1, 90],
      long_break_interval: [1, 12],
    };

    Object.entries(rules).forEach(([key, [minimum, maximum]]) => {
      const value = Number(settings[key]);

      if (!Number.isInteger(value)) {
        errors[key] = '整数で指定してください。';
        return;
      }

      if (value < minimum || value > maximum) {
        errors[key] = `${minimum} から ${maximum} の範囲で指定してください。`;
      }
    });

    return errors;
  }

  function normalizeSettings(settings) {
    return {
      ...DEFAULT_SETTINGS,
      ...(settings || {}),
    };
  }

  function saveLocalSettings(settings) {
    if (!canUseLocalStorage()) {
      return;
    }

    globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function loadLocalSettings() {
    if (!canUseLocalStorage()) {
      return null;
    }

    const rawValue = globalScope.localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    try {
      return normalizeSettings(JSON.parse(rawValue));
    } catch {
      return null;
    }
  }

  async function requestJson(path, options) {
    const response = await globalScope.fetch(path, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    const payload = await response.json();

    if (!response.ok) {
      const error = new Error('request failed');
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  async function loadSettings() {
    try {
      const settings = normalizeSettings(await requestJson('/api/settings'));
      saveLocalSettings(settings);
      return settings;
    } catch {
      return normalizeSettings(loadLocalSettings() || readJsonScript('initial-settings', DEFAULT_SETTINGS));
    }
  }

  async function saveSettings(settings) {
    const normalizedSettings = normalizeSettings(settings);
    const errors = validateSettings(normalizedSettings);

    if (Object.keys(errors).length > 0) {
      const error = new Error('invalid settings');
      error.validationErrors = errors;
      throw error;
    }

    saveLocalSettings(normalizedSettings);

    try {
      return normalizeSettings(
        await requestJson('/api/settings', {
          method: 'PUT',
          body: JSON.stringify(normalizedSettings),
        }),
      );
    } catch {
      return normalizedSettings;
    }
  }

  async function saveSession(session) {
    try {
      return await requestJson('/api/sessions', {
        method: 'POST',
        body: JSON.stringify(session),
      });
    } catch {
      return null;
    }
  }

  async function loadStats(today) {
    try {
      return await requestJson(`/api/stats?today=${encodeURIComponent(today)}`);
    } catch {
      return readJsonScript('initial-stats', {
        today_completed_sessions: 0,
        today_focus_minutes: 0,
        week_completed_sessions: 0,
        week_focus_minutes: 0,
        weekly_activity: [],
      });
    }
  }

  globalScope.PomodoroStorage = {
    DEFAULT_SETTINGS,
    loadLocalSettings,
    loadSettings,
    loadStats,
    readInitialSettings() {
      return normalizeSettings(readJsonScript('initial-settings', DEFAULT_SETTINGS));
    },
    readInitialStats() {
      return readJsonScript('initial-stats', {
        today_completed_sessions: 0,
        today_focus_minutes: 0,
        week_completed_sessions: 0,
        week_focus_minutes: 0,
        weekly_activity: [],
      });
    },
    saveLocalSettings,
    saveSession,
    saveSettings,
    validateSettings,
  };
})(typeof window !== 'undefined' ? window : globalThis);