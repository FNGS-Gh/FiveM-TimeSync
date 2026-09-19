import { Config } from '../shared/config';
import {
  TimeHMS,
  SyncPayload,
  AllPayload,
  normHMS,
  getTimeToHMS,
  calcTime
} from '../shared/utils';

const getTotalGameTime = (): number => 
  GetClockHours() * 3600 + GetClockMinutes() * 60 + GetClockSeconds();

class ClientTime {
  public currRatio = 0;
  public lastTimer = 0;
  public lastTimeS = 0;
  public lastTimeHMS: TimeHMS = { h: 0, m: 0, s: 0 };
  public isActive = false;
  public isFrozen = false;

  public applyRatio(ratio: number) {
    if (ratio !== this.currRatio) {
      this.currRatio = ratio;

      const ms = Math.floor((60 / ratio) * 1000);
      NetworkOverrideClockMillisecondsPerGameMinute(ms);

      console.log(`New Ratio: ${ratio} (${ms}ms)`);
    }
  }

  public applyTime(
    ratio: number,
    lastTime: number,
    lastTimer: number
  ) {
    const newHMS = normHMS(getTimeToHMS(lastTime));
    NetworkOverrideClockTime(newHMS.h, newHMS.m, newHMS.s);

    this.lastTimer = lastTimer;
    this.lastTimeS = lastTime;
    this.lastTimeHMS = newHMS;

    this.applyRatio(ratio);
  }
}

const Time = new ClientTime();

onNet('Time:InitSync', (payload: AllPayload) => {
  Time.applyTime(
    payload.ratio,
    payload.gameTime,
    payload.lastTimer
  );

  if (payload.isFrozen !== Time.isFrozen) {
    if (payload.isFrozen) Time.applyRatio(4);
    Time.isFrozen = payload.isFrozen;
  }

  Time.isActive = true;
});

onNet('Time:Sync', (payload: SyncPayload) => {
  if (!Time.isActive) return;
  Time.applyTime(
    payload.ratio,
    payload.gameTime,
    payload.lastTimer
  );
});

onNet('Time:SetFrozen', (payload: AllPayload) => {
  if (!Time.isActive) return;

  if (payload.isFrozen !== Time.isFrozen) {
    Time.applyTime(
      payload.ratio,
      payload.gameTime,
      payload.lastTimer
    );

    Time.isFrozen = payload.isFrozen;
  }
});

if (Config.perfectFreeze) {
  setTick(() => {
    if (Time.isFrozen) NetworkOverrideClockTime(
      Time.lastTimeHMS.h,
      Time.lastTimeHMS.m,
      Time.lastTimeHMS.s
    );
  });
} else {
  setInterval(() => {
    if (Time.isFrozen) NetworkOverrideClockTime(
      Time.lastTimeHMS.h,
      Time.lastTimeHMS.m,
      30
    );
  }, 250);
}

setInterval(() => {
  if (!Time.isActive || Time.isFrozen) return;

  const actualTime = getTotalGameTime();
  const expectTime = calcTime(
    Time.lastTimer,
    GetNetworkTimeAccurate(),
    Time.lastTimeS,
    Time.currRatio
  );

  const tmpExp = normHMS(getTimeToHMS(expectTime));

  console.log(`Ratio: ${Time.currRatio} | Actual Time: ${actualTime} (${GetClockHours()}:${GetClockMinutes()}:${GetClockSeconds()}) | Expected Time: ${expectTime} (${tmpExp.h}:${tmpExp.m}:${tmpExp.s})`);

  const offset = Math.abs(expectTime - actualTime);
  if (offset > Config.maxTimeOffset) {
    console.log(`Big Offset: ${offset}`);

    const { h, m, s } = normHMS(getTimeToHMS(expectTime));
    NetworkOverrideClockTime(h, m, s);

    if (offset >= Config.maxTimeOffset * 1.5)
      emitNet('Time:RequestSync');
  }
}, 3000);

on('onClientMapStart', () => emitNet('Time:RequestInit'));