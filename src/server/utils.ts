export enum TimePhase {
  NIGHT,
  DAY
}

export const PHASE_SWAP: Record<TimePhase, TimePhase> = {
  [TimePhase.NIGHT]: TimePhase.DAY,
  [TimePhase.DAY]: TimePhase.NIGHT
} as const;