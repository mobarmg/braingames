import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../shared/GameContainer.css';
import './TaskSwitching.css';

type GamePhase = 'instructions' | 'countdown' | 'playing' | 'feedback' | 'results';
type TaskType = 'number' | 'letter';

interface Trial {
  number: number;
  letter: string;
  task: TaskType;
  isSwitch: boolean;
}

interface TrialResult {
  trial: Trial;
  response: string;
  correct: boolean;
  responseTime: number;
}

const NUMBERS = [1, 2, 3, 4, 6, 7, 8, 9];
const VOWELS = ['A', 'E', 'I', 'U'];
const CONSONANTS = ['G', 'K', 'M', 'R'];
const TOTAL_TRIALS = 32;
const FEEDBACK_DURATION = 400;
const FIXATION_DURATION = 500;

export const TaskSwitching = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GamePhase>('instructions');
  const [countdown, setCountdown] = useState(3);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [trialStart, setTrialStart] = useState(0);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showFixation, setShowFixation] = useState(false);

  const generateTrials = useCallback((): Trial[] => {
    const newTrials: Trial[] = [];
    let lastTask: TaskType = Math.random() > 0.5 ? 'number' : 'letter';

    for (let i = 0; i < TOTAL_TRIALS; i++) {
      // Alternate tasks with some switches
      const shouldSwitch = i > 0 && (i % 4 === 0 || Math.random() < 0.3);
      const task: TaskType = shouldSwitch ? (lastTask === 'number' ? 'letter' : 'number') : lastTask;

      const number = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
      const letters = [...VOWELS, ...CONSONANTS];
      const letter = letters[Math.floor(Math.random() * letters.length)];

      newTrials.push({
        number,
        letter,
        task,
        isSwitch: i > 0 && task !== lastTask,
      });

      lastTask = task;
    }

    return newTrials;
  }, []);

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

  const handleResponse = useCallback((response: string) => {
    if (phase !== 'playing' || showFixation) return;

    const trial = trials[currentTrial];
    const responseTime = Date.now() - trialStart;

    let correct = false;
    if (trial.task === 'number') {
      const isEven = trial.number % 2 === 0;
      correct = (response === 'even' && isEven) || (response === 'odd' && !isEven);
    } else {
      const isVowel = VOWELS.includes(trial.letter);
      correct = (response === 'vowel' && isVowel) || (response === 'consonant' && !isVowel);
    }

    setResults(prev => [...prev, { trial, response, correct, responseTime }]);
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

      const trial = trials[currentTrial];
      if (trial.task === 'number') {
        if (e.key === 'z' || e.key === 'Z') handleResponse('even');
        else if (e.key === 'm' || e.key === 'M') handleResponse('odd');
      } else {
        if (e.key === 'z' || e.key === 'Z') handleResponse('vowel');
        else if (e.key === 'm' || e.key === 'M') handleResponse('consonant');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [phase, showFixation, trials, currentTrial, handleResponse]);

  const calculateStats = () => {
    const correctTrials = results.filter(r => r.correct);
    const accuracy = (correctTrials.length / results.length) * 100;
    const avgRT = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    const switchTrials = results.filter(r => r.trial.isSwitch);
    const repeatTrials = results.filter(r => !r.trial.isSwitch);

    const switchRT = switchTrials.length > 0
      ? switchTrials.reduce((sum, r) => sum + r.responseTime, 0) / switchTrials.length
      : 0;
    const repeatRT = repeatTrials.length > 0
      ? repeatTrials.reduce((sum, r) => sum + r.responseTime, 0) / repeatTrials.length
      : 0;

    const switchCost = switchRT - repeatRT;

    const switchAcc = switchTrials.length > 0
      ? (switchTrials.filter(r => r.correct).length / switchTrials.length) * 100
      : 0;

    return { accuracy, avgRT, switchRT, repeatRT, switchCost, switchAcc };
  };

  const trial = trials[currentTrial];

  return (
    <div className="game-wrapper">
      <div className="game-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="game-title">Task Switching</h1>
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
              You'll see a letter-number pair. The background color tells you which task to perform:
            </p>
            <ul>
              <li><span className="number-task">BLUE background</span>: Is the NUMBER even or odd?</li>
              <li><span className="letter-task">GREEN background</span>: Is the LETTER a vowel or consonant?</li>
              <li>Press <strong>Z</strong> for Even/Vowel</li>
              <li>Press <strong>M</strong> for Odd/Consonant</li>
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
            ) : trial && (
              <>
                <div className={`switch-stimulus ${trial.task}`}>
                  <span className="switch-letter">{trial.letter}</span>
                  <span className="switch-number">{trial.number}</span>
                </div>
                <div className="switch-task-label">
                  {trial.task === 'number' ? 'Even or Odd?' : 'Vowel or Consonant?'}
                </div>
                <div className="response-buttons">
                  <button
                    className="response-btn"
                    style={{ backgroundColor: '#3b82f6', color: 'white' }}
                    onClick={() => handleResponse(trial.task === 'number' ? 'even' : 'vowel')}
                  >
                    {trial.task === 'number' ? 'Even (Z)' : 'Vowel (Z)'}
                  </button>
                  <button
                    className="response-btn"
                    style={{ backgroundColor: '#8b5cf6', color: 'white' }}
                    onClick={() => handleResponse(trial.task === 'number' ? 'odd' : 'consonant')}
                  >
                    {trial.task === 'number' ? 'Odd (M)' : 'Consonant (M)'}
                  </button>
                </div>
              </>
            )}
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
                      <div className="result-value">{stats.accuracy.toFixed(0)}%</div>
                      <div className="result-label">Accuracy</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.avgRT.toFixed(0)}ms</div>
                      <div className="result-label">Avg Response Time</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.switchCost.toFixed(0)}ms</div>
                      <div className="result-label">Switch Cost</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.switchAcc.toFixed(0)}%</div>
                      <div className="result-label">Switch Accuracy</div>
                    </div>
                  </div>
                  <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                    Switch Cost measures the time penalty when changing tasks.
                    Lower is better!
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
