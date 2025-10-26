export interface DrivingCyclePoint {
  time: number;
  speed: number;
}

export const DrivingCycles = {
  NEDC: [
    { time: 0, speed: 0 },
    { time: 11, speed: 0 },
    { time: 15, speed: 15 },
    { time: 23, speed: 15 },
    { time: 28, speed: 32 },
    { time: 49, speed: 32 },
    { time: 54, speed: 0 },
    { time: 61, speed: 0 },
    { time: 66, speed: 15 },
    { time: 74, speed: 15 },
    { time: 79, speed: 35 },
    { time: 93, speed: 35 },
    { time: 96, speed: 50 },
    { time: 117, speed: 50 },
    { time: 122, speed: 0 },
    { time: 195, speed: 0 },
  ] as DrivingCyclePoint[],

  WLTP: [
    { time: 0, speed: 0 },
    { time: 10, speed: 0 },
    { time: 20, speed: 11.3 },
    { time: 30, speed: 16.4 },
    { time: 40, speed: 19.6 },
    { time: 50, speed: 22.8 },
    { time: 60, speed: 25.7 },
    { time: 80, speed: 28.3 },
    { time: 100, speed: 31.5 },
    { time: 120, speed: 34.1 },
    { time: 150, speed: 37.8 },
    { time: 180, speed: 42.5 },
    { time: 210, speed: 46.9 },
    { time: 240, speed: 50.2 },
    { time: 270, speed: 51.4 },
    { time: 300, speed: 52.6 },
    { time: 350, speed: 53.8 },
    { time: 400, speed: 55.1 },
    { time: 450, speed: 54.3 },
    { time: 500, speed: 51.9 },
    { time: 550, speed: 48.7 },
    { time: 600, speed: 45.2 },
    { time: 650, speed: 41.8 },
    { time: 700, speed: 37.5 },
    { time: 750, speed: 32.9 },
    { time: 800, speed: 27.6 },
    { time: 850, speed: 21.4 },
    { time: 900, speed: 14.8 },
    { time: 950, speed: 7.3 },
    { time: 1000, speed: 0 },
  ] as DrivingCyclePoint[],

  URBAN: [
    { time: 0, speed: 0 },
    { time: 5, speed: 0 },
    { time: 12, speed: 20 },
    { time: 25, speed: 20 },
    { time: 32, speed: 0 },
    { time: 42, speed: 0 },
    { time: 48, speed: 25 },
    { time: 65, speed: 25 },
    { time: 72, speed: 15 },
    { time: 85, speed: 15 },
    { time: 90, speed: 30 },
    { time: 110, speed: 30 },
    { time: 115, speed: 0 },
    { time: 125, speed: 0 },
    { time: 132, speed: 35 },
    { time: 155, speed: 35 },
    { time: 162, speed: 20 },
    { time: 175, speed: 20 },
    { time: 180, speed: 0 },
    { time: 200, speed: 0 },
  ] as DrivingCyclePoint[],

  HIGHWAY: [
    { time: 0, speed: 0 },
    { time: 10, speed: 0 },
    { time: 30, speed: 40 },
    { time: 50, speed: 60 },
    { time: 80, speed: 80 },
    { time: 200, speed: 80 },
    { time: 230, speed: 100 },
    { time: 400, speed: 100 },
    { time: 420, speed: 90 },
    { time: 500, speed: 90 },
    { time: 530, speed: 60 },
    { time: 550, speed: 40 },
    { time: 570, speed: 0 },
    { time: 600, speed: 0 },
  ] as DrivingCyclePoint[],
};

export function interpolateSpeed(cycle: DrivingCyclePoint[], currentTime: number): number {
  if (currentTime <= cycle[0].time) return cycle[0].speed;
  if (currentTime >= cycle[cycle.length - 1].time) return cycle[cycle.length - 1].speed;

  for (let i = 0; i < cycle.length - 1; i++) {
    if (currentTime >= cycle[i].time && currentTime <= cycle[i + 1].time) {
      const t1 = cycle[i].time;
      const t2 = cycle[i + 1].time;
      const v1 = cycle[i].speed;
      const v2 = cycle[i + 1].speed;

      const ratio = (currentTime - t1) / (t2 - t1);
      return v1 + ratio * (v2 - v1);
    }
  }

  return 0;
}
