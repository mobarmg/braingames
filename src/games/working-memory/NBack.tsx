import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../shared/GameContainer.css';
import './NBack.css';

type GamePhase = 'instructions' | 'countdown' | 'playing' | 'results';

interface TrialResult {
  position: number;
  isTarget: boolean;
  responded: boolean;
  correct: boolean;
}

const LETTERS = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Z'];
const TOTAL_TRIALS = 25;
const TARGET_RATIO = 0.3;
const STIMULUS_DURATION = 500;
const ISI_DURATION = 2000; // Inter-stimulus interval

export const NBack = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GamePhase>('instructions');
  const [nLevel, setNLevel] = useState(2);
  const [countdown, setCountdown] = useState(3);
  const [sequence, setSequence] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentLetter, setCurrentLetter] = useState<string | null>(null);
  const [showLetter, setShowLetter] = useState(false);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [responded, setResponded] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const generateSequence = useCallback((n: number): string[] => {
    const seq: string[] = [];
    const targetCount = Math.floor(TOTAL_TRIALS * TARGET_RATIO);
    let currentTargets = 0;

    for (let i = 0; i < TOTAL_TRIALS; i++) {
      if (i >= n && currentTargets < targetCount && Math.random() < 0.4) {
        // Create a target by repeating letter from n positions back
        seq.push(seq[i - n]);
        currentTargets++;
      } else {
        // Generate a non-matching letter
        let letter: string;
        do {
          letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        } while (i >= n && letter === seq[i - n]);
        seq.push(letter);
      }
    }

    return seq;
  }, []);

  const startGame = () => {
    const seq = generateSequence(nLevel);
    setSequence(seq);
    setPhase('countdown');
    setCountdown(3);
  };

  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'countdown' && countdown === 0) {
      setPhase('playing');
      setCurrentIndex(0);
      setResults([]);
      setShowLetter(true);
      setCurrentLetter(sequence[0]);
      setResponded(false);
    }
  }, [phase, countdown, sequence]);

  useEffect(() => {
    if (phase !== 'playing') return;

    if (showLetter) {
      const timer = setTimeout(() => {
        setShowLetter(false);
        // Record result if didn't respond
        const isTarget = currentIndex >= nLevel && sequence[currentIndex] === sequence[currentIndex - nLevel];
        if (!responded) {
          const correct = !isTarget; // Correct to not respond if not a target
          setResults(prev => [...prev, {
            position: currentIndex,
            isTarget,
            responded: false,
            correct,
          }]);
          if (isTarget) {
            setLastFeedback('incorrect');
          }
        }
      }, STIMULUS_DURATION);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setLastFeedback(null);
        if (currentIndex + 1 >= TOTAL_TRIALS) {
          setPhase('results');
        } else {
          setCurrentIndex(prev => prev + 1);
          setCurrentLetter(sequence[currentIndex + 1]);
          setShowLetter(true);
          setResponded(false);
        }
      }, ISI_DURATION);
      return () => clearTimeout(timer);
    }
  }, [phase, showLetter, currentIndex, sequence, nLevel, responded]);

  const handleResponse = useCallback(() => {
    if (phase !== 'playing' || responded) return;

    setResponded(true);
    const isTarget = currentIndex >= nLevel && sequence[currentIndex] === sequence[currentIndex - nLevel];
    const correct = isTarget;

    setResults(prev => [...prev, {
      position: currentIndex,
      isTarget,
      responded: true,
      correct,
    }]);

    setLastFeedback(correct ? 'correct' : 'incorrect');
  }, [phase, responded, currentIndex, nLevel, sequence]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleResponse();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleResponse]);

  const calculateStats = () => {
    const targetTrials = results.filter(r => r.isTarget);
    const nonTargetTrials = results.filter(r => !r.isTarget);

    const hits = targetTrials.filter(r => r.responded && r.correct).length;
    const misses = targetTrials.filter(r => !r.responded).length;
    const correctRejections = nonTargetTrials.filter(r => !r.responded).length;
    const falseAlarms = nonTargetTrials.filter(r => r.responded).length;

    const hitRate = targetTrials.length > 0 ? (hits / targetTrials.length) * 100 : 0;
    const falseAlarmRate = nonTargetTrials.length > 0 ? (falseAlarms / nonTargetTrials.length) * 100 : 0;
    const accuracy = results.length > 0 ? (results.filter(r => r.correct).length / results.length) * 100 : 0;

    // Calculate d-prime (sensitivity measure)
    const hitRateAdj = Math.min(Math.max(hits / Math.max(targetTrials.length, 1), 0.01), 0.99);
    const faRateAdj = Math.min(Math.max(falseAlarms / Math.max(nonTargetTrials.length, 1), 0.01), 0.99);
    const dPrime = 0.5 * (Math.log((hitRateAdj * (1 - faRateAdj)) / ((1 - hitRateAdj) * faRateAdj)));

    return { hitRate, falseAlarmRate, accuracy, dPrime, hits, misses, falseAlarms, correctRejections };
  };

  return (
    <div className="game-wrapper">
      <div className="game-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="game-title">{nLevel}-Back Task</h1>
        {phase === 'playing' && (
          <div className="game-stats">
            <div className="stat">
              <div className="stat-value">{currentIndex + 1}/{TOTAL_TRIALS}</div>
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
              You will see a sequence of letters appear one at a time.
              Press SPACE when the current letter matches the one shown
              <strong> {nLevel} letters ago</strong>.
            </p>
            <div className="nback-example">
              <p>Example sequence for 2-Back:</p>
              <div className="example-sequence">
                <span>B</span>
                <span>F</span>
                <span className="target">B ← Match!</span>
                <span>G</span>
                <span className="target">F ← Match!</span>
              </div>
            </div>
            <div className="difficulty-selector">
              <label>Difficulty Level:</label>
              <div className="level-buttons">
                {[1, 2, 3].map(level => (
                  <button
                    key={level}
                    className={`level-btn ${nLevel === level ? 'active' : ''}`}
                    onClick={() => setNLevel(level)}
                  >
                    {level}-Back
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

        {phase === 'playing' && (
          <>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${((currentIndex) / TOTAL_TRIALS) * 100}%` }}
              />
            </div>

            <div className="nback-display">
              {showLetter ? (
                <div className="nback-letter">{currentLetter}</div>
              ) : (
                <div className="nback-empty">
                  {lastFeedback && (
                    <div className={`nback-feedback ${lastFeedback}`}>
                      {lastFeedback === 'correct' ? '✓' : '✗'}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              className="nback-response-btn"
              onClick={handleResponse}
              disabled={responded}
            >
              Match! (Space)
            </button>

            <p style={{ color: '#64748b', marginTop: '1rem' }}>
              Press SPACE if this letter appeared {nLevel} letters ago
            </p>
          </>
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
                      <div className="result-value">{stats.hitRate.toFixed(0)}%</div>
                      <div className="result-label">Hit Rate</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.falseAlarmRate.toFixed(0)}%</div>
                      <div className="result-label">False Alarm Rate</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.dPrime.toFixed(2)}</div>
                      <div className="result-label">d' (Sensitivity)</div>
                    </div>
                  </div>
                  <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                    Hits: {stats.hits} | Misses: {stats.misses} | False Alarms: {stats.falseAlarms} | Correct Rejections: {stats.correctRejections}
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
