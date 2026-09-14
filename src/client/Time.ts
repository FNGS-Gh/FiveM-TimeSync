import {
  SyncPayload,
  getTimeToHMS,
  calculateCurrentTime,
  isDaytime,
  WHOLE_DAY
} from '../shared/utils';

const MAX_TIME_OFFSET = 10;   // -> Seconds
const CHECK_INTERVAL = 5000;  // -> Milliseconds

let currentPayload: SyncPayload | null = null;
let lastRatio = 1;

const frozenTime = { h: 0, m: 0, s: 0 };

const GetTotalGameTime = (): number => {
  const h = GetClockHours();
  const m = GetClockMinutes();
  const s = GetClockSeconds();
  return h * 3600 + m * 60 + s;
};

const UpdateClockSpeed = (ratio: number) => {
  if (lastRatio === ratio) return;
  lastRatio = Math.abs(ratio) | 0;

  const ms = ((60 / ratio) * 1000) | 0;
  //NetworkOverrideClockMillisecondsPerGameMinute(ms);
};

const ApplyClockTime = (totalSeconds: number, ratio: number) => {
  UpdateClockSpeed(ratio);
  
  const { h, m, s } = getTimeToHMS(totalSeconds);
  NetworkOverrideClockTime(h, m, s);
};

// Client Events:
on('onClientMapStart', () => {
  emitNet('TimeSync:requestSync');
});

// Network Events:
onNet('TimeSync:clientSync', (payload: SyncPayload) => {
  currentPayload = payload;

  const expectedSec = payload.frozen
    ? payload.baseTimeInSec
    : calculateCurrentTime(
      payload.baseTimeInSec,
      payload.startedAtStamp,
      payload.dayRatio,
      payload.nightRatio
    );
  
  const activeRatio = payload.frozen
    ? 30
    : isDaytime(expectedSec)
    ? payload.dayRatio
    : payload.nightRatio;

  if (payload.frozen)
    Object.assign(frozenTime, getTimeToHMS(payload.baseTimeInSec));

  ApplyClockTime(expectedSec, activeRatio);
});

// Game Threads:
setTick(() => {
  if (currentPayload?.frozen) NetworkOverrideClockTime(
    frozenTime.h,
    frozenTime.m,
    frozenTime.s
  );
});

setInterval(() => {
  if (!currentPayload || currentPayload.frozen) return;

  const expectedSec = calculateCurrentTime(
    currentPayload.baseTimeInSec,
    currentPayload.startedAtStamp,
    currentPayload.dayRatio,
    currentPayload.nightRatio
  );

  const activeRatio = isDaytime(expectedSec)
    ? currentPayload.dayRatio
    : currentPayload.nightRatio;

  UpdateClockSpeed(activeRatio);

  const actualSec = GetTotalGameTime();
  
  let diff = Math.abs(expectedSec - actualSec);
  if (diff > WHOLE_DAY / 2) diff = WHOLE_DAY - diff;

  if (diff > MAX_TIME_OFFSET) {
    ApplyClockTime(expectedSec, activeRatio);

    if (diff >= MAX_TIME_OFFSET * 1.5)
      emitNet('TimeSync:requestSync');
  }
}, CHECK_INTERVAL);

// tmp
// setTick(() => {
//   const hour = GetClockHours();
//   const minute = GetClockMinutes();
//   const second = GetClockSeconds();

//   const text = `${hour}:${minute}:${second}`;

//   SetTextFont(4);
//   SetTextScale(0.5, 0.5);
//   SetTextColour(255, 255, 255, 255);
//   SetTextOutline();
//   SetTextEntry("STRING");
//   AddTextComponentString(text);
  
//   DrawText(0.88, 0.88);
// });