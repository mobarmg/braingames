import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../shared/GameContainer.css';
import './UFOV.css';

type GamePhase = 'instructions' | 'countdown' | 'fixation' | 'stimulus' | 'mask' | 'response' | 'feedback' | 'results';

interface Trial {
  centerShape: 'car' | 'truck';
  peripheralPosition: number; // 0-7 for 8 positions
  displayTime: number;
}

interface TrialResult {
  trial: Trial;
  centerResponse: 'car' | 'truck';
  peripheralResponse: number;
  centerCorrect: boolean;
  peripheralCorrect: boolean;
}

const TOTAL_TRIALS = 16;
const POSITIONS = 8; // 8 positions around the circle
const INITIAL_DISPLAY_TIME = 500; // ms
const MASK_DURATION = 500;
const FIXATION_DURATION = 500;

export const UFOV = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GamePhase>('instructions');
  const [countdown, setCountdown] = useState(3);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [trial, setTrial] = useState<Trial | null>(null);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [centerResponse, setCenterResponse] = useState<'car' | 'truck' | null>(null);
  const [peripheralResponse, setPeripheralResponse] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ center: boolean; peripheral: boolean } | null>(null);
  const [displayTime, setDisplayTime] = useState(INITIAL_DISPLAY_TIME);

  const generateTrial = useCallback((): Trial => {
    return {
      centerShape: Math.random() > 0.5 ? 'car' : 'truck',
      peripheralPosition: Math.floor(Math.random() * POSITIONS),
      displayTime,
    };
  }, [displayTime]);

  const startGame = () => {
    setPhase('countdown');
    setCountdown(3);
    setDisplayTime(INITIAL_DISPLAY_TIME);
  };

  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'countdown' && countdown === 0) {
      setCurrentTrial(0);
      setResults([]);
      setPhase('fixation');
    }
  }, [phase, countdown]);

  useEffect(() => {
    if (phase === 'fixation') {
      const newTrial = generateTrial();
      setTrial(newTrial);
      const timer = setTimeout(() => {
        setPhase('stimulus');
      }, FIXATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [phase, generateTrial]);

  useEffect(() => {
    if (phase === 'stimulus' && trial) {
      const timer = setTimeout(() => {
        setPhase('mask');
      }, trial.displayTime);
      return () => clearTimeout(timer);
    }
  }, [phase, trial]);

  useEffect(() => {
    if (phase === 'mask') {
      const timer = setTimeout(() => {
        setCenterResponse(null);
        setPeripheralResponse(null);
        setPhase('response');
      }, MASK_DURATION);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleCenterResponse = (response: 'car' | 'truck') => {
    setCenterResponse(response);
  };

  const handlePeripheralResponse = (position: number) => {
    setPeripheralResponse(position);
  };

  const handleSubmitResponse = () => {
    if (centerResponse === null || peripheralResponse === null || !trial) return;

    const centerCorrect = centerResponse === trial.centerShape;
    const peripheralCorrect = peripheralResponse === trial.peripheralPosition;

    const result: TrialResult = {
      trial,
      centerResponse,
      peripheralResponse,
      centerCorrect,
      peripheralCorrect,
    };

    setResults(prev => [...prev, result]);
    setFeedback({ center: centerCorrect, peripheral: peripheralCorrect });

    // Adjust difficulty
    if (centerCorrect && peripheralCorrect) {
      setDisplayTime(prev => Math.max(prev - 50, 50));
    } else {
      setDisplayTime(prev => Math.min(prev + 50, 500));
    }

    setPhase('feedback');
  };

  useEffect(() => {
    if (phase === 'feedback') {
      const timer = setTimeout(() => {
        setFeedback(null);
        if (currentTrial + 1 >= TOTAL_TRIALS) {
          setPhase('results');
        } else {
          setCurrentTrial(prev => prev + 1);
          setPhase('fixation');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, currentTrial]);

  const calculateStats = () => {
    const centerCorrect = results.filter(r => r.centerCorrect).length;
    const peripheralCorrect = results.filter(r => r.peripheralCorrect).length;
    const bothCorrect = results.filter(r => r.centerCorrect && r.peripheralCorrect).length;

    const centerAccuracy = (centerCorrect / results.length) * 100;
    const peripheralAccuracy = (peripheralCorrect / results.length) * 100;
    const overallAccuracy = (bothCorrect / results.length) * 100;

    const avgDisplayTime = results.reduce((sum, r) => sum + r.trial.displayTime, 0) / results.length;

    return { centerAccuracy, peripheralAccuracy, overallAccuracy, avgDisplayTime };
  };

  const getPositionStyle = (position: number) => {
    const angle = (position * 45 - 90) * (Math.PI / 180);
    const radius = 120;
    return {
      left: `calc(50% + ${Math.cos(angle) * radius}px)`,
      top: `calc(50% + ${Math.sin(angle) * radius}px)`,
    };
  };

  return (
    <div className="game-wrapper">
      <div className="game-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="game-title">Useful Field of View</h1>
        {phase !== 'instructions' && phase !== 'countdown' && phase !== 'results' && (
          <div className="game-stats">
            <div className="stat">
              <div className="stat-value">{currentTrial + 1}/{TOTAL_TRIALS}</div>
              <div className="stat-label">Trial</div>
            </div>
          </div>
        )}
      </div>

      <div className="game-area">
        {phase === 'instructions' && (
          <div className="game-instructions">
            <h2>How to Play</h2>
            <p>
              This task measures your ability to quickly process visual information
              from both the center and periphery of your vision.
            </p>
            <ul>
              <li>A shape (car or truck) will appear briefly in the center</li>
              <li>A target will also flash in one of 8 positions around the edge</li>
              <li>After a brief mask, identify BOTH:</li>
              <li>1. Was the center shape a CAR or TRUCK?</li>
              <li>2. Which position did the peripheral target appear in?</li>
            </ul>
            <button className="start-btn" onClick={startGame}>
              Start Game
            </button>
          </div>
        )}

        {phase === 'countdown' && (
          <div className="countdown">{countdown}</div>
        )}

        {phase === 'fixation' && (
          <div className="fixation">+</div>
        )}

        {phase === 'stimulus' && trial && (
          <div className="ufov-display">
            <div className="ufov-center">
              {trial.centerShape === 'car' ? '🚗' : '🚚'}
            </div>
            {[...Array(POSITIONS)].map((_, i) => (
              <div
                key={i}
                className={`ufov-peripheral ${i === trial.peripheralPosition ? 'active' : ''}`}
                style={getPositionStyle(i)}
              >
                {i === trial.peripheralPosition && '⭐'}
              </div>
            ))}
          </div>
        )}

        {phase === 'mask' && (
          <div className="ufov-mask">
            <div className="mask-pattern" />
          </div>
        )}

        {phase === 'response' && (
          <div className="ufov-response">
            <div className="response-section">
              <h3>What was in the CENTER?</h3>
              <div className="center-options">
                <button
                  className={`center-btn ${centerResponse === 'car' ? 'selected' : ''}`}
                  onClick={() => handleCenterResponse('car')}
                >
                  🚗 Car
                </button>
                <button
                  className={`center-btn ${centerResponse === 'truck' ? 'selected' : ''}`}
                  onClick={() => handleCenterResponse('truck')}
                >
                  🚚 Truck
                </button>
              </div>
            </div>

            <div className="response-section">
              <h3>Where was the PERIPHERAL target?</h3>
              <div className="ufov-response-circle">
                {[...Array(POSITIONS)].map((_, i) => (
                  <button
                    key={i}
                    className={`peripheral-btn ${peripheralResponse === i ? 'selected' : ''}`}
                    style={getPositionStyle(i)}
                    onClick={() => handlePeripheralResponse(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="submit-btn"
              onClick={handleSubmitResponse}
              disabled={centerResponse === null || peripheralResponse === null}
            >
              Submit
            </button>
          </div>
        )}

        {phase === 'feedback' && feedback && (
          <div className="ufov-feedback">
            <div className={`feedback-item ${feedback.center ? 'correct' : 'incorrect'}`}>
              Center: {feedback.center ? '✓ Correct' : '✗ Incorrect'}
            </div>
            <div className={`feedback-item ${feedback.peripheral ? 'correct' : 'incorrect'}`}>
              Peripheral: {feedback.peripheral ? '✓ Correct' : '✗ Incorrect'}
            </div>
          </div>
        )}

        {phase === 'results' && (
          <div className="results">
            <h2>Results</h2>
            {(() => {
              const stats = calculateStats();
              return (
                <>
                  <div className="results-grid">
                    <div className="result-card">
                      <div className="result-value">{stats.overallAccuracy.toFixed(0)}%</div>
                      <div className="result-label">Overall Accuracy</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.centerAccuracy.toFixed(0)}%</div>
                      <div className="result-label">Center Accuracy</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.peripheralAccuracy.toFixed(0)}%</div>
                      <div className="result-label">Peripheral Accuracy</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.avgDisplayTime.toFixed(0)}ms</div>
                      <div className="result-label">Avg Display Time</div>
                    </div>
                  </div>
                  <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                    Lower display times with high accuracy indicate better visual processing speed.
                  </p>
                  <button className="play-again-btn" onClick={startGame}>
                    Play Again
                  </button>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
