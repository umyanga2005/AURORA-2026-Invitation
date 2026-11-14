interface DisplayControlsProps {
  displayConnected: boolean;
  onOpenDisplay: () => void;
  onFullscreenDisplay: () => void;
  fullscreenNote: string | null;
}

export function DisplayControls({
  displayConnected,
  onOpenDisplay,
  onFullscreenDisplay,
  fullscreenNote,
}: DisplayControlsProps) {
  return (
    <section className="panel display-panel">
      <div className="display-panel-header">
        <h2 className="panel-title">Display Window</h2>
        <span className={`connection-pill ${displayConnected ? 'connected' : 'disconnected'}`}>
          <span className="dot" />
          {displayConnected ? 'Display Connected' : 'Waiting for Display'}
        </span>
      </div>

      <div className="display-buttons">
        <button type="button" className="btn btn-gold-outline" onClick={onOpenDisplay}>
          Open Display
        </button>
        <button type="button" className="btn btn-secondary" onClick={onFullscreenDisplay}>
          Fullscreen Display
        </button>
      </div>

      {fullscreenNote && <p className="helper-note">{fullscreenNote}</p>}
    </section>
  );
}
