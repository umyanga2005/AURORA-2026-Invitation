export class AnimationClock {
  private elapsed = 0;
  private paused = false;

  public setPaused(paused: boolean): void {
    this.paused = paused;
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public step(rawDeltaSec: number): number {
    if (this.paused) return 0;
    // Clamp delta to avoid huge jumps on tab switch
    const dt = Math.min(Math.max(rawDeltaSec, 0), 0.05);
    this.elapsed += dt;
    return dt;
  }

  public getElapsed(): number {
    return this.elapsed;
  }

  public reset(): void {
    this.elapsed = 0;
    this.paused = false;
  }
}
