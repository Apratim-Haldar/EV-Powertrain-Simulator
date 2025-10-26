export interface MotorConfig {
  maxPower: number;
  maxTorque: number;
  maxSpeed: number;
  efficiency: number;
  motorType: 'BLDC' | 'PMSM';
}

export interface MotorState {
  torque: number;
  speed: number;
  power: number;
  efficiency: number;
  temperature: number;
}

export class ElectricMotor {
  private config: MotorConfig;
  private state: MotorState;

  constructor(config: MotorConfig) {
    this.config = config;
    this.state = {
      torque: 0,
      speed: 0,
      power: 0,
      efficiency: config.efficiency,
      temperature: 25,
    };
  }

  calculateTorque(requestedPower: number, speed: number): MotorState {
    const speedRpm = (speed * 1000) / 60;
    this.state.speed = speedRpm;

    let availableTorque: number;
    if (speedRpm < 1) {
      availableTorque = this.config.maxTorque;
    } else {
      const powerLimit = Math.min(this.config.maxPower, requestedPower);
      availableTorque = Math.min(
        this.config.maxTorque,
        (powerLimit * 9549.3) / speedRpm
      );
    }

    this.state.torque = availableTorque;

    if (speedRpm > 0) {
      this.state.power = (this.state.torque * speedRpm) / 9549.3;
    } else {
      this.state.power = 0;
    }

    this.state.efficiency = this.calculateEfficiency(speedRpm, this.state.torque);

    this.state.temperature += Math.abs(this.state.power * (1 - this.state.efficiency)) * 0.01;
    this.state.temperature = Math.max(25, this.state.temperature - 0.2);

    return { ...this.state };
  }

  private calculateEfficiency(speed: number, torque: number): number {
    const speedRatio = speed / this.config.maxSpeed;
    const torqueRatio = torque / this.config.maxTorque;

    let efficiency = this.config.efficiency;

    if (speedRatio < 0.1 || speedRatio > 0.9) {
      efficiency *= 0.85;
    }

    if (torqueRatio < 0.2) {
      efficiency *= 0.8;
    } else if (torqueRatio > 0.8) {
      efficiency *= 0.92;
    }

    return Math.max(0.5, Math.min(0.98, efficiency));
  }

  getState(): MotorState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      torque: 0,
      speed: 0,
      power: 0,
      efficiency: this.config.efficiency,
      temperature: 25,
    };
  }
}
