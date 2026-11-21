import type { SoundConfig } from '../../types/invitation';

interface SoundSettingsProps {
  sound: SoundConfig;
  onChangeSound: (partial: Partial<SoundConfig>) => void;
  onResetSound: () => void;
}

export function SoundSettings({ sound, onChangeSound, onResetSound }: SoundSettingsProps) {
  return (
    <section className="panel">
      <div className="panel-title-row">
        <h2 className="panel-title" style={{ marginBottom: 0 }}>
          Audio &amp; Sound Effects
        </h2>
        <button type="button" className="mini-reset-btn" onClick={onResetSound}>
          Reset Audio
        </button>
      </div>

      <div className="sound-settings-stack">
        <label className="toggle-row">
          <span>Master Sound Effects</span>
          <input
            type="checkbox"
            checked={sound.enabled}
            onChange={(e) => onChangeSound({ enabled: e.target.checked })}
          />
        </label>

        <div className="slider-field">
          <div className="slider-header">
            <span>Master Volume</span>
            <span className="gold-text">{Math.round(sound.masterVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            disabled={!sound.enabled}
            value={sound.masterVolume}
            onChange={(e) => onChangeSound({ masterVolume: parseFloat(e.target.value) })}
          />
        </div>

        <label className="toggle-row">
          <span>Lamp Ignition Whoosh</span>
          <input
            type="checkbox"
            disabled={!sound.enabled}
            checked={sound.ignitionSound}
            onChange={(e) => onChangeSound({ ignitionSound: e.target.checked })}
          />
        </label>

        <label className="toggle-row">
          <span>Ambient Fire Crackle</span>
          <input
            type="checkbox"
            disabled={!sound.enabled}
            checked={sound.crackleSound}
            onChange={(e) => onChangeSound({ crackleSound: e.target.checked })}
          />
        </label>

        <label className="toggle-row">
          <span>Fire Writing &amp; Shimmer Chime</span>
          <input
            type="checkbox"
            disabled={!sound.enabled}
            checked={sound.writingSound}
            onChange={(e) => onChangeSound({ writingSound: e.target.checked })}
          />
        </label>
      </div>
    </section>
  );
}
