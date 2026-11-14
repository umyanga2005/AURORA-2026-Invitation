import { useState } from 'react';
import { FLAME_PRESETS } from '../../config/defaults';
import {
  DEFAULT_FLAME_COLOR_ID,
  FLAME_COLOR_PRESETS,
  generatePaletteFromHex,
  type FlameColorPalette,
} from '../../config/flameColors';
import type { SharedEngineState } from '../../types/engine';
import type { FlamePresetLevel } from '../../types/flame';

interface FlameSettingsProps {
  state: SharedEngineState;
  onSelectPreset: (level: Exclude<FlamePresetLevel, 'OFF'>) => void;
  onChangeHeight: (height: number) => void;
  onChangeIntensity: (intensity: number) => void;
  onStepFlame: (delta: number) => void;
  onSelectColor: (paletteId: string, customPalette?: FlameColorPalette) => void;
}

export function FlameSettings({
  state,
  onSelectPreset,
  onChangeHeight,
  onChangeIntensity,
  onStepFlame,
  onSelectColor,
}: FlameSettingsProps) {
  const heightPct = Math.round(state.flameHeight * 100);
  const intensityPct = Math.round(state.flameIntensity * 100);
  const activeColorId = state.flameColorId || DEFAULT_FLAME_COLOR_ID;
  const [customHex, setCustomHex] = useState(
    state.customFlamePalette?.accentHex || '#ff7700'
  );

  const handleCustomColorChange = (hex: string) => {
    setCustomHex(hex);
    const customPal = generatePaletteFromHex(hex, 'Custom Flame');
    onSelectColor('custom', customPal);
  };

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

      {/* Special Flame Color Customization */}
      <div className="color-section">
        <div className="control-header">
          <label className="section-subtitle">Flame Color Theme</label>
          {activeColorId !== DEFAULT_FLAME_COLOR_ID && (
            <button
              type="button"
              className="btn-link-reset"
              onClick={() => onSelectColor(DEFAULT_FLAME_COLOR_ID)}
              title="Reset to default classic flame"
            >
              Reset to Default
            </button>
          )}
        </div>

        <div className="color-presets-grid">
          {FLAME_COLOR_PRESETS.map((pal) => {
            const isSelected = activeColorId === pal.id;
            return (
              <button
                key={pal.id}
                type="button"
                className={`btn-color-preset ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectColor(pal.id)}
                title={pal.label}
              >
                <span
                  className="color-swatch-circle"
                  style={{
                    backgroundColor: pal.accentHex,
                    boxShadow: isSelected
                      ? `0 0 10px ${pal.accentHex}`
                      : 'none',
                  }}
                />
                <span className="color-preset-name">
                  {pal.id === DEFAULT_FLAME_COLOR_ID ? 'Classic (Default)' : pal.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Color Picker Option */}
        <div className="custom-color-row">
          <label htmlFor="custom-color-input" className="custom-color-label">
            <span
              className="color-swatch-circle"
              style={{
                backgroundColor: customHex,
                boxShadow:
                  activeColorId === 'custom'
                    ? `0 0 10px ${customHex}`
                    : 'none',
              }}
            />
            <span>Custom Color:</span>
          </label>
          <input
            id="custom-color-input"
            type="color"
            className="color-picker-input"
            value={customHex}
            onChange={(e) => handleCustomColorChange(e.target.value)}
          />
          {activeColorId === 'custom' && (
            <span className="active-pill">Active</span>
          )}
        </div>
      </div>
    </section>
  );
}
