import { ClientTime, getTimeToHMS } from '../shared/utils';

on('onClientMapStart', () => {
  emitNet('TimeSync:init');
});

onNet('TimeSync:ratio', (ratio: number) => {
  const ms = ((60 / ratio) * 1000) | 0;
  NetworkOverrideClockMillisecondsPerGameMinute(ms);
});

onNet('TimeSync:update', (totalSeconds: number) => {
  const { h, m, s }: ClientTime = getTimeToHMS(totalSeconds);
  NetworkOverrideClockTime(h, m, s);
});

// tmp
setTick(() => {
  const hour = GetClockHours();
  const minute = GetClockMinutes();
  const second = GetClockSeconds();

  const text = `${hour}:${minute}:${second}`;

  SetTextFont(4);
  SetTextScale(0.5, 0.5);
  SetTextColour(255, 255, 255, 255);
  SetTextOutline();
  SetTextEntry("STRING");
  AddTextComponentString(text);
  
  DrawText(0.88, 0.88)
});