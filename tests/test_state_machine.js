const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createPomodoroStateMachine,
} = require('../1.pomodoro/static/js/state-machine.js');

test('idle で start すると focus_running になる', () => {
  const machine = createPomodoroStateMachine();

  machine.dispatch('start');

  assert.equal(machine.getState(), 'focus_running');
});

test('focus_running で pause すると paused になる', () => {
  const machine = createPomodoroStateMachine();

  machine.dispatch('start');
  machine.dispatch('pause');

  assert.equal(machine.getState(), 'paused');
  assert.equal(machine.getMode(), 'focus');
});

test('paused で resume すると元の running 状態に戻る', () => {
  const machine = createPomodoroStateMachine();

  machine.dispatch('start');
  machine.dispatch('pause');
  machine.dispatch('resume');

  assert.equal(machine.getState(), 'focus_running');
});

test('paused で pause しても状態が壊れない', () => {
  const machine = createPomodoroStateMachine();

  machine.dispatch('start');
  machine.dispatch('pause');
  machine.dispatch('pause');

  assert.equal(machine.getState(), 'paused');
});

test('idle で resume しても状態が壊れない', () => {
  const machine = createPomodoroStateMachine();

  machine.dispatch('resume');

  assert.equal(machine.getState(), 'idle');
});

test('focus 完了後は短休憩へ切り替わる', () => {
  const machine = createPomodoroStateMachine({
    longBreakInterval: 4,
  });

  machine.dispatch('start');
  machine.dispatch('complete');

  assert.equal(machine.getState(), 'short_break_running');
  assert.equal(machine.getCompletedFocusSessions(), 1);
});

test('規定回数の focus 完了後は長休憩へ切り替わる', () => {
  const machine = createPomodoroStateMachine({
    longBreakInterval: 2,
  });

  machine.dispatch('start');
  machine.dispatch('complete');
  machine.dispatch('complete');
  machine.dispatch('complete');

  assert.equal(machine.getState(), 'long_break_running');
  assert.equal(machine.getCompletedFocusSessions(), 2);
});

test('休憩完了後は focus に戻る', () => {
  const machine = createPomodoroStateMachine();

  machine.dispatch('start');
  machine.dispatch('complete');
  machine.dispatch('complete');

  assert.equal(machine.getState(), 'focus_running');
});

test('skip は妥当な次モードへ進む', () => {
  const machine = createPomodoroStateMachine();

  machine.dispatch('start');
  machine.dispatch('complete');
  machine.dispatch('skip');

  assert.equal(machine.getState(), 'focus_running');
  assert.equal(machine.getCompletedFocusSessions(), 1);
});