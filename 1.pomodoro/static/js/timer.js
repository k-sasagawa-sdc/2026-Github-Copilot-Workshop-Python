(function (globalScope) {
  const TIMER_TICK_INTERVAL_MS = 1000;
  const TIMER_STATUS = {
    idle: 'idle',
    paused: 'paused',
    running: 'running',
  };

  function formatRemainingTime(totalSeconds) {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function calculateRemainingSeconds({ durationSeconds, startedAtMs, nowMs }) {
    const elapsedSeconds = Math.floor((nowMs - startedAtMs) / 1000);

    return Math.max(0, durationSeconds - elapsedSeconds);
  }

  function createCountdownTimer({
    durationSeconds,
    now = () => Date.now(),
    onTick = () => {},
    scheduleRepeating = (callback, delayMs) => globalScope.setInterval(callback, delayMs),
    cancelRepeating = (intervalId) => globalScope.clearInterval(intervalId),
  }) {
    let status = TIMER_STATUS.idle;
    let startedAtMs = null;
    let remainingSeconds = durationSeconds;
    let intervalId = null;

    function isRunning() {
      return status === TIMER_STATUS.running;
    }

    function setStatus(nextStatus) {
      status = nextStatus;
    }

    function stopInterval() {
      if (intervalId === null) {
        return;
      }

      cancelRepeating(intervalId);
      intervalId = null;
    }

    function updateRemainingSeconds() {
      if (startedAtMs === null) {
        return;
      }

      remainingSeconds = calculateRemainingSeconds({
        durationSeconds,
        startedAtMs,
        nowMs: now(),
      });
    }

    function startInterval() {
      intervalId = scheduleRepeating(emitTick, TIMER_TICK_INTERVAL_MS);
    }

    function emitTick() {
      updateRemainingSeconds();

      onTick(remainingSeconds);

      if (remainingSeconds === 0) {
        stopInterval();
        setStatus(TIMER_STATUS.idle);
      }
    }

    return {
      start() {
        if (isRunning()) {
          return;
        }

        setStatus(TIMER_STATUS.running);
        startedAtMs = now();
        startInterval();
      },
      pause() {
        if (!isRunning()) {
          return;
        }

        updateRemainingSeconds();
        stopInterval();
        setStatus(TIMER_STATUS.paused);
      },
      getRemainingSeconds() {
        return remainingSeconds;
      },
      getStatus() {
        return status;
      },
    };
  }

  const timerApi = {
    calculateRemainingSeconds,
    createCountdownTimer,
    formatRemainingTime,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = timerApi;
  }

  globalScope.PomodoroTimer = timerApi;
})(typeof window !== 'undefined' ? window : globalThis);