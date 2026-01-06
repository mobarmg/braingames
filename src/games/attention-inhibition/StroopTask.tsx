import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../shared/GameContainer.css';
import './StroopTask.css';

type GamePhase = 'instructions' | 'countdown' | 'playing' | 'feedback' | 'results';
type SpeedLevel = 'slow' | 'normal' | 'fast';

interface Trial {
  word: string;
  backgroundColor: string;
  backgroundColorName: string;
  isMatch: boolean;
}

interface TrialResult {
  trial: Trial;
  response: boolean;
  correct: boolean;
  responseTime: number;
}

const COLORS = [
  { name: 'RED', hex: '#ef4444' },
  { name: 'BLUE', hex: '#3b82f6' },
  { name: 'GREEN', hex: '#22c55e' },
  { name: 'YELLOW', hex: '#eab308' },
  { name: 'PURPLE', hex: '#a855f7' },
];

const SPEED_SETTINGS: Record<SpeedLevel, { trialDuration: number; label: string }> = {
  slow: { trialDuration: 3000, label: 'Slow (3s)' },
  normal: { trialDuration: 2000, label: 'Normal (2s)' },
  fast: { trialDuration: 1200, label: 'Fast (1.2s)' },
};

const TOTAL_TRIALS = 20;
const FEEDBACK_DURATION = 400;

