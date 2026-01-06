import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../shared/GameContainer.css';

type GamePhase = 'instructions' | 'countdown' | 'playing' | 'feedback' | 'results';
type TrialType = 'congruent' | 'incongruent' | 'neutral';

interface Trial {
  arrows: string;
  targetDirection: 'left' | 'right';
  type: TrialType;
}

interface TrialResult {
  trial: Trial;
  response: 'left' | 'right';
  correct: boolean;
  responseTime: number;
}

const TOTAL_TRIALS = 24;
const FEEDBACK_DURATION = 400;
const FIXATION_DURATION = 500;

const generateTrials = (): Trial[] => {
  const trials: Trial[] = [];

  // Generate balanced trials
  const types: TrialType[] = ['congruent', 'congruent', 'incongruent', 'incongruent', 'neutral', 'neutral'];
  const directions: ('left' | 'right')[] = ['left', 'right'];

  for (let i = 0; i < TOTAL_TRIALS; i++) {
    const type = types[i % types.length];
    const targetDirection = directions[i % 2];

    let arrows: string;
    const target = targetDirection === 'left' ? '←' : '→';
    const opposite = targetDirection === 'left' ? '→' : '←';

    switch (type) {
      case 'congruent':
        arrows = `${target}${target}${target}${target}${target}`;
        break;
      case 'incongruent':
        arrows = `${opposite}${opposite}${target}${opposite}${opposite}`;
        break;
      case 'neutral':
        arrows = `—${target}—`;
        break;
    }

    trials.push({ arrows, targetDirection, type });
  }

  // Shuffle trials
  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trials[i], trials[j]] = [trials[j], trials[i]];
  }

  return trials;
};

export const FlankerTask = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GamePhase>('instructions');
  const [countdown, setCountdown] = useState(3);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [trialStart, setTrialStart] = useState(0);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showFixation, setShowFixation] = useState(false);

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
    }
  }, [phase, countdown]);

  useEffect(() => {
    if (phase === 'playing' && showFixation) {
      const timer = setTimeout(() => {
        setShowFixation(false);
        setTrialStart(Date.now());
      }, FIXATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [phase, showFixation]);

  const handleResponse = useCallback((response: 'left' | 'right') => {
    if (phase !== 'playing' || showFixation || !trials[currentTrial]) return;

    const responseTime = Date.now() - trialStart;
    const correct = response === trials[currentTrial].targetDirection;

    const result: TrialResult = {
      trial: trials[currentTrial],
      response,
      correct,
      responseTime,
    };

    setResults(prev => [...prev, result]);
    setFeedback(correct ? 'correct' : 'incorrect');
    setPhase('feedback');
  }, [phase, showFixation, trials, currentTrial, trialStart]);

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
      if (phase !== 'playing' || showFixation) return;

      if (e.key === 'ArrowLeft') {
        handleResponse('left');
      } else if (e.key === 'ArrowRight') {
        handleResponse('right');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [phase, showFixation, handleResponse]);

  const calculateStats = () => {
    const correctTrials = results.filter(r => r.correct);
    const accuracy = (correctTrials.length / results.length) * 100;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    const congruentTrials = results.filter(r => r.trial.type === 'congruent');
    const incongruentTrials = results.filter(r => r.trial.type === 'incongruent');

    const congruentRT = congruentTrials.length > 0
      ? congruentTrials.reduce((sum, r) => sum + r.responseTime, 0) / congruentTrials.length
      : 0;
    const incongruentRT = incongruentTrials.length > 0
      ? incongruentTrials.reduce((sum, r) => sum + r.responseTime, 0) / incongruentTrials.length
      : 0;

    const flankerEffect = incongruentRT - congruentRT;

    const congruentAcc = congruentTrials.length > 0
      ? (congruentTrials.filter(r => r.correct).length / congruentTrials.length) * 100
      : 0;
    const incongruentAcc = incongruentTrials.length > 0
      ? (incongruentTrials.filter(r => r.correct).length / incongruentTrials.length) * 100
      : 0;

    return { accuracy, avgResponseTime, flankerEffect, congruentRT, incongruentRT, congruentAcc, incongruentAcc };
  };

  const trial = trials[currentTrial];

  return (
    <div className="game-wrapper">
      <div className="game-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="game-title">Flanker Task</h1>
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
              You will see a row of arrows. Focus on the <strong>CENTER ARROW</strong> and
              indicate its direction while ignoring the surrounding arrows.
            </p>
            <ul>
              <li>Press <strong>← Left Arrow</strong> if the center arrow points left</li>
              <li>Press <strong>→ Right Arrow</strong> if the center arrow points right</li>
              <li>Ignore the flanking arrows - they may try to distract you!</li>
              <li>Respond as quickly and accurately as possible</li>
            </ul>
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

            {showFixation ? (
              <div className="fixation">+</div>
            ) : (
              <>
                <div className="stimulus" style={{ letterSpacing: '0.5rem' }}>
                  {trial?.arrows}
                </div>
                <div className="response-buttons">
                  <button
                    className="response-btn"
                    style={{ backgroundColor: '#3b82f6', color: 'white' }}
                    onClick={() => handleResponse('left')}
                  >
                    ← Left
                  </button>
                  <button
                    className="response-btn"
                    style={{ backgroundColor: '#8b5cf6', color: 'white' }}
                    onClick={() => handleResponse('right')}
                  >
                    Right →
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {phase === 'feedback' && (
          <>
            <div className="stimulus" style={{ letterSpacing: '0.5rem' }}>
              {trial?.arrows}
            </div>
            <div className={`feedback ${feedback}`}>
              {feedback === 'correct' ? '✓ Correct!' : '✗ Incorrect'}
            </div>
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
                      <div className="result-label">Overall Accuracy</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.avgResponseTime.toFixed(0)}ms</div>
                      <div className="result-label">Avg Response Time</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.flankerEffect.toFixed(0)}ms</div>
                      <div className="result-label">Flanker Effect</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.incongruentAcc.toFixed(0)}%</div>
                      <div className="result-label">Incongruent Accuracy</div>
                    </div>
                  </div>
                  <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                    The Flanker Effect measures the cost of conflicting information.
                    Lower values indicate better focused attention.
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
