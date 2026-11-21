import { useEffect, useState } from 'react';
import type { InvitationTextConfig } from '../../types/invitation';

interface InvitationSettingsProps {
  text: InvitationTextConfig;
  onSaveText: (next: InvitationTextConfig) => void;
  onResetText: () => void;
}

export function InvitationSettings({
  text,
  onSaveText,
  onResetText,
}: InvitationSettingsProps) {
  const [draft, setDraft] = useState<InvitationTextConfig>(text);
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    setDraft(text);
  }, [text]);

  const updateField = <K extends keyof InvitationTextConfig>(
    key: K,
    value: InvitationTextConfig[K]
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (savedBanner) setSavedBanner(false);
  };

  const handleApply = () => {
    onSaveText(draft);
    setSavedBanner(true);
    window.setTimeout(() => setSavedBanner(false), 2200);
  };

  return (
    <section className="panel">
      <div className="panel-title-row">
        <h2 className="panel-title" style={{ marginBottom: 0 }}>
          Invitation Text Content
        </h2>
        <button type="button" className="mini-reset-btn" onClick={onResetText}>
          Reset Defaults
        </button>
      </div>

      <div className="inv-editor-grid">
        <label className="inv-field">
          <span>Logo Title</span>
          <input
            type="text"
            value={draft.logoMain}
            onChange={(e) => updateField('logoMain', e.target.value)}
            placeholder="AURORA"
          />
        </label>

        <label className="inv-field">
          <span>Logo Subtitle</span>
          <input
            type="text"
            value={draft.logoSub}
            onChange={(e) => updateField('logoSub', e.target.value)}
            placeholder="MMXXVI"
          />
        </label>

        <label className="inv-field inv-field-wide">
          <span>Header Line 1</span>
          <input
            type="text"
            value={draft.headerLine1}
            onChange={(e) => updateField('headerLine1', e.target.value)}
          />
        </label>

        <label className="inv-field inv-field-wide">
          <span>Header Line 2</span>
          <input
            type="text"
            value={draft.headerLine2}
            onChange={(e) => updateField('headerLine2', e.target.value)}
          />
        </label>

        <label className="inv-field inv-field-wide">
          <span>Event Title</span>
          <input
            type="text"
            value={draft.eventTitle}
            onChange={(e) => updateField('eventTitle', e.target.value)}
          />
        </label>

        <label className="inv-field">
          <span>Date Label</span>
          <input
            type="text"
            value={draft.dateLabel}
            onChange={(e) => updateField('dateLabel', e.target.value)}
          />
        </label>

        <label className="inv-field">
          <span>Date Value</span>
          <input
            type="text"
            value={draft.dateValue}
            onChange={(e) => updateField('dateValue', e.target.value)}
          />
        </label>

        <label className="inv-field">
          <span>Time Label</span>
          <input
            type="text"
            value={draft.timeLabel}
            onChange={(e) => updateField('timeLabel', e.target.value)}
          />
        </label>

        <label className="inv-field">
          <span>Time Value</span>
          <input
            type="text"
            value={draft.timeValue}
            onChange={(e) => updateField('timeValue', e.target.value)}
          />
        </label>

        <label className="inv-field">
          <span>Venue Label</span>
          <input
            type="text"
            value={draft.venueLabel}
            onChange={(e) => updateField('venueLabel', e.target.value)}
          />
        </label>

        <label className="inv-field">
          <span>Venue Value</span>
          <input
            type="text"
            value={draft.venueValue}
            onChange={(e) => updateField('venueValue', e.target.value)}
          />
        </label>

        <label className="inv-field inv-field-wide">
          <span>Closing / Footer Line</span>
          <input
            type="text"
            value={draft.footerLine}
            onChange={(e) => updateField('footerLine', e.target.value)}
          />
        </label>

        <div className="inv-field inv-field-wide">
          <div className="slider-header">
            <span>Letter Typing Speed</span>
            <span className="gold-text">{draft.typingSpeedMs} ms / letter</span>
          </div>
          <input
            type="range"
            min={18}
            max={110}
            step={2}
            value={draft.typingSpeedMs}
            onChange={(e) => updateField('typingSpeedMs', parseInt(e.target.value, 10))}
          />
        </div>
      </div>

      <div className="inv-editor-actions">
        <button type="button" className="inv-save-btn" onClick={handleApply}>
          Save &amp; Sync to Display
        </button>
        {savedBanner && <span className="inv-saved-note">Synced to Display!</span>}
      </div>
    </section>
  );
}