export const StroopTask = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GamePhase>('instructions');
  const [speedLevel, setSpeedLevel] = useState<SpeedLevel>('normal');
  const [countdown, setCountdown] = useState(3);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [trial, setTrial] = useState<Trial | null>(null);
  const [trialStart, setTrialStart] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'timeout' | null>(null);

  const generateTrial = useCallback((): Trial => {
    const isMatch = Math.random() > 0.5;
    const wordIndex = Math.floor(Math.random() * COLORS.length);
    const word = COLORS[wordIndex].name;

    let backgroundIndex: number;
    if (isMatch) {
      backgroundIndex = wordIndex;
    } else {
      do {
        backgroundIndex = Math.floor(Math.random() * COLORS.length);
      } while (backgroundIndex === wordIndex);
    }

    return {
      word,
      backgroundColor: COLORS[backgroundIndex].hex,
      backgroundColorName: COLORS[backgroundIndex].name,
      isMatch,
    };
  }, []);

  const startGame = () => {
    setPhase('countdown');
    setCountdown(3);
  };

  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'countdown' && countdown === 0) {
      setPhase('playing');
      setCurrentTrial(0);
      setResults([]);
      const newTrial = generateTrial();
      setTrial(newTrial);
      setTrialStart(Date.now());
      setTimeLeft(SPEED_SETTINGS[speedLevel].trialDuration);
    }
  }, [phase, countdown, generateTrial, speedLevel]);

  // Timer countdown
  useEffect(() => {
    if (phase === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => Math.max(0, prev - 100));
      }, 100);
      return () => clearTimeout(timer);
    } else if (phase === 'playing' && timeLeft === 0 && trial) {
      // Time's up - record as timeout
      const result: TrialResult = {
        trial,
        response: false,
        correct: false,
        responseTime: SPEED_SETTINGS[speedLevel].trialDuration,
      };
      setResults(prev => [...prev, result]);
      setFeedback('timeout');
      setPhase('feedback');
    }
  }, [phase, timeLeft, trial, speedLevel]);

  const handleResponse = (userSaysMatch: boolean) => {
    if (phase !== 'playing' || !trial) return;

    const responseTime = Date.now() - trialStart;
    const correct = userSaysMatch === trial.isMatch;

    const result: TrialResult = {
      trial,
      response: userSaysMatch,
      correct,
      responseTime,
    };

    setResults(prev => [...prev, result]);
    setFeedback(correct ? 'correct' : 'incorrect');
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
          const newTrial = generateTrial();
          setTrial(newTrial);
          setTrialStart(Date.now());
          setTimeLeft(SPEED_SETTINGS[speedLevel].trialDuration);
          setPhase('playing');
        }
      }, FEEDBACK_DURATION);
      return () => clearTimeout(timer);
    }
  }, [phase, currentTrial, generateTrial, speedLevel]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (phase !== 'playing' || !trial) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleResponse(true); // Match
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleResponse(false); // No Match
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [phase, trial]);

  const calculateStats = () => {
    const answeredTrials = results.filter(r => r.responseTime < SPEED_SETTINGS[speedLevel].trialDuration);
    const correctTrials = results.filter(r => r.correct);
    const accuracy = (correctTrials.length / results.length) * 100;

    const avgResponseTime = answeredTrials.length > 0
      ? answeredTrials.reduce((sum, r) => sum + r.responseTime, 0) / answeredTrials.length
      : 0;

    const matchTrials = results.filter(r => r.trial.isMatch);
    const noMatchTrials = results.filter(r => !r.trial.isMatch);

    const matchAccuracy = matchTrials.length > 0
      ? (matchTrials.filter(r => r.correct).length / matchTrials.length) * 100
      : 0;
    const noMatchAccuracy = noMatchTrials.length > 0
      ? (noMatchTrials.filter(r => r.correct).length / noMatchTrials.length) * 100
      : 0;

    const timeouts = results.filter(r => r.responseTime >= SPEED_SETTINGS[speedLevel].trialDuration).length;

    return { accuracy, avgResponseTime, matchAccuracy, noMatchAccuracy, timeouts };
  };

  const timerPercentage = (timeLeft / SPEED_SETTINGS[speedLevel].trialDuration) * 100;

  return (
    <div className="game-wrapper">
      <div className="game-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="game-title">Stroop Task</h1>
        {phase === 'playing' && (
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
              You will see color words displayed on colored backgrounds.
              Decide if the <strong>WORD</strong> matches the <strong>BACKGROUND COLOR</strong>.
            </p>
            <div className="stroop-examples">
              <div className="stroop-example match">
                <div className="example-box" style={{ backgroundColor: '#ef4444' }}>RED</div>
                <span className="example-label">✓ MATCH - Word matches background</span>
              </div>
              <div className="stroop-example no-match">
                <div className="example-box" style={{ backgroundColor: '#3b82f6' }}>RED</div>
                <span className="example-label">✗ NO MATCH - Word doesn't match</span>
              </div>
            </div>
            <ul>
              <li>Press <strong>← Left Arrow (or A)</strong> if word MATCHES background</li>
              <li>Press <strong>→ Right Arrow (or D)</strong> if word DOESN'T MATCH</li>
              <li>Respond before time runs out!</li>
            </ul>
            <div className="speed-selector">
              <label>Select Speed:</label>
              <div className="speed-buttons">
                {(Object.keys(SPEED_SETTINGS) as SpeedLevel[]).map(speed => (
                  <button
                    key={speed}
                    className={`speed-btn ${speedLevel === speed ? 'active' : ''}`}
                    onClick={() => setSpeedLevel(speed)}
                  >
                    {SPEED_SETTINGS[speed].label}
                  </button>
                ))}
              </div>
            </div>
            <button className="start-btn" onClick={startGame}>
              Start Game
            </button>
          </div>
        )}

        {phase === 'countdown' && (
          <div className="countdown">{countdown}</div>
        )}

        {phase === 'playing' && trial && (
          <>
            <div className="stroop-timer-bar">
              <div
                className="stroop-timer-fill"
                style={{
                  width: `${timerPercentage}%`,
                  backgroundColor: timerPercentage > 30 ? '#22c55e' : timerPercentage > 15 ? '#eab308' : '#ef4444'
                }}
              />
            </div>

            <div className="progress-bar" style={{ marginTop: '1rem' }}>
              <div
                className="progress-fill"
                style={{ width: `${((currentTrial) / TOTAL_TRIALS) * 100}%` }}
              />
            </div>

            <div
              className="stroop-stimulus"
              style={{ backgroundColor: trial.backgroundColor }}
            >
              {trial.word}
            </div>

            <p className="stroop-question">Does the word match the background color?</p>

            <div className="response-buttons">
              <button
                className="response-btn match-btn"
                onClick={() => handleResponse(true)}
              >
                ✓ MATCH (←)
              </button>
              <button
                className="response-btn no-match-btn"
                onClick={() => handleResponse(false)}
              >
                ✗ NO MATCH (→)
              </button>
            </div>
          </>
        )}

        {phase === 'feedback' && (
          <div className={`feedback ${feedback}`}>
            {feedback === 'correct' && '✓ Correct!'}
            {feedback === 'incorrect' && '✗ Incorrect'}
            {feedback === 'timeout' && '⏱ Time\'s Up!'}
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
                      <div className="result-value">{stats.accuracy.toFixed(0)}%</div>
                      <div className="result-label">Accuracy</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.avgResponseTime.toFixed(0)}ms</div>
                      <div className="result-label">Avg Response Time</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.matchAccuracy.toFixed(0)}%</div>
                      <div className="result-label">Match Accuracy</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.noMatchAccuracy.toFixed(0)}%</div>
                      <div className="result-label">No-Match Accuracy</div>
                    </div>
                  </div>
                  {stats.timeouts > 0 && (
                    <p style={{ color: '#f87171', marginBottom: '1rem' }}>
                      Timeouts: {stats.timeouts}
                    </p>
                  )}
                  <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                    Speed: {SPEED_SETTINGS[speedLevel].label}
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
