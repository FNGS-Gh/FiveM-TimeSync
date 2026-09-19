import { Config } from '../shared/config';
import { TimePhase, PHASE_SWAP } from './utils';
import {
  TimeHMS,
  SyncPayload,
  AllPayload,
  DAY_SECONDS,
  SUNRISE_SECONDS,
  SUNSET_SECONDS,
  getHMSToTime,
  isDaytime,
  calcTime,
  getTimeToHMS
} from '../shared/utils';

class WorldTime {
  private readonly dayRatio: number;
  private readonly nightRatio: number;
  private readonly ratioMap: Record<TimePhase, number>;

  private lastTimeS = 0;
  private lastTimer = 0;
  private currPhase = TimePhase.DAY;
  private phaseTimeout: NodeJS.Timeout | null = null;

  public isFrozen = false;

  constructor(
    dayRatio: number,
    nightRatio: number,
    startTime: TimeHMS
  ) {
    this.dayRatio = dayRatio;
    this.nightRatio = nightRatio;
    this.ratioMap = {
      [TimePhase.DAY]: dayRatio,
      [TimePhase.NIGHT]: nightRatio
    };

    this.setTime(startTime, false);
  }

  private shiftPhase(swapPhases = true, updTime = true) {
    if (this.phaseTimeout) {
      clearTimeout(this.phaseTimeout);
      this.phaseTimeout = null;
    }

    this.getTime();

    if (swapPhases)
      this.currPhase = PHASE_SWAP[this.currPhase];

    if (updTime)
      emitNet('Time:Sync', -1, this.getSyncPayload(false));

    if (this.dayRatio === this.nightRatio) return;

    const toNextPhaseGameS = this.currPhase === TimePhase.DAY
      ? SUNSET_SECONDS - this.lastTimeS
      : this.lastTimeS < SUNRISE_SECONDS
      ? SUNRISE_SECONDS - this.lastTimeS
      : (DAY_SECONDS - this.lastTimeS) + SUNRISE_SECONDS;
    const toNextPhaseRealS = toNextPhaseGameS / this.ratioMap[this.currPhase];
    
    this.phaseTimeout = setTimeout(
      () => this.shiftPhase(),
      Math.round(toNextPhaseRealS * 1000)
    );
  }

  public setTime(timeHMS: TimeHMS, toSync = true) {
    const timeSeconds = getHMSToTime(timeHMS);
    this.lastTimeS = timeSeconds;
    this.lastTimer = GetGameTimer();

    const isDay = isDaytime(this.lastTimeS);
    this.currPhase = isDay ? TimePhase.DAY : TimePhase.NIGHT;

    this.shiftPhase(false, toSync);
  }

  public getTime(): number {
    if (this.isFrozen) return this.lastTimeS;

    const timerNow = GetGameTimer();

    this.lastTimeS = calcTime(
      this.lastTimer,
      timerNow,
      this.lastTimeS,
      this.ratioMap[this.currPhase]
    );
    this.lastTimer = timerNow;

    return this.lastTimeS;
  }

  public setFrozen(state: boolean) {
    if (state === this.isFrozen) return;

    if (this.phaseTimeout) {
      clearTimeout(this.phaseTimeout);
      this.phaseTimeout = null;
    }

    if (state) {
      this.getTime();
      this.isFrozen = true;
    } else {
      this.isFrozen = false;
      this.lastTimer = GetGameTimer();
      this.shiftPhase(false, false);
    }

    emitNet('Time:SetFrozen', -1, this.getAllPayload(false));
  }

  public toggleFrozen(): boolean {
    this.setFrozen(!this.isFrozen);
    return this.isFrozen;
  }

  public getSyncPayload(update = true): SyncPayload {
    if (update) this.getTime();
    return {
      lastTimer: this.lastTimer,
      gameTime: this.lastTimeS,
      ratio: this.ratioMap[this.currPhase]
    };
  }

  public getAllPayload(update = true): AllPayload {
    return {
      isFrozen: this.isFrozen,
      ...this.getSyncPayload(update)
    };
  }
}

const TimeSync = new WorldTime(
  Config.dayRatio,
  Config.nightRatio,
  Config.startTime
);

onNet('Time:RequestInit', () => {
  const src = source;
  emitNet('Time:InitSync', src, TimeSync.getAllPayload());
});

onNet('Time:RequestSync', () => {
  const src = source;
  emitNet('Time:Sync', src, TimeSync.getSyncPayload());
});

globalThis.exports('SetTime', (timeHMS: TimeHMS) => TimeSync.setTime(timeHMS));
globalThis.exports('TimeFreeze', () => TimeSync.toggleFrozen());

// tmp
// setInterval(() => {
//   const time = calcTime(TimeSync.lastTimer, GetGameTimer(), TimeSync.lastTimeS, TimeSync.ratioMap[TimeSync.currPhase]);
//   const { h, m, s } = getTimeToHMS(time);
//   console.log(`Time: ${h}:${m}:${s}`);
// }, 2000);