export interface BatteryConfig {
  capacity: number;
  nominalVoltage: number;
  initialSoC: number;
  maxCurrent: number;
  internalResistance: number;
}

export interface BatteryState {
  soc: number;
  voltage: number;
  current: number;
  power: number;
  temperature: number;
}

export class BatterySystem {
  private config: BatteryConfig;
  private state: BatteryState;

  constructor(config: BatteryConfig) {
    this.config = config;
    this.state = {
      soc: config.initialSoC,
      voltage: config.nominalVoltage,
      current: 0,
      power: 0,
      temperature: 25,
    };
  }

  updateState(powerDemand: number, deltaTime: number): BatteryState {
    const voltageAtSoC = this.calculateVoltage();

    const current = powerDemand / voltageAtSoC;
    const clampedCurrent = Math.max(
      -this.config.maxCurrent,
      Math.min(this.config.maxCurrent, current)
    );

    const energyChange = (clampedCurrent * voltageAtSoC * deltaTime) / 3600;
    const socChange = (energyChange / this.config.capacity) * 100;

    this.state.soc = Math.max(0, Math.min(100, this.state.soc - socChange));
    this.state.current = clampedCurrent;
    this.state.voltage = voltageAtSoC;
    this.state.power = clampedCurrent * voltageAtSoC;

    const heatGenerated = Math.pow(clampedCurrent, 2) * this.config.internalResistance;
    this.state.temperature += (heatGenerated * deltaTime) / 1000;
    this.state.temperature = Math.max(25, this.state.temperature - 0.1 * deltaTime);

    return { ...this.state };
  }

  private calculateVoltage(): number {
    const soc = this.state.soc / 100;
    const voltageDropoff = 0.2;
    return this.config.nominalVoltage * (0.8 + 0.2 * soc - voltageDropoff * (1 - soc));
  }

  getState(): BatteryState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      soc: this.config.initialSoC,
      voltage: this.config.nominalVoltage,
      current: 0,
      power: 0,
      temperature: 25,
    };
  }
}
