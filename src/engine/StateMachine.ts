import type { IgnitionStatus } from '../types/engine';

export class IgnitionStateMachine {
  private status: IgnitionStatus = 'IDLE';
  private prePauseStatus: IgnitionStatus = 'IDLE';

  public getStatus(): IgnitionStatus {
    return this.status;
  }

  public setStatus(next: IgnitionStatus): void {
    this.status = next;
  }

  public pause(): void {
    if (this.status === 'PAUSED') return;
    this.prePauseStatus = this.status;
    this.status = 'PAUSED';
  }

  public resume(): IgnitionStatus {
    if (this.status !== 'PAUSED') return this.status;
    this.status = this.prePauseStatus;
    return this.status;
  }

  public reset(): void {
    this.status = 'IDLE';
    this.prePauseStatus = 'IDLE';
  }
}
