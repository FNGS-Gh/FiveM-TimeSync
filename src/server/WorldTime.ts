import { Config } from '../shared/config';
import { PhaseSwap, TimePhase } from './utils';
import {
  calcTime,
  DAY_SECONDS,
  getHMSToTime,
  getTimeToHMS,
  InitPayload,
  isDaytime,
  normHMS,
  SUNRISE_SECONDS,
  SUNSET_SECONDS,
  SyncPayload,
  TimeHMS,

} from '../shared/utils';

class WorldTime {
  private readonly dayRatio: number;
  private readonly nightRatio: number;
  //private readonly ratioMap: Record<TimePhase, number>;
  public readonly ratioMap: Record<TimePhase, number>;

  public timeInSec: number;
  public fromTimer: number;
  public currPhase: TimePhase;

  //private timeInSec: number;
  //private fromTimer: number;
  //private currPhase: TimePhase;

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
      [TimePhase.Day]: dayRatio,
      [TimePhase.Night]: nightRatio
    };

    const timeSeconds = getHMSToTime(normHMS(startTime));
    this.timeInSec = timeSeconds;
    this.fromTimer = GetGameTimer();

    const isDay = isDaytime(this.timeInSec);
    this.currPhase = isDay ? TimePhase.Day : TimePhase.Night;

    this.shiftPhase(false, false);
  }

  private shiftPhase(swapPhases = true, updTime = true) {
    if (this.phaseTimeout) {
      clearTimeout(this.phaseTimeout);
      this.phaseTimeout = null;
    }

    if (this.dayRatio === this.nightRatio) return;

    if (swapPhases)
      this.currPhase = PhaseSwap[this.currPhase];

    if (updTime) {
      this.getTime();
      emitNet(
        'Time:UpdRatio',
        -1,
        this.ratioMap[this.currPhase],
        this.timeInSec,
        this.fromTimer
      );
    }

    const toNextPhaseGameS = this.currPhase === TimePhase.Day
      ? SUNSET_SECONDS - this.timeInSec
      : this.timeInSec < SUNRISE_SECONDS
      ? SUNRISE_SECONDS - this.timeInSec
      : (DAY_SECONDS - this.timeInSec) + SUNRISE_SECONDS;
    const toNextPhaseRealS = toNextPhaseGameS / this.ratioMap[this.currPhase];
    
    this.phaseTimeout = setTimeout(
      () => this.shiftPhase(),
      Math.round(toNextPhaseRealS * 1000)
    );
  }

  public getTime(): number {
    if (this.isFrozen) return this.timeInSec;

    const timerNow = GetGameTimer();

    this.timeInSec = calcTime(
      this.fromTimer,
      timerNow,
      this.timeInSec,
      this.ratioMap[this.currPhase]
    );
    this.fromTimer = timerNow;

    return this.timeInSec;
  }

  public setFrozen(state: boolean) {
    if (state === this.isFrozen) return;

    if (this.phaseTimeout) {
      clearTimeout(this.phaseTimeout);
      this.phaseTimeout = null;
    }

    if (state) this.getTime();
    else {
      this.fromTimer = GetGameTimer();
      this.shiftPhase(false, false);
    }

    this.isFrozen = state;
    emitNet(
      'Time:SetFrozen',
      -1,
      this.isFrozen,
      this.timeInSec,
      this.fromTimer
    );
  }

  public toggleFrozen(): boolean {
    this.setFrozen(!this.isFrozen);
    return this.isFrozen;
  }

  public getSyncPayload(): SyncPayload {
    this.getTime();
    return {
      lastTimer: this.fromTimer,
      gameTime: this.timeInSec,
      ratio: this.ratioMap[this.currPhase]
    };
  }

  public getInitPayload(): InitPayload {
    return {
      isFrozen: this.isFrozen,
      ...this.getSyncPayload()
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
  emitNet('Time:InitSync', src, TimeSync.getInitPayload());
});

onNet('Time:RequestSync', () => {
  const src = source;
  emitNet('Time:Sync', src, TimeSync.getSyncPayload());
});

globalThis.exports('TimeFreeze', () => TimeSync.toggleFrozen());

// tmp
// setInterval(() => {
//   const time = calcTime(TimeSync.fromTimer, GetGameTimer(), TimeSync.timeInSec, TimeSync.ratioMap[TimeSync.currPhase]);
//   const { h, m, s } = getTimeToHMS(time);
//   console.log(`Time: ${h}:${m}:${s}`);
// }, 2000);