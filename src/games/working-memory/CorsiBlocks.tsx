import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../shared/GameContainer.css';
import './CorsiBlocks.css';

type GamePhase = 'instructions' | 'countdown' | 'showing' | 'responding' | 'feedback' | 'results';

interface Block {
  id: number;
  x: number;
  y: number;
}

const BLOCKS: Block[] = [
  { id: 0, x: 10, y: 15 },
  { id: 1, x: 70, y: 10 },
  { id: 2, x: 40, y: 35 },
  { id: 3, x: 85, y: 40 },
  { id: 4, x: 15, y: 55 },
  { id: 5, x: 55, y: 60 },
  { id: 6, x: 30, y: 80 },
  { id: 7, x: 75, y: 75 },
  { id: 8, x: 50, y: 20 },
];

const FLASH_DURATION = 800;
const PAUSE_DURATION = 300;
const STARTING_SPAN = 3;
const MAX_SPAN = 9;

export const CorsiBlocks = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GamePhase>('instructions');
  const [countdown, setCountdown] = useState(3);
  const [currentSpan, setCurrentSpan] = useState(STARTING_SPAN);
  const [sequence, setSequence] = useState<number[]>([]);
  const [showingIndex, setShowingIndex] = useState(0);
  const [activeBlock, setActiveBlock] = useState<number | null>(null);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [trials, setTrials] = useState<{ span: number; correct: boolean }[]>([]);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [maxSpanReached, setMaxSpanReached] = useState(STARTING_SPAN);

  const generateSequence = useCallback((length: number): number[] => {
    const seq: number[] = [];
    const available = [...Array(BLOCKS.length).keys()];

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * available.length);
      seq.push(available[randomIndex]);
      // Allow repeats but not consecutive
      if (seq.length > 1 && seq[seq.length - 1] === seq[seq.length - 2]) {
        i--;
        seq.pop();
      }
    }

    return seq;
  }, []);

  const startGame = () => {
    setPhase('countdown');
    setCountdown(3);
    setCurrentSpan(STARTING_SPAN);
    setTrials([]);
    setConsecutiveErrors(0);
    setMaxSpanReached(STARTING_SPAN);
  };

  const startTrial = useCallback(() => {
    const seq = generateSequence(currentSpan);
    setSequence(seq);
    setShowingIndex(0);
    setUserSequence([]);
    setPhase('showing');
  }, [currentSpan, generateSequence]);

  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'countdown' && countdown === 0) {
      startTrial();
    }
  }, [phase, countdown, startTrial]);

  useEffect(() => {
    if (phase === 'showing') {
      if (showingIndex < sequence.length) {
        // Show block
        setActiveBlock(sequence[showingIndex]);
        const timer = setTimeout(() => {
          setActiveBlock(null);
          const pauseTimer = setTimeout(() => {
            setShowingIndex(prev => prev + 1);
          }, PAUSE_DURATION);
          return () => clearTimeout(pauseTimer);
        }, FLASH_DURATION);
        return () => clearTimeout(timer);
      } else {
        // Done showing, now respond
        setPhase('responding');
      }
    }
  }, [phase, showingIndex, sequence]);

  const handleBlockClick = (blockId: number) => {
    if (phase !== 'responding') return;

    const newUserSequence = [...userSequence, blockId];
    setUserSequence(newUserSequence);
    setActiveBlock(blockId);
    setTimeout(() => setActiveBlock(null), 200);

    // Check if sequence is complete
    if (newUserSequence.length === sequence.length) {
      const correct = newUserSequence.every((id, index) => id === sequence[index]);
      setFeedback(correct ? 'correct' : 'incorrect');
      setTrials(prev => [...prev, { span: currentSpan, correct }]);

      if (correct) {
        setConsecutiveErrors(0);
        setMaxSpanReached(Math.max(maxSpanReached, currentSpan));
      } else {
        setConsecutiveErrors(prev => prev + 1);
      }

      setPhase('feedback');
    }
  };

  useEffect(() => {
    if (phase === 'feedback') {
      const timer = setTimeout(() => {
        setFeedback(null);

        // Determine next action
        const lastTrialCorrect = trials[trials.length - 1]?.correct;

        if (consecutiveErrors >= 2) {
          // End game after 2 consecutive errors
          setPhase('results');
        } else if (lastTrialCorrect && currentSpan < MAX_SPAN) {
          // Increase span
          setCurrentSpan(prev => prev + 1);
          startTrial();
        } else if (!lastTrialCorrect) {
          // Retry same span
          startTrial();
        } else {
          // Max span reached
          setPhase('results');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, trials, consecutiveErrors, currentSpan, startTrial]);

  const calculateStats = () => {
    const correctTrials = trials.filter(t => t.correct);
    const accuracy = trials.length > 0 ? (correctTrials.length / trials.length) * 100 : 0;
    const highestSpan = Math.max(...trials.filter(t => t.correct).map(t => t.span), 0);

    return { accuracy, highestSpan, totalTrials: trials.length };
  };

  return (
    <div className="game-wrapper">
      <div className="game-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="game-title">Corsi Block-Tapping</h1>
        {(phase === 'showing' || phase === 'responding') && (
          <div className="game-stats">
            <div className="stat">
              <div className="stat-value">{currentSpan}</div>
              <div className="stat-label">Span</div>
            </div>
          </div>
        )}
      </div>

      <div className="game-area">
        {phase === 'instructions' && (
          <div className="game-instructions">
            <h2>How to Play</h2>
            <p>
              This task tests your visuospatial working memory.
              Watch as blocks light up in sequence, then click them in the same order.
            </p>
            <ul>
              <li>Watch the sequence of blocks that light up</li>
              <li>After the sequence ends, click the blocks in the same order</li>
              <li>The sequence gets longer as you progress</li>
              <li>Two errors in a row ends the game</li>
            </ul>
            <button className="start-btn" onClick={startGame}>
              Start Game
            </button>
          </div>
        )}

        {phase === 'countdown' && (
          <div className="countdown">{countdown}</div>
        )}

        {(phase === 'showing' || phase === 'responding' || phase === 'feedback') && (
          <>
            <div className="corsi-status">
              {phase === 'showing' && <span>Watch the sequence...</span>}
              {phase === 'responding' && (
                <span>Click the blocks: {userSequence.length}/{sequence.length}</span>
              )}
              {phase === 'feedback' && (
                <span className={feedback || ''}>{feedback === 'correct' ? '✓ Correct!' : '✗ Try Again'}</span>
              )}
            </div>

            <div className="corsi-board">
              {BLOCKS.map(block => (
                <div
                  key={block.id}
                  className={`corsi-block ${activeBlock === block.id ? 'active' : ''}`}
                  style={{ left: `${block.x}%`, top: `${block.y}%` }}
                  onClick={() => handleBlockClick(block.id)}
                />
              ))}
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
                      <div className="result-value">{stats.highestSpan}</div>
                      <div className="result-label">Highest Span</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.accuracy.toFixed(0)}%</div>
                      <div className="result-label">Accuracy</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.totalTrials}</div>
                      <div className="result-label">Total Trials</div>
                    </div>
                  </div>
                  <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                    Average working memory span is 5-7 blocks.
                    {stats.highestSpan >= 7 && ' Excellent performance!'}
                    {stats.highestSpan >= 5 && stats.highestSpan < 7 && ' Good performance!'}
                    {stats.highestSpan < 5 && ' Keep practicing to improve!'}
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
