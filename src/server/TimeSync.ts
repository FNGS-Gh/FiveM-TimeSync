import { Config } from './config';
import {
  ClientTime,
  SyncPayload,
  calculateCurrentTime,
  getHMSToTime
} from '../shared/utils';

class WorldTime {
  private baseTimeInSec = 0;    // Total seconds passed after midnight;
  private startedAtStamp = 0;   // Last timestamp when the time was calculated;
  private dayRatio = 30;        // Day 1 IRL second ratio to 1 in-game second (by default, 1 IRL second = 30 in-game seconds);
  private nightRatio = 30;      // Night 1 IRL second ratio to 1 in-game second;
  private frozen = false;       // Whether the time is frozen;
  private frozenTimeInSec = 0;  // The frozen time value.

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

// Server Events:
on('onServerResourceStart', (resourceName: string) => {
  if (GetCurrentResourceName() !== resourceName) return;
  BroadcastSync(-1);
});

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

RegisterCommand('freeze', (source: number, args: string[]) => {
  Time.toggleFrozen();
  BroadcastSync(-1);
}, false);