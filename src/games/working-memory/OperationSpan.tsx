import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../shared/GameContainer.css';
import './OperationSpan.css';

type GamePhase = 'instructions' | 'countdown' | 'equation' | 'letter' | 'recall' | 'feedback' | 'results';

interface EquationTrial {
  equation: string;
  answer: number;
  isCorrect: boolean;
  displayedAnswer: number;
}

interface SetTrial {
  equations: EquationTrial[];
  letters: string[];
  setSize: number;
}

const LETTERS = ['F', 'H', 'J', 'K', 'L', 'N', 'P', 'Q', 'R', 'S', 'T', 'Y'];
const MIN_SET_SIZE = 3;
const MAX_SET_SIZE = 7;
const SETS_PER_SIZE = 2;
const LETTER_DISPLAY_TIME = 1000;

const generateEquation = (): EquationTrial => {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operations = ['+', '-', '*'];
  const op = operations[Math.floor(Math.random() * operations.length)];

  let answer: number;
  switch (op) {
    case '+': answer = num1 + num2; break;
    case '-': answer = num1 - num2; break;
    case '*': answer = num1 * num2; break;
    default: answer = num1 + num2;
  }

  const isCorrect = Math.random() > 0.5;
  const displayedAnswer = isCorrect ? answer : answer + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1);

  return {
    equation: `${num1} ${op} ${num2} = ${displayedAnswer}`,
    answer,
    isCorrect,
    displayedAnswer,
  };
};

const generateSet = (size: number): SetTrial => {
  const equations: EquationTrial[] = [];
  const letters: string[] = [];
  const usedLetters = new Set<string>();

  for (let i = 0; i < size; i++) {
    equations.push(generateEquation());

    let letter: string;
    do {
      letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    } while (usedLetters.has(letter));
    usedLetters.add(letter);
    letters.push(letter);
  }

  return { equations, letters, setSize: size };
};

