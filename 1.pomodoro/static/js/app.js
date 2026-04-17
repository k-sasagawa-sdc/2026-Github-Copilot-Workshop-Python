function findTimerElements() {
  const timerDisplay = document.getElementById('timer-display');
  const startButton = document.getElementById('start-button');
  const pauseButton = document.getElementById('pause-button');

  if (!timerDisplay || !startButton || !pauseButton) {
    return null;
  }

  return {
    pauseButton,
    startButton,
    timerDisplay,
  };
}

function renderRemainingTime(timerDisplay, formatRemainingTime, remainingSeconds) {
  timerDisplay.textContent = formatRemainingTime(remainingSeconds);
}

function bindTimerControls({ timer, startButton, pauseButton }) {
  startButton.addEventListener('click', () => {
    timer.start();
  });

  pauseButton.addEventListener('click', () => {
    timer.pause();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const timerApi = window.PomodoroTimer;
  const elements = findTimerElements();

  if (!elements || !timerApi) {
    return;
  }

  const { createCountdownTimer, formatRemainingTime } = timerApi;
  const { timerDisplay, startButton, pauseButton } = elements;
  const focusSeconds = Number(timerDisplay.dataset.focusSeconds || '1500');
  const render = (remainingSeconds) => {
    renderRemainingTime(timerDisplay, formatRemainingTime, remainingSeconds);
  };

  const timer = createCountdownTimer({
    durationSeconds: focusSeconds,
    onTick: render,
  });

  render(focusSeconds);
  bindTimerControls({ timer, startButton, pauseButton });
});