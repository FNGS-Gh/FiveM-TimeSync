export enum TimePhase {
  Night,
  Day
}

export const PhaseSwap: Record<TimePhase, TimePhase> = {
  [TimePhase.Night]: TimePhase.Day,
  [TimePhase.Day]: TimePhase.Night
};

// tmp
export function LogExecution(
  _target: any,
  propertyKey: any,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = function (args: any[]) {
    console.log(`[TimeSync] Called method: ${propertyKey} | `, args);
    
    const result = originalMethod.apply(this, args);
    if (result !== undefined)
      console.log(`[TimeSync] Method ${propertyKey} returned: `, result);

    return result;
  };

  return descriptor;
}