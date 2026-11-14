import type { SharedEngineState } from '../../types/engine';

interface ProgressIndicatorProps {
  state: SharedEngineState;
}

export function ProgressIndicator({ state }: ProgressIndicatorProps) {
  const pct = Math.round(state.progress * 100);

  return (
    <section className="panel progress-panel">
      <div className="progress-stats">
        <div className="stat-item">
          <span className="stat-label">Required Sparks</span>
          <span className="stat-value">{state.requiredSparks}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Completed Sparks</span>
          <span className="stat-value gold-text">{state.completedSparks}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">In-flight Sparks</span>
          <span className="stat-value">{state.inFlightSparks}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Progress</span>
          <span className="stat-value gold-text">{pct}%</span>
        </div>
      </div>

      <div className="progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </section>
  );
}
