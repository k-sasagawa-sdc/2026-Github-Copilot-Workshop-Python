(function (globalScope) {
  const MODE_LABELS = {
    focus: 'Focus Session',
    short_break: 'Short Break',
    long_break: 'Long Break',
  };

  const MODE_DESCRIPTIONS = {
    focus: '集中する時間です。1 つの作業だけに絞ります。',
    short_break: '短い休憩で姿勢と呼吸を整えます。',
    long_break: '長休憩でしっかりリカバリーします。',
  };

  function createUiController(elements) {
    function renderButtons(state) {
      elements.startButton.disabled = state !== 'idle' && state !== 'paused';
      elements.pauseButton.disabled = !state.endsWith('_running');
      elements.skipButton.disabled = state === 'idle';
      elements.resetButton.disabled = state === 'idle';
      elements.startButton.textContent = state === 'paused' ? '再開' : '開始';
    }

    return {
      renderCycle(completedFocusSessions, interval) {
        const remainingUntilLongBreak = interval - (completedFocusSessions % interval || interval);
        elements.cycleDisplay.textContent = String(completedFocusSessions);
        elements.longBreakCountdown.textContent = String(remainingUntilLongBreak);
      },
      renderMode(mode) {
        elements.modeDisplay.textContent = MODE_LABELS[mode] || MODE_LABELS.focus;
        elements.modeDescription.textContent = MODE_DESCRIPTIONS[mode] || MODE_DESCRIPTIONS.focus;
        document.body.dataset.mode = mode;
      },
      renderProgress(remainingSeconds, durationSeconds) {
        const safeDuration = Math.max(1, durationSeconds);
        const progress = Math.max(0, Math.min(1, 1 - remainingSeconds / safeDuration));
        elements.progressRing.style.setProperty('--progress', `${progress * 360}deg`);
        elements.progressValue.textContent = `${Math.round(progress * 100)}%`;
      },
      renderSettings(settings) {
        elements.focusMinutes.value = String(settings.focus_minutes);
        elements.shortBreakMinutes.value = String(settings.short_break_minutes);
        elements.longBreakMinutes.value = String(settings.long_break_minutes);
        elements.longBreakInterval.value = String(settings.long_break_interval);
      },
      renderSettingsStatus(message, isError = false) {
        elements.settingsStatus.textContent = message;
        elements.settingsStatus.dataset.state = isError ? 'error' : 'success';
      },
      renderState(state) {
        elements.sessionState.textContent = state === 'paused' ? 'Paused' : state === 'idle' ? 'Ready' : 'Running';
        renderButtons(state);
      },
      renderStats(stats) {
        elements.todayCompletedCount.textContent = String(stats.today_completed_sessions || 0);
        elements.todayFocusMinutes.textContent = String(stats.today_focus_minutes || 0);
        elements.weekCompletedCount.textContent = String(stats.week_completed_sessions || 0);
        elements.weekFocusMinutes.textContent = String(stats.week_focus_minutes || 0);
        elements.weeklySummary.innerHTML = '';

        (stats.weekly_activity || []).forEach((entry) => {
          const item = document.createElement('li');
          item.className = 'weekly-summary-item';
          item.textContent = `${entry.date.slice(5)} ${entry.completed_sessions} 回 / ${entry.focus_minutes} 分`;
          elements.weeklySummary.appendChild(item);
        });
      },
      renderStatus(message) {
        elements.liveRegion.textContent = message;
      },
      renderTime(textValue) {
        elements.timerDisplay.textContent = textValue;
      },
    };
  }

  globalScope.PomodoroUi = {
    createUiController,
  };
})(typeof window !== 'undefined' ? window : globalThis);