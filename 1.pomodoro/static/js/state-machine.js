(function (globalScope) {
  const MODES = {
    focus: 'focus',
    shortBreak: 'short_break',
    longBreak: 'long_break',
  };

  const STATES = {
    idle: 'idle',
    paused: 'paused',
    focusRunning: 'focus_running',
    shortBreakRunning: 'short_break_running',
    longBreakRunning: 'long_break_running',
  };

  function toRunningState(mode) {
    if (mode === MODES.shortBreak) {
      return STATES.shortBreakRunning;
    }

    if (mode === MODES.longBreak) {
      return STATES.longBreakRunning;
    }

    return STATES.focusRunning;
  }

  function getNextMode({ currentMode, completedFocusSessions, longBreakInterval }) {
    if (currentMode === MODES.focus) {
      return completedFocusSessions % longBreakInterval === 0 ? MODES.longBreak : MODES.shortBreak;
    }

    return MODES.focus;
  }

  function createPomodoroStateMachine({ longBreakInterval = 4 } = {}) {
    let state = STATES.idle;
    let mode = MODES.focus;
    let pausedMode = MODES.focus;
    let completedFocusSessions = 0;

    function transitionToRunning(nextMode) {
      mode = nextMode;
      state = toRunningState(nextMode);
    }

    return {
      dispatch(eventName) {
        switch (eventName) {
          case 'start':
            if (state === STATES.idle) {
              transitionToRunning(MODES.focus);
            }
            break;
          case 'pause':
            if (state === STATES.focusRunning || state === STATES.shortBreakRunning || state === STATES.longBreakRunning) {
              pausedMode = mode;
              state = STATES.paused;
            }
            break;
          case 'resume':
            if (state === STATES.paused) {
              transitionToRunning(pausedMode);
            }
            break;
          case 'reset':
            state = STATES.idle;
            mode = MODES.focus;
            pausedMode = MODES.focus;
            break;
          case 'complete':
            if (state === STATES.focusRunning || state === STATES.shortBreakRunning || state === STATES.longBreakRunning) {
              if (mode === MODES.focus) {
                completedFocusSessions += 1;
              }

              transitionToRunning(
                getNextMode({
                  currentMode: mode,
                  completedFocusSessions,
                  longBreakInterval,
                }),
              );
            }
            break;
          case 'skip':
            if (state === STATES.focusRunning || state === STATES.shortBreakRunning || state === STATES.longBreakRunning || state === STATES.paused) {
              transitionToRunning(
                getNextMode({
                  currentMode: mode,
                  completedFocusSessions,
                  longBreakInterval,
                }),
              );
            }
            break;
          default:
            break;
        }

        return state;
      },
      getCompletedFocusSessions() {
        return completedFocusSessions;
      },
      getMode() {
        return mode;
      },
      getState() {
        return state;
      },
      isRunning() {
        return state === STATES.focusRunning || state === STATES.shortBreakRunning || state === STATES.longBreakRunning;
      },
      setLongBreakInterval(nextLongBreakInterval) {
        longBreakInterval = nextLongBreakInterval;
      },
    };
  }

  const stateMachineApi = {
    MODES,
    STATES,
    createPomodoroStateMachine,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = stateMachineApi;
  }

  globalScope.PomodoroStateMachine = stateMachineApi;
})(typeof window !== 'undefined' ? window : globalThis);