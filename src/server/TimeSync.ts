import { Config } from '../shared/config';
import {
  ClientTime,
  SyncPayload,
  calculateCurrentTime,
  getHMSToTime
} from '../shared/utils';

class WorldTime {
  private baseTimeInSec = 0;
  private startedAtStamp = 0;
  private dayRatio = 30;
  private nightRatio = 30;
  private frozen = false;
  private frozenTimeInSec = 0;

  constructor(
    { h, m, s }: ClientTime,
    dayRatio: number,
    nightRatio: number
  ) {
    this.dayRatio = Math.abs(dayRatio) | 0;
    this.nightRatio = Math.abs(nightRatio) | 0;
    this.setTime({ h, m, s });
  }

  public setTime({ h, m, s }: ClientTime): void {
    this.baseTimeInSec = getHMSToTime({ h, m, s });
    this.startedAtStamp = Date.now();
    if (this.frozen) this.frozenTimeInSec = this.baseTimeInSec;
  }

  public getTime(): number {
    if (this.frozen) return this.frozenTimeInSec;
    return calculateCurrentTime(
      this.baseTimeInSec,
      this.startedAtStamp,
      this.dayRatio,
      this.nightRatio
    );
  }

  public getSyncPayload(): SyncPayload {
    return {
      baseTimeInSec: this.frozen ? this.frozenTimeInSec : this.baseTimeInSec,
      startedAtStamp: this.startedAtStamp,
      dayRatio: this.dayRatio,
      nightRatio: this.nightRatio,
      frozen: this.frozen,
    };
  }

  public toggleFrozen(): boolean {
    if (this.frozen) {
      this.baseTimeInSec = this.frozenTimeInSec;
      this.startedAtStamp = Date.now();
      this.frozen = false;
    } else {
      this.frozenTimeInSec = this.getTime();
      this.frozen = true;
    }
    return this.frozen;
  }
}

const Time = new WorldTime(
  Config.startTime,
  Config.dayRatio,
  Config.nightRatio
);

const BroadcastSync = (target: number) => {
  emitNet('TimeSync:clientSync', target, Time.getSyncPayload());
};

// Network Events:
onNet('TimeSync:requestSync', () => {
  const src = source;
  BroadcastSync(src);
});

// Exports:
globalThis.exports('SetWorldTime', ({ h, m, s }: ClientTime) => {
  Time.setTime({ h, m, s });
  BroadcastSync(-1);
});

globalThis.exports('GetWorldTime', () => Time.getTime());

globalThis.exports('ToggleFrozen', (): boolean => {
  const state = Time.toggleFrozen();
  BroadcastSync(-1);
  return state;
});

// Server Events:
on('onServerResourceStart', (resourceName: string) => {
  if (GetCurrentResourceName() !== resourceName) return;
  BroadcastSync(-1);
});