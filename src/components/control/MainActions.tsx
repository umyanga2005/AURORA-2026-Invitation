import type { SharedEngineState } from '../../types/engine';

interface MainActionsProps {
  state: SharedEngineState;
  onReleaseSpark: () => void;
  onToggleAuto: () => void;
  onFullFlame: () => void;
  onTogglePause: () => void;
  onExtinguish: () => void;
  onReset: () => void;
}

export function MainActions({
  state,
  onReleaseSpark,
  onToggleAuto,
  onFullFlame,
  onTogglePause,
  onExtinguish,
  onReset,
}: MainActionsProps) {
  const slotsOccupied = state.completedSparks + state.inFlightSparks >= state.requiredSparks;
  const releaseDisabled = state.paused || state.status === 'EXTINGUISHING' || slotsOccupied;

  return (
    <section className="panel actions-panel">
      <h2 className="panel-title">Ceremonial Actions</h2>
      <div className="actions-grid">
        <button
          type="button"
          className="btn btn-primary btn-large"
          onClick={onReleaseSpark}
          disabled={releaseDisabled}
        >
          RELEASE SPARK
        </button>

        <button
          type="button"
          className={`btn btn-large ${state.autoActive ? 'btn-active-gold' : 'btn-secondary'}`}
          onClick={onToggleAuto}
          disabled={state.completedSparks >= state.requiredSparks && !state.autoActive}
        >
          {state.autoActive ? 'STOP AUTO IGNITION' : 'AUTO IGNITION'}
        </button>

        <button
          type="button"
          className="btn btn-gold-outline btn-large"
          onClick={onFullFlame}
        >
          FULL FLAME
        </button>

        <button
          type="button"
          className={`btn btn-large ${state.paused ? 'btn-active-gold' : 'btn-secondary'}`}
          onClick={onTogglePause}
        >
          {state.paused ? 'RESUME' : 'PAUSE'}
        </button>

        <button
          type="button"
          className="btn btn-danger-soft btn-large"
          onClick={onExtinguish}
        >
          EXTINGUISH
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-large"
          onClick={onReset}
        >
          RESET
        </button>
      </div>
    </section>
  );
}
