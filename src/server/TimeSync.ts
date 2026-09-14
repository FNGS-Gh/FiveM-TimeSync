import { Config } from './config';
import {
  ClientTime,
  UpdateFreezeParams,
  getHMSToTime,
  normalizeTotal
} from '../shared/utils';

class WorldTime {
  private baseTimeInSec = 0;
  private startedAtMs = 0;
  private ratio = 30;
  private frozen = false;
  private frozenTimeInSec = 0;

  constructor({ h, m, s }: ClientTime, ratio: number) {
    this.setTime({ h, m, s });
    this.ratio = Math.abs(ratio) | 0;
  }

  public setTime({ h, m, s }: ClientTime): void {
    this.baseTimeInSec = getHMSToTime({ h, m, s });
    this.startedAtMs = GetGameTimer();
    if (this.frozen) this.frozenTimeInSec = this.baseTimeInSec;
  }

  public getTime(): number {
    if (this.frozen) return this.frozenTimeInSec;

    const elapsedMs = GetGameTimer() - this.startedAtMs;
    const elapsedGameSec = (elapsedMs / 1000) * this.ratio;
    const totalSeconds = this.baseTimeInSec + elapsedGameSec;

    return normalizeTotal(totalSeconds);
  }

  public getRatio(): number {
    return this.ratio;
  }

  public toggleFrozen(): UpdateFreezeParams {
    this.frozen = !this.frozen;

    if (this.frozen) this.frozenTimeInSec = this.getTime();
    else {
      this.baseTimeInSec = this.frozenTimeInSec;
      this.startedAtMs = GetGameTimer();
    }

    const updateData: UpdateFreezeParams = {
      timeInSec: this.frozenTimeInSec,
      status: this.frozen
    };

    return updateData;
  }
}

const Time = new WorldTime(Config.startTime, Config.ratio);

const UpdateWorldTime = (src: number) => {
  const timeInSec = Time.getTime();
  emitNet('TimeSync:update', src, timeInSec);
};

const SetWorldTime = ({ h, m, s }: ClientTime) => {
  Time.setTime({ h, m, s });
  UpdateWorldTime(-1);
};

const GetWorldTime = () => Time.getTime();

const ToggleFrozen = () => {
  const freezeData = Time.toggleFrozen();
  emitNet('TimeSync:freeze', -1, freezeData);
  return freezeData.status;
};

onNet('TimeSync:init', () => {
  emitNet('TimeSync:ratio', source, Time.getRatio());
  UpdateWorldTime(source);
});

exports('TimeSync:UpdateWorldTime', UpdateWorldTime);
exports('TimeSync:SetWorldTime', SetWorldTime);
exports('TimeSync:GetWorldTime', GetWorldTime);
exports('TimeSync:ToggleFrozen', ToggleFrozen);