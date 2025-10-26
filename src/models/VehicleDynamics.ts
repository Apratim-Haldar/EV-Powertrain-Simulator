export interface VehicleConfig {
  mass: number;
  frontalArea: number;
  dragCoefficient: number;
  rollingResistanceCoeff: number;
  wheelRadius: number;
  regenEfficiency: number;
}

export interface VehicleState {
  speed: number;
  acceleration: number;
  position: number;
  rollingResistance: number;
  aeroDrag: number;
  totalResistance: number;
}

export class VehicleDynamics {
  private config: VehicleConfig;
  private state: VehicleState;
  private readonly AIR_DENSITY = 1.225;
  private readonly GRAVITY = 9.81;

  constructor(config: VehicleConfig) {
    this.config = config;
    this.state = {
      speed: 0,
      acceleration: 0,
      position: 0,
      rollingResistance: 0,
      aeroDrag: 0,
      totalResistance: 0,
    };
  }

  updateDynamics(
    motorTorque: number,
    targetSpeed: number,
    deltaTime: number,
    isRegenerating: boolean
  ): VehicleState {
    const speedMs = this.state.speed / 3.6;

    this.state.rollingResistance =
      this.config.rollingResistanceCoeff * this.config.mass * this.GRAVITY;

    this.state.aeroDrag =
      0.5 *
      this.AIR_DENSITY *
      this.config.dragCoefficient *
      this.config.frontalArea *
      Math.pow(speedMs, 2);

    this.state.totalResistance = this.state.rollingResistance + this.state.aeroDrag;

    const wheelForce = motorTorque / this.config.wheelRadius;
    const resistanceForce = this.state.totalResistance;

    let netForce = wheelForce - resistanceForce;

    if (isRegenerating) {
      netForce = -resistanceForce - Math.abs(wheelForce) * this.config.regenEfficiency;
    }

    this.state.acceleration = netForce / this.config.mass;

    const targetSpeedMs = targetSpeed / 3.6;
    const currentSpeedMs = speedMs;

    let newSpeedMs = currentSpeedMs + this.state.acceleration * deltaTime;

    if (Math.abs(targetSpeedMs - currentSpeedMs) < 0.5) {
      newSpeedMs = targetSpeedMs;
      this.state.acceleration = 0;
    }

    newSpeedMs = Math.max(0, newSpeedMs);
    this.state.speed = newSpeedMs * 3.6;

    this.state.position += speedMs * deltaTime;

    return { ...this.state };
  }

  getState(): VehicleState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      speed: 0,
      acceleration: 0,
      position: 0,
      rollingResistance: 0,
      aeroDrag: 0,
      totalResistance: 0,
    };
  }
}