export const OperationSpan = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GamePhase>('instructions');
  const [countdown, setCountdown] = useState(3);
  const [allSets, setAllSets] = useState<SetTrial[]>([]);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [recalledLetters, setRecalledLetters] = useState<string[]>([]);
  const [mathErrors, setMathErrors] = useState(0);
  const [setResults, setSetResults] = useState<{ setSize: number; correct: number }[]>([]);

  const generateAllSets = useCallback((): SetTrial[] => {
    const sets: SetTrial[] = [];
    for (let size = MIN_SET_SIZE; size <= MAX_SET_SIZE; size++) {
      for (let i = 0; i < SETS_PER_SIZE; i++) {
        sets.push(generateSet(size));
      }
    }
    // Shuffle
    for (let i = sets.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sets[i], sets[j]] = [sets[j], sets[i]];
    }
    return sets;
  }, []);

  const startGame = () => {
    setAllSets(generateAllSets());
    setPhase('countdown');
    setCountdown(3);
  };

  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'countdown' && countdown === 0) {
      setCurrentSetIndex(0);
      setCurrentItemIndex(0);
      setSetResults([]);
      setMathErrors(0);
      setPhase('equation');
    }
  }, [phase, countdown]);

  useEffect(() => {
    if (phase === 'letter') {
      const timer = setTimeout(() => {
        const currentSet = allSets[currentSetIndex];
        if (currentItemIndex + 1 < currentSet.setSize) {
          setCurrentItemIndex(prev => prev + 1);
          setPhase('equation');
        } else {
          setRecalledLetters([]);
          setPhase('recall');
        }
      }, LETTER_DISPLAY_TIME);
      return () => clearTimeout(timer);
    }
  }, [phase, currentItemIndex, currentSetIndex, allSets]);

  const handleMathResponse = (userSaysCorrect: boolean) => {
    const currentSet = allSets[currentSetIndex];
    const equation = currentSet.equations[currentItemIndex];

    if (userSaysCorrect !== equation.isCorrect) {
      setMathErrors(prev => prev + 1);
    }

    setPhase('letter');
  };

  const handleLetterClick = (letter: string) => {
    if (phase !== 'recall') return;

    if (recalledLetters.includes(letter)) {
      setRecalledLetters(prev => prev.filter(l => l !== letter));
    } else {
      setRecalledLetters(prev => [...prev, letter]);
    }
  };

  const handleRecallSubmit = () => {
    const currentSet = allSets[currentSetIndex];
    let correctCount = 0;

    currentSet.letters.forEach((letter, index) => {
      if (recalledLetters[index] === letter) {
        correctCount++;
      }
    });

    setSetResults(prev => [...prev, { setSize: currentSet.setSize, correct: correctCount }]);
    setPhase('feedback');
  };

  useEffect(() => {
    if (phase === 'feedback') {
      const timer = setTimeout(() => {
        if (currentSetIndex + 1 >= allSets.length) {
          setPhase('results');
        } else {
          setCurrentSetIndex(prev => prev + 1);
          setCurrentItemIndex(0);
          setPhase('equation');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, currentSetIndex, allSets.length]);

  const calculateStats = () => {
    const totalLetters = setResults.reduce((sum, r) => sum + r.setSize, 0);
    const correctLetters = setResults.reduce((sum, r) => sum + r.correct, 0);
    const accuracy = totalLetters > 0 ? (correctLetters / totalLetters) * 100 : 0;

    // Calculate partial credit score
    const partialScore = setResults.reduce((sum, r) => sum + r.correct, 0);

    // Calculate absolute score (only fully correct sets)
    const absoluteScore = setResults.reduce((sum, r) => sum + (r.correct === r.setSize ? r.setSize : 0), 0);

    const mathAccuracy = allSets.length > 0
      ? ((allSets.reduce((sum, s) => sum + s.setSize, 0) - mathErrors) / allSets.reduce((sum, s) => sum + s.setSize, 0)) * 100
      : 0;

    return { accuracy, partialScore, absoluteScore, mathAccuracy, totalLetters };
  };

  const currentSet = allSets[currentSetIndex];

  return (
    <div className="game-wrapper">
      <div className="game-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="game-title">Operation Span</h1>
        {phase !== 'instructions' && phase !== 'countdown' && phase !== 'results' && (
          <div className="game-stats">
            <div className="stat">
              <div className="stat-value">{currentSetIndex + 1}/{allSets.length}</div>
              <div className="stat-label">Set</div>
            </div>
          </div>
        )}
      </div>

      <div className="game-area">
        {phase === 'instructions' && (
          <div className="game-instructions">
            <h2>How to Play</h2>
            <p>
              This task measures your working memory while performing mental math.
              You'll alternate between verifying math equations and remembering letters.
            </p>
            <ul>
              <li>First, verify if a math equation is TRUE or FALSE</li>
              <li>Then, remember the letter that appears</li>
              <li>At the end of each set, recall the letters in order</li>
              <li>Sets increase in length from 3 to 7 items</li>
            </ul>
            <button className="start-btn" onClick={startGame}>
              Start Game
            </button>
          </div>
        )}

        {phase === 'countdown' && (
          <div className="countdown">{countdown}</div>
        )}

        {phase === 'equation' && currentSet && (
          <div className="ospan-equation">
            <div className="equation-display">
              {currentSet.equations[currentItemIndex].equation}
            </div>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
              Is this equation correct?
            </p>
            <div className="response-buttons">
              <button
                className="response-btn"
                style={{ backgroundColor: '#22c55e', color: 'white' }}
                onClick={() => handleMathResponse(true)}
              >
                TRUE
              </button>
              <button
                className="response-btn"
                style={{ backgroundColor: '#ef4444', color: 'white' }}
                onClick={() => handleMathResponse(false)}
              >
                FALSE
              </button>
            </div>
          </div>
        )}

        {phase === 'letter' && currentSet && (
          <div className="ospan-letter">
            <div className="letter-display">
              {currentSet.letters[currentItemIndex]}
            </div>
            <p style={{ color: '#94a3b8' }}>Remember this letter</p>
          </div>
        )}

        {phase === 'recall' && currentSet && (
          <div className="ospan-recall">
            <p style={{ color: '#cbd5e1', marginBottom: '1.5rem' }}>
              Click the letters in the order they appeared ({currentSet.setSize} letters)
            </p>
            <div className="recalled-display">
              {[...Array(currentSet.setSize)].map((_, i) => (
                <div key={i} className="recall-slot">
                  {recalledLetters[i] || '_'}
                </div>
              ))}
            </div>
            <div className="letter-grid">
              {LETTERS.map(letter => (
                <button
                  key={letter}
                  className={`letter-btn ${recalledLetters.includes(letter) ? 'selected' : ''}`}
                  onClick={() => handleLetterClick(letter)}
                >
                  {letter}
                </button>
              ))}
            </div>
            <div className="recall-actions">
              <button
                className="clear-btn"
                onClick={() => setRecalledLetters([])}
              >
                Clear
              </button>
              <button
                className="submit-btn"
                onClick={handleRecallSubmit}
                disabled={recalledLetters.length !== currentSet.setSize}
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {phase === 'feedback' && currentSet && (
          <div className="ospan-feedback">
            <h3>Set Complete</h3>
            <p>Correct letters: {setResults[setResults.length - 1]?.correct || 0}/{currentSet.setSize}</p>
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
                      <div className="result-value">{stats.partialScore}</div>
                      <div className="result-label">Partial Score</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.absoluteScore}</div>
                      <div className="result-label">Absolute Score</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.accuracy.toFixed(0)}%</div>
                      <div className="result-label">Letter Accuracy</div>
                    </div>
                    <div className="result-card">
                      <div className="result-value">{stats.mathAccuracy.toFixed(0)}%</div>
                      <div className="result-label">Math Accuracy</div>
                    </div>
                  </div>
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
