import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../shared/GameContainer.css';
import './GoNoGo.css';

type GamePhase = 'instructions' | 'countdown' | 'playing' | 'feedback' | 'results';
type TrialType = 'go' | 'nogo';

interface Trial {
  type: TrialType;
  shape: 'circle' | 'square';
}

interface TrialResult {
  trial: Trial;
  responded: boolean;
  correct: boolean;
  responseTime: number | null;
}

const TOTAL_TRIALS = 30;
const GO_RATIO = 0.7; // 70% go trials
const STIMULUS_DURATION = 1000;
const FEEDBACK_DURATION = 400;
const FIXATION_DURATION = 500;
const ITI_MIN = 300;
const ITI_MAX = 700;

const generateTrials = (): Trial[] => {
  const trials: Trial[] = [];
  const goCount = Math.floor(TOTAL_TRIALS * GO_RATIO);
  const nogoCount = TOTAL_TRIALS - goCount;

  for (let i = 0; i < goCount; i++) {
    trials.push({ type: 'go', shape: 'circle' });
  }
  for (let i = 0; i < nogoCount; i++) {
    trials.push({ type: 'nogo', shape: 'square' });
  }

  // Shuffle
  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trials[i], trials[j]] = [trials[j], trials[i]];
  }

  return trials;
};

export const GoNoGo = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GamePhase>('instructions');
  const [countdown, setCountdown] = useState(3);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [trialStart, setTrialStart] = useState(0);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showFixation, setShowFixation] = useState(false);
  const [showStimulus, setShowStimulus] = useState(false);
  const [responded, setResponded] = useState(false);

  const startGame = () => {
    setTrials(generateTrials());
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
      setShowFixation(true);
      setResponded(false);
    }
  }, [phase, countdown]);

  useEffect(() => {
    if (phase === 'playing' && showFixation) {
      const iti = ITI_MIN + Math.random() * (ITI_MAX - ITI_MIN);
      const timer = setTimeout(() => {
        setShowFixation(false);
        setShowStimulus(true);
        setTrialStart(Date.now());
        setResponded(false);
      }, FIXATION_DURATION + iti);
      return () => clearTimeout(timer);
    }
  }, [phase, showFixation]);

  useEffect(() => {
    if (phase === 'playing' && showStimulus && !responded) {
      const timer = setTimeout(() => {
        // Time's up - check if it was a no-go trial (correct) or go trial (missed)
        const trial = trials[currentTrial];
        const correct = trial.type === 'nogo';

        const result: TrialResult = {
          trial,
          responded: false,
          correct,
          responseTime: null,
        };

        setResults(prev => [...prev, result]);
        setFeedback(correct ? 'correct' : 'incorrect');
        setShowStimulus(false);
        setPhase('feedback');
      }, STIMULUS_DURATION);
      return () => clearTimeout(timer);
    }
  }, [phase, showStimulus, responded, trials, currentTrial]);

  const handleResponse = useCallback(() => {
    if (phase !== 'playing' || !showStimulus || responded) return;

    setResponded(true);
    const responseTime = Date.now() - trialStart;
    const trial = trials[currentTrial];
    const correct = trial.type === 'go';

    const result: TrialResult = {
      trial,
      responded: true,
      correct,
      responseTime,
    };

    setResults(prev => [...prev, result]);
    setFeedback(correct ? 'correct' : 'incorrect');
    setShowStimulus(false);
    setPhase('feedback');
  }, [phase, showStimulus, responded, trials, currentTrial, trialStart]);

  useEffect(() => {
    if (phase === 'feedback') {
      const timer = setTimeout(() => {
        setFeedback(null);
        if (currentTrial + 1 >= TOTAL_TRIALS) {
          setPhase('results');
        } else {
          setCurrentTrial(prev => prev + 1);
          setShowFixation(true);
          setPhase('playing');
        }
      }, FEEDBACK_DURATION);
      return () => clearTimeout(timer);
    }
  }, [phase, currentTrial]);

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
    const goTrials = results.filter(r => r.trial.type === 'go');
    const nogoTrials = results.filter(r => r.trial.type === 'nogo');

    const goCorrect = goTrials.filter(r => r.correct);
    const nogoCorrect = nogoTrials.filter(r => r.correct);

    const hitRate = goTrials.length > 0 ? (goCorrect.length / goTrials.length) * 100 : 0;
    const correctRejectionRate = nogoTrials.length > 0 ? (nogoCorrect.length / nogoTrials.length) * 100 : 0;
    const falseAlarmRate = nogoTrials.length > 0 ? ((nogoTrials.length - nogoCorrect.length) / nogoTrials.length) * 100 : 0;

    const goResponseTimes = goCorrect.filter(r => r.responseTime !== null).map(r => r.responseTime as number);
    const avgGoRT = goResponseTimes.length > 0
      ? goResponseTimes.reduce((sum, rt) => sum + rt, 0) / goResponseTimes.length
      : 0;

    const overallAccuracy = (results.filter(r => r.correct).length / results.length) * 100;

    return { hitRate, correctRejectionRate, falseAlarmRate, avgGoRT, overallAccuracy };
  };

  const trial = trials[currentTrial];

  return (
    <div className="game-wrapper">
      <div className="game-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="game-title">Go/No-Go Task</h1>
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
              You will see shapes appear on the screen. Your task is to respond
              only to certain shapes while withholding responses to others.
            </p>
            <ul>
              <li><strong>GO:</strong> Press SPACE or click when you see a <span className="go-shape">GREEN CIRCLE</span></li>
              <li><strong>NO-GO:</strong> Do NOT respond when you see a <span className="nogo-shape">RED SQUARE</span></li>
              <li>Respond as quickly as possible to Go trials</li>
              <li>Control your impulse to respond on No-Go trials</li>
            </ul>
            <div className="shape-examples">
              <div className="example">
                <div className="example-shape go-circle"></div>
                <span>GO - Press Space</span>
              </div>
              <div className="example">
                <div className="example-shape nogo-square"></div>
                <span>NO-GO - Don't Press</span>
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
                style={{ width: `${((currentTrial) / TOTAL_TRIALS) * 100}%` }}
              />
            </div>

            {showFixation && (
              <div className="fixation">+</div>
            )}

            {showStimulus && trial && (
              <div
                className={`gonogo-stimulus ${trial.shape}`}
                onClick={handleResponse}
              />
            )}

            {!showFixation && !showStimulus && (
              <div style={{ height: '150px' }} />
            )}

            <p style={{ color: '#64748b', marginTop: '2rem' }}>
              Press SPACE to respond or click the shape
            </p>
          </>
        )}

        {phase === 'feedback' && (
          <div className={`feedback ${feedback}`}>
            {feedback === 'correct' ? '✓ Correct!' : '✗ Incorrect'}
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
                      <div className="result-value">{stats.hitRate.toFixed(0)}%</div>
                      <div className="result-label">Go Hit Rate</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.correctRejectionRate.toFixed(0)}%</div>
                      <div className="result-label">Inhibition Success</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.avgGoRT.toFixed(0)}ms</div>
                      <div className="result-label">Avg Go RT</div>
                    </div>
                  </div>
                  <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                    Inhibition Success shows how well you controlled impulses on No-Go trials.
                    False Alarm Rate: {stats.falseAlarmRate.toFixed(0)}%
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
