import { FLAME_PRESETS } from '../../config/defaults';
import type { SharedEngineState } from '../../types/engine';
import type { FlamePresetLevel } from '../../types/flame';

interface FlameSettingsProps {
  state: SharedEngineState;
  onSelectPreset: (level: Exclude<FlamePresetLevel, 'OFF'>) => void;
  onChangeHeight: (height: number) => void;
  onChangeIntensity: (intensity: number) => void;
  onStepFlame: (delta: number) => void;
}

export function FlameSettings({
  state,
  onSelectPreset,
  onChangeHeight,
  onChangeIntensity,
  onStepFlame,
}: FlameSettingsProps) {
  const heightPct = Math.round(state.flameHeight * 100);
  const intensityPct = Math.round(state.flameIntensity * 100);

  return (
    <section className="panel settings-panel">
      <h2 className="panel-title">Flame Settings</h2>

      <div className="preset-grid">
        {FLAME_PRESETS.map((preset) => (
          <button
            key={preset.level}
            type="button"
            className={`btn btn-preset ${
              state.flamePreset === preset.level ? 'btn-active-gold' : 'btn-secondary'
            }`}
            onClick={() => onSelectPreset(preset.level)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="step-buttons">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onStepFlame(-0.1)}
        >
          Flame −
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onStepFlame(0.1)}
        >
          Flame +
        </button>
      </div>

      <div className="control-row">
        <div className="control-header">
          <label htmlFor="flame-height-slider">Flame Height</label>
          <span className="control-value">{heightPct}%</span>
        </div>
        <input
          id="flame-height-slider"
          type="range"
          min={0}
          max={100}
          step={1}
          value={heightPct}
          onChange={(e) => onChangeHeight(Number(e.target.value) / 100)}
        />
      </div>

      <div className="control-row">
        <div className="control-header">
          <label htmlFor="flame-intensity-slider">Flame Intensity</label>
          <span className="control-value">{intensityPct}%</span>
        </div>
        <input
          id="flame-intensity-slider"
          type="range"
          min={0}
          max={100}
          step={1}
          value={intensityPct}
          onChange={(e) => onChangeIntensity(Number(e.target.value) / 100)}
        />
      </div>
    </section>
  );
}
