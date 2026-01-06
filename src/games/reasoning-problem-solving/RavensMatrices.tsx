import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../shared/GameContainer.css';
import './RavensMatrices.css';

type GamePhase = 'instructions' | 'countdown' | 'playing' | 'results';
type Shape = 'circle' | 'square' | 'triangle' | 'diamond';
type Pattern = 'solid' | 'striped' | 'dotted' | 'empty';

interface Cell {
  shape: Shape;
  pattern: Pattern;
  rotation: number;
  size: 'small' | 'medium' | 'large';
}

interface Puzzle {
  grid: (Cell | null)[][];
  options: Cell[];
  correctIndex: number;
  rule: string;
}

const SHAPES: Shape[] = ['circle', 'square', 'triangle', 'diamond'];
const PATTERNS: Pattern[] = ['solid', 'striped', 'dotted', 'empty'];
const SIZES: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
const TOTAL_PUZZLES = 8;

export const RavensMatrices = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GamePhase>('instructions');
  const [countdown, setCountdown] = useState(3);
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [results, setResults] = useState<boolean[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const generatePuzzle = useCallback((_difficulty: number): Puzzle => {
    const ruleType = Math.floor(Math.random() * 3);
    const baseShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const basePattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
    const grid: (Cell | null)[][] = [];

    let correctAnswer: Cell;
    let rule: string;

    if (ruleType === 0) {
      // Size progression across rows
      rule = 'Size increases across each row';
      for (let row = 0; row < 3; row++) {
        const rowShape = SHAPES[(SHAPES.indexOf(baseShape) + row) % SHAPES.length];
        grid.push([
          { shape: rowShape, pattern: basePattern, rotation: 0, size: 'small' },
          { shape: rowShape, pattern: basePattern, rotation: 0, size: 'medium' },
          row === 2 ? null : { shape: rowShape, pattern: basePattern, rotation: 0, size: 'large' },
        ]);
      }
      correctAnswer = {
        shape: SHAPES[(SHAPES.indexOf(baseShape) + 2) % SHAPES.length],
        pattern: basePattern,
        rotation: 0,
        size: 'large',
      };
    } else if (ruleType === 1) {
      // Pattern changes down columns
      rule = 'Pattern changes down each column';
      for (let row = 0; row < 3; row++) {
        const rowCells: (Cell | null)[] = [];
        for (let col = 0; col < 3; col++) {
          if (row === 2 && col === 2) {
            rowCells.push(null);
          } else {
            rowCells.push({
              shape: SHAPES[col % SHAPES.length],
              pattern: PATTERNS[row % PATTERNS.length],
              rotation: 0,
              size: 'medium',
            });
          }
        }
        grid.push(rowCells);
      }
      correctAnswer = {
        shape: SHAPES[2 % SHAPES.length],
        pattern: PATTERNS[2 % PATTERNS.length],
        rotation: 0,
        size: 'medium',
      };
    } else {
      // Rotation progression
      rule = 'Shape rotates across each row';
      for (let row = 0; row < 3; row++) {
        const rowPattern = PATTERNS[row % PATTERNS.length];
        grid.push([
          { shape: baseShape, pattern: rowPattern, rotation: 0, size: 'medium' },
          { shape: baseShape, pattern: rowPattern, rotation: 45, size: 'medium' },
          row === 2 ? null : { shape: baseShape, pattern: rowPattern, rotation: 90, size: 'medium' },
        ]);
      }
      correctAnswer = {
        shape: baseShape,
        pattern: PATTERNS[2 % PATTERNS.length],
        rotation: 90,
        size: 'medium',
      };
    }

    // Generate options (1 correct + 5 distractors)
    const options: Cell[] = [correctAnswer];
    while (options.length < 6) {
      const distractor: Cell = {
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        pattern: PATTERNS[Math.floor(Math.random() * PATTERNS.length)],
        rotation: [0, 45, 90][Math.floor(Math.random() * 3)],
        size: SIZES[Math.floor(Math.random() * SIZES.length)],
      };
      // Avoid duplicates
      if (!options.some(o =>
        o.shape === distractor.shape &&
        o.pattern === distractor.pattern &&
        o.rotation === distractor.rotation &&
        o.size === distractor.size
      )) {
        options.push(distractor);
      }
    }

    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    const correctIndex = options.findIndex(o =>
      o.shape === correctAnswer.shape &&
      o.pattern === correctAnswer.pattern &&
      o.rotation === correctAnswer.rotation &&
      o.size === correctAnswer.size
    );

    return { grid, options, correctIndex, rule };
  }, []);

  const startGame = useCallback(() => {
    const newPuzzles: Puzzle[] = [];
    for (let i = 0; i < TOTAL_PUZZLES; i++) {
      newPuzzles.push(generatePuzzle(i));
    }
    setPuzzles(newPuzzles);
    setPhase('countdown');
    setCountdown(3);
  }, [generatePuzzle]);

  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'countdown' && countdown === 0) {
      setCurrentPuzzle(0);
      setResults([]);
      setSelectedOption(null);
      setPhase('playing');
    }
  }, [phase, countdown]);

  const handleOptionSelect = (index: number) => {
    if (showFeedback) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;

    const isCorrect = selectedOption === puzzles[currentPuzzle].correctIndex;
    setResults(prev => [...prev, isCorrect]);
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
      setSelectedOption(null);
      if (currentPuzzle + 1 >= TOTAL_PUZZLES) {
        setPhase('results');
      } else {
        setCurrentPuzzle(prev => prev + 1);
      }
    }, 1500);
  };

  const renderCell = (cell: Cell | null, isOption = false) => {
    if (!cell) {
      return <div className="matrix-cell empty">?</div>;
    }

    const sizeMap = { small: 20, medium: 30, large: 40 };
    const size = sizeMap[cell.size];

    return (
      <div className={`matrix-cell ${isOption ? 'option' : ''}`}>
        <div
          className={`cell-shape ${cell.shape} ${cell.pattern}`}
          style={{
            width: size,
            height: size,
            transform: `rotate(${cell.rotation}deg)`,
          }}
        />
      </div>
    );
  };

  const puzzle = puzzles[currentPuzzle];

  return (
    <div className="game-wrapper">
      <div className="game-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="game-title">Raven's Matrices</h1>
        {phase === 'playing' && (
          <div className="game-stats">
            <div className="stat">
              <div className="stat-value">{currentPuzzle + 1}/{TOTAL_PUZZLES}</div>
              <div className="stat-label">Puzzle</div>
            </div>
          </div>
        )}
      </div>

      <div className="game-area">
        {phase === 'instructions' && (
          <div className="game-instructions">
            <h2>How to Play</h2>
            <p>
              Find the pattern in each 3x3 matrix and select the missing piece
              that completes the pattern.
            </p>
            <ul>
              <li>Observe the shapes, patterns, and sizes in the grid</li>
              <li>Identify the rule governing rows and/or columns</li>
              <li>Select the option that best completes the pattern</li>
              <li>Patterns may involve shape, size, rotation, or fill</li>
            </ul>
            <button className="start-btn" onClick={startGame}>
              Start Game
            </button>
          </div>
        )}

        {phase === 'countdown' && (
          <div className="countdown">{countdown}</div>
        )}

        {phase === 'playing' && puzzle && (
          <div className="ravens-game">
            <div className="matrix-grid">
              {puzzle.grid.map((row, rowIndex) => (
                <div key={rowIndex} className="matrix-row">
                  {row.map((cell, colIndex) => (
                    <div key={colIndex}>
                      {renderCell(cell)}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="options-section">
              <p>Select the missing piece:</p>
              <div className="options-grid">
                {puzzle.options.map((option, index) => (
                  <div
                    key={index}
                    className={`option-wrapper ${selectedOption === index ? 'selected' : ''} ${
                      showFeedback
                        ? index === puzzle.correctIndex
                          ? 'correct'
                          : selectedOption === index
                          ? 'incorrect'
                          : ''
                        : ''
                    }`}
                    onClick={() => handleOptionSelect(index)}
                  >
                    {renderCell(option, true)}
                    <span className="option-label">{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={selectedOption === null || showFeedback}
            >
              {showFeedback ? (selectedOption === puzzle.correctIndex ? '✓ Correct!' : '✗ Incorrect') : 'Submit'}
            </button>
          </div>
        )}

        {phase === 'results' && (
          <div className="results">
            <h2>Results</h2>
            <div className="results-grid">
              <div className="result-card">
                <div className="result-value">{results.filter(r => r).length}/{TOTAL_PUZZLES}</div>
                <div className="result-label">Correct</div>
              </div>
              <div className="result-card">
                <div className="result-value">{((results.filter(r => r).length / TOTAL_PUZZLES) * 100).toFixed(0)}%</div>
                <div className="result-label">Accuracy</div>
              </div>
            </div>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
              {results.filter(r => r).length >= 7
                ? 'Excellent pattern recognition!'
                : results.filter(r => r).length >= 5
                ? 'Good performance! Keep practicing.'
                : 'Pattern recognition improves with practice.'}
            </p>
            <button className="play-again-btn" onClick={startGame}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
