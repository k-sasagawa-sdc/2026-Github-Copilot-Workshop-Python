const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateRemainingSeconds,
  createCountdownTimer,
  formatRemainingTime,
} = require('../1.pomodoro/static/js/timer.js');

test('formatRemainingTime は 25 分を mm:ss 形式で返す', () => {
  assert.equal(formatRemainingTime(1500), '25:00');
});

test('formatRemainingTime は 1 分未満でも 0 埋めする', () => {
  assert.equal(formatRemainingTime(5), '00:05');
});

test('calculateRemainingSeconds は経過秒数を差し引いた残り秒数を返す', () => {
  assert.equal(
    calculateRemainingSeconds({
      durationSeconds: 1500,
      startedAtMs: 1000,
      nowMs: 61000,
    }),
    1440,
  );
});

test('calculateRemainingSeconds は 0 未満にならない', () => {
  assert.equal(
    calculateRemainingSeconds({
      durationSeconds: 10,
      startedAtMs: 1000,
      nowMs: 20000,
    }),
    0,
  );
});

test('createCountdownTimer の start は 1 秒ごとの更新を開始する', () => {
  let currentTimeMs = 0;
  let scheduledCallback = null;
  let scheduledDelay = null;
  const tickEvents = [];

  const timer = createCountdownTimer({
    durationSeconds: 1500,
    now: () => currentTimeMs,
    onTick: (remainingSeconds) => {
      tickEvents.push(remainingSeconds);
    },
    scheduleRepeating: (callback, delayMs) => {
      scheduledCallback = callback;
      scheduledDelay = delayMs;
      return 'interval-id';
    },
    cancelRepeating: () => {},
  });

  timer.start();

  assert.equal(timer.getStatus(), 'running');
  assert.equal(scheduledDelay, 1000);

  currentTimeMs = 1000;
  scheduledCallback();

  assert.equal(timer.getRemainingSeconds(), 1499);
  assert.deepEqual(tickEvents, [1499]);
});

test('createCountdownTimer の start は実行中に再度呼ばれても二重開始しない', () => {
  let scheduleCount = 0;

  const timer = createCountdownTimer({
    durationSeconds: 1500,
    now: () => 0,
    onTick: () => {},
    scheduleRepeating: () => {
      scheduleCount += 1;
      return 'interval-id';
    },
    cancelRepeating: () => {},
  });

  timer.start();
  timer.start();

  assert.equal(scheduleCount, 1);
});

test('createCountdownTimer の pause は現在の残り時間を保持して停止する', () => {
  let currentTimeMs = 0;
  let scheduledCallback = null;
  let cancelledIntervalId = null;

  const timer = createCountdownTimer({
    durationSeconds: 1500,
    now: () => currentTimeMs,
    onTick: () => {},
    scheduleRepeating: (callback) => {
      scheduledCallback = callback;
      return 'interval-id';
    },
    cancelRepeating: (intervalId) => {
      cancelledIntervalId = intervalId;
    },
  });

  timer.start();
  currentTimeMs = 2000;
  scheduledCallback();
  timer.pause();
  currentTimeMs = 5000;

  assert.equal(timer.getStatus(), 'paused');
  assert.equal(timer.getRemainingSeconds(), 1498);
  assert.equal(cancelledIntervalId, 'interval-id');
});

test('createCountdownTimer の pause は idle 状態では何もしない', () => {
  let cancelCount = 0;

  const timer = createCountdownTimer({
    durationSeconds: 1500,
    onTick: () => {},
    scheduleRepeating: () => 'interval-id',
    cancelRepeating: () => {
      cancelCount += 1;
    },
  });

  timer.pause();

  assert.equal(timer.getStatus(), 'idle');
  assert.equal(timer.getRemainingSeconds(), 1500);
  assert.equal(cancelCount, 0);
});