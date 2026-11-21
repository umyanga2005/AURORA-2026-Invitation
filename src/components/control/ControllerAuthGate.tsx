import { useState, type FormEvent, type ReactNode } from 'react';
import '../../styles/control.css';

const AUTH_STORAGE_KEY = 'aurora_control_unlocked_v1';
const CONTROLLER_PASSWORD = '1010';

interface ControllerAuthGateProps {
  children: (onLock: () => void) => ReactNode;
}

export function ControllerAuthGate({ children }: ControllerAuthGateProps) {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      return window.sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password.trim() === CONTROLLER_PASSWORD) {
      try {
        window.sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
      } catch {
        // ignore storage restrictions
      }
      setUnlocked(true);
      setError(false);
      setPassword('');
    } else {
      setError(true);
      setPassword('');
    }
  };

  const handleLock = () => {
    try {
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
    setUnlocked(false);
    setPassword('');
    setError(false);
  };

  if (unlocked) {
    return <>{children(handleLock)}</>;
  }

  return (
    <div className="auth-gate-root">
      <form className={`auth-gate-card ${error ? 'auth-shake' : ''}`} onSubmit={handleSubmit}>
        <div className="auth-gate-emblem">AURORA MMXXVI</div>
        <h2 className="auth-gate-title">Controller Access</h2>
        <p className="auth-gate-sub">Enter controller password to continue</p>

        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError(false);
          }}
          placeholder="Enter password"
          className="auth-gate-input"
          aria-label="Controller password"
        />

        {error && <div className="auth-gate-error">Incorrect password. Please try again.</div>}

        <button type="submit" className="auth-gate-btn">
          Unlock Controller
        </button>
      </form>
    </div>
  );
}
