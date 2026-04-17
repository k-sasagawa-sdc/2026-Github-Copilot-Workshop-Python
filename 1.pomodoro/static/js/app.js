function findTimerElements() {
  const ids = [
    'timer-display',
    'mode-display',
    'mode-description',
    'start-button',
    'pause-button',
    'skip-button',
    'reset-button',
    'settings-form',
    'focus-minutes',
    'short-break-minutes',
    'long-break-minutes',
    'long-break-interval',
    'settings-status',
    'today-completed-count',
    'today-focus-minutes',
    'week-completed-count',
    'week-focus-minutes',
    'weekly-summary',
    'progress-ring',
    'progress-value',
    'session-state',
    'cycle-display',
    'long-break-countdown',
    'live-region',
  ];

  const elements = ids.reduce((result, id) => {
    result[id.replace(/-([a-z])/g, (_, character) => character.toUpperCase())] = document.getElementById(id);
    return result;
  }, {});

  const isComplete = Object.values(elements).every(Boolean);
  return isComplete ? elements : null;
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function createTonePlayer() {
  let audioContext = null;

  return () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    audioContext = audioContext || new AudioContextClass();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 660;
    gainNode.gain.value = 0.05;
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.18);
  };
}

function announceNotification(title, body) {
  if (typeof Notification === 'undefined') {
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, { body });
    return;
  }

  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const timerApi = window.PomodoroTimer;
  const stateMachineApi = window.PomodoroStateMachine;
  const storageApi = window.PomodoroStorage;
  const uiApi = window.PomodoroUi;
  const elements = findTimerElements();

  if (!elements || !timerApi || !stateMachineApi || !storageApi || !uiApi) {
    return;
  }

  const { createCountdownTimer, formatRemainingTime } = timerApi;
  const { createPomodoroStateMachine } = stateMachineApi;
  const ui = uiApi.createUiController(elements);
  const playTone = createTonePlayer();

  let settings = storageApi.readInitialSettings();
  let stats = storageApi.readInitialStats();
  let currentSessionStartedAt = null;

  const machine = createPomodoroStateMachine({
    longBreakInterval: settings.long_break_interval,
  });

  function getDurationSecondsForMode(mode) {
    if (mode === 'short_break') {
      return settings.short_break_minutes * 60;
    }

    if (mode === 'long_break') {
      return settings.long_break_minutes * 60;
    }

    return settings.focus_minutes * 60;
  }

  function renderRemainingTime(remainingSeconds) {
    ui.renderTime(formatRemainingTime(remainingSeconds));
    ui.renderProgress(remainingSeconds, timer.getDurationSeconds());
  }

  async function refreshStats() {
    stats = await storageApi.loadStats(getTodayIsoDate());
    ui.renderStats(stats);
  }

  function syncUi() {
    ui.renderMode(machine.getMode());
    ui.renderState(machine.getState());
    ui.renderCycle(machine.getCompletedFocusSessions(), settings.long_break_interval);
  }

  async function handleSessionCompleted() {
    const completedMode = machine.getMode();
    const endedAt = new Date();

    await storageApi.saveSession({
      actual_seconds: timer.getDurationSeconds(),
      completed: true,
      ended_at: endedAt.toISOString(),
      mode: completedMode,
      planned_seconds: timer.getDurationSeconds(),
      started_at: (currentSessionStartedAt || endedAt).toISOString(),
    });

    machine.dispatch('complete');
    timer.setDuration(getDurationSecondsForMode(machine.getMode()));
    currentSessionStartedAt = new Date();
    playTone();
    announceNotification('Pomodoro Timer', `${completedMode} が完了しました。次は ${machine.getMode()} です。`);
    syncUi();
    renderRemainingTime(timer.getRemainingSeconds());
    await refreshStats();
    timer.start();
    ui.renderStatus('セッションが完了し、次のモードへ切り替えました。');
  }

  const timer = createCountdownTimer({
    durationSeconds: getDurationSecondsForMode('focus'),
    onComplete: handleSessionCompleted,
    onTick: renderRemainingTime,
  });

  function resetToFocusMode(statusMessage) {
    machine.dispatch('reset');
    timer.setDuration(getDurationSecondsForMode('focus'));
    currentSessionStartedAt = null;
    syncUi();
    renderRemainingTime(timer.getRemainingSeconds());
    if (statusMessage) {
      ui.renderStatus(statusMessage);
    }
  }

  elements.startButton.addEventListener('click', () => {
    if (machine.getState() === 'paused') {
      machine.dispatch('resume');
      timer.resume();
      syncUi();
      ui.renderStatus('タイマーを再開しました。');
      return;
    }

    if (machine.getState() !== 'idle') {
      return;
    }

    machine.dispatch('start');
    timer.setDuration(getDurationSecondsForMode(machine.getMode()));
    currentSessionStartedAt = new Date();
    syncUi();
    timer.start();
    ui.renderStatus('タイマーを開始しました。');
  });

  elements.pauseButton.addEventListener('click', () => {
    machine.dispatch('pause');
    timer.pause();
    syncUi();
    ui.renderStatus('タイマーを一時停止しました。');
  });

  elements.resetButton.addEventListener('click', () => {
    resetToFocusMode('タイマーをリセットしました。');
  });

  elements.skipButton.addEventListener('click', () => {
    if (machine.getState() === 'idle') {
      return;
    }

    machine.dispatch('skip');
    timer.setDuration(getDurationSecondsForMode(machine.getMode()));
    currentSessionStartedAt = new Date();
    syncUi();
    timer.start();
    ui.renderStatus('現在のセッションをスキップしました。');
  });

  elements.settingsForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nextSettings = {
      focus_minutes: Number(elements.focusMinutes.value),
      short_break_minutes: Number(elements.shortBreakMinutes.value),
      long_break_minutes: Number(elements.longBreakMinutes.value),
      long_break_interval: Number(elements.longBreakInterval.value),
    };

    try {
      settings = await storageApi.saveSettings(nextSettings);
      machine.setLongBreakInterval(settings.long_break_interval);
      ui.renderSettings(settings);
      ui.renderSettingsStatus('設定を保存しました。');

      if (machine.getState() === 'idle') {
        timer.setDuration(getDurationSecondsForMode('focus'));
        renderRemainingTime(timer.getRemainingSeconds());
      }

      syncUi();
    } catch (error) {
      const validationErrors = error.validationErrors || error.payload?.errors || {};
      const firstError = Object.values(validationErrors)[0] || '設定を保存できませんでした。';
      ui.renderSettingsStatus(firstError, true);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      return;
    }

    timer.sync();
  });

  settings = await storageApi.loadSettings();
  ui.renderSettings(settings);
  ui.renderStats(stats);
  timer.setDuration(getDurationSecondsForMode('focus'));
  syncUi();
  renderRemainingTime(timer.getRemainingSeconds());
  await refreshStats();
});