import {
  MAX_AUTO_INTERVAL_SEC,
  MAX_REQUIRED_SPARKS,
  MAX_SPARK_SPEED,
  MIN_AUTO_INTERVAL_SEC,
  MIN_REQUIRED_SPARKS,
  MIN_SPARK_SPEED,
} from '../../config/defaults';
import type { SharedEngineState } from '../../types/engine';

interface SparkSettingsProps {
  state: SharedEngineState;
  onChangeRequiredSparks: (count: number) => void;
  onChangeAutoInterval: (sec: number) => void;
  onChangeSparkSpeed: (speed: number) => void;
}

export function SparkSettings({
  state,
  onChangeRequiredSparks,
  onChangeAutoInterval,
  onChangeSparkSpeed,
}: SparkSettingsProps) {
  return (
    <section className="panel settings-panel">
      <h2 className="panel-title">Spark Settings</h2>

      <div className="control-row">
        <div className="control-header">
          <label htmlFor="required-sparks-slider">Required Spark Count</label>
          <span className="control-value">{state.requiredSparks}</span>
        </div>
        <div className="slider-with-input">
          <input
            id="required-sparks-slider"
            type="range"
            min={MIN_REQUIRED_SPARKS}
            max={MAX_REQUIRED_SPARKS}
            step={1}
            value={state.requiredSparks}
            onChange={(e) => onChangeRequiredSparks(Number(e.target.value))}
          />
          <input
            type="number"
            className="num-input"
            min={MIN_REQUIRED_SPARKS}
            max={MAX_REQUIRED_SPARKS}
            value={state.requiredSparks}
            onChange={(e) => onChangeRequiredSparks(Number(e.target.value))}
            aria-label="Required spark count number"
          />
        </div>
      </div>

      <div className="control-row">
        <div className="control-header">
          <label htmlFor="auto-interval-slider">Automatic Release Interval</label>
          <span className="control-value">{state.autoIntervalSec.toFixed(1)}s</span>
        </div>
        <input
          id="auto-interval-slider"
          type="range"
          min={MIN_AUTO_INTERVAL_SEC}
          max={MAX_AUTO_INTERVAL_SEC}
          step={0.1}
          value={state.autoIntervalSec}
          onChange={(e) => onChangeAutoInterval(Number(e.target.value))}
        />
      </div>

      <div className="control-row">
        <div className="control-header">
          <label htmlFor="spark-speed-slider">Spark Travel Speed</label>
          <span className="control-value">{state.sparkSpeed.toFixed(1)}x</span>
        </div>
        <input
          id="spark-speed-slider"
          type="range"
          min={MIN_SPARK_SPEED}
          max={MAX_SPARK_SPEED}
          step={0.1}
          value={state.sparkSpeed}
          onChange={(e) => onChangeSparkSpeed(Number(e.target.value))}
        />
      </div>
    </section>
  );
}
