import { Hmac } from 'node:crypto';
import { Config } from '../shared/config';
import {
  calcTime,
  getTimeToHMS,
  InitPayload,
  normHMS,
  SyncPayload,
  TimeHMS
} from '../shared/utils';

const freezeOverride = ({ h, m, s }: TimeHMS) => {
  NetworkOverrideClockTime(h, m, s);
};

const getTotalGameTime = (): number => {
  const h = GetClockHours();
  const m = GetClockMinutes();
  const s = GetClockSeconds();
  return h * 3600 + m * 60 + s;
};

class ClientTime {
  public currRatio = 4;
  public startTimer = 0;
  public lastTimeS = 0;
  public isActive = false;
  public frozenTime: TimeHMS | null = null;

  public applyRatio(
    ratio: number,
    gameTime?: number,
    timer?: number
  ) {
    this.currRatio = ratio;

    if (gameTime !== undefined && timer !== undefined) {
      this.lastTimeS = gameTime;
      this.startTimer = timer;

      const { h, m, s } = normHMS(getTimeToHMS(gameTime));
      NetworkOverrideClockTime(h, m, s);
    }

    const ms = Math.round((60 / this.currRatio) * 1000);
    NetworkOverrideClockMillisecondsPerGameMinute(ms);
  }

  public applyFreeze(
    state: boolean,
    frozenTime: number,
    timer = this.startTimer
  ) {
    this.startTimer = timer;
    this.lastTimeS = frozenTime;

    if (state) {
      const { h, m, s } = normHMS(getTimeToHMS(frozenTime));
      NetworkOverrideClockTime(h, m, s);
      NetworkOverrideClockMillisecondsPerGameMinute(15000);
      this.frozenTime = { h, m, s };
    } else {
      this.frozenTime = null;
      this.applyRatio(this.currRatio, frozenTime, timer);
    }
  }
}

const Time = new ClientTime();

onNet('Time:InitSync', (payload: InitPayload) => {
  Time.applyFreeze(
    payload.isFrozen,
    payload.gameTime,
    payload.lastTimer
  );

  if (!payload.isFrozen) Time.applyRatio(
    payload.ratio,
    payload.gameTime,
    payload.lastTimer
  );

  // if (!payload.isFrozen) Time.applyRatio(
  //   payload.ratio,
  //   payload.gameTime,
  //   GetNetworkTimeAccurate()
  // );

  Time.isActive = true;
});

onNet('Time:Sync', (payload: SyncPayload) => {
  if (!Time.isActive) return;
  Time.applyRatio(
    payload.ratio,
    payload.gameTime,
    payload.lastTimer
  );
  // Time.applyRatio(
  //   payload.ratio,
  //   payload.gameTime,
  //   GetNetworkTimeAccurate()
  // );
});

onNet(
  'Time:UpdRatio',
  (ratio: number, gameTime: number, timer: number) => {
    if (!Time.isActive) return;
    Time.applyRatio(ratio, gameTime, timer);
    //Time.applyRatio(ratio, gameTime, GetNetworkTimeAccurate());
  }
);

onNet(
  'Time:SetFrozen',
  (state: boolean, frozenTime: number, timer: number) => {
    if (!Time.isActive) return;
    Time.applyFreeze(state, frozenTime, timer);
  }
);

if (Config.perfectFreeze) {
  setTick(() => {
    if (Time.frozenTime)
      freezeOverride(Time.frozenTime);
  });
} else {
  setInterval(() => {
    if (Time.frozenTime)
      freezeOverride(Time.frozenTime);
  }, 250);
}

setInterval(() => {
  if (!Time.isActive || Time.frozenTime) return;

  const actualTime = getTotalGameTime();
  const expectTime = calcTime(
    Time.startTimer,
    GetNetworkTimeAccurate(),
    Time.lastTimeS,
    Time.currRatio
  );

  const offset = Math.abs(expectTime - actualTime);
  if (offset > Config.maxTimeOffset) {
    console.log(`Big Offset: ${offset}`);
    if (offset < Config.maxTimeOffset * 1.5) {
      const { h, m, s } = normHMS(getTimeToHMS(expectTime));
      NetworkOverrideClockTime(h, m, s);
    } else emitNet('Time:RequestSync');
  }
}, 1000);

on('onClientMapStart', () => {
  emitNet('Time:RequestInit');
});