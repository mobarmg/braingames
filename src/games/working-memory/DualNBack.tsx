import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../shared/GameContainer.css';
import './DualNBack.css';

type GamePhase = 'instructions' | 'countdown' | 'playing' | 'results';

interface Trial {
  position: number;
  letter: string;
}

const GRID_SIZE = 3;
const LETTERS = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'];
const TOTAL_TRIALS = 25;
const TARGET_RATIO = 0.25;
const STIMULUS_DURATION = 500;
const ISI_DURATION = 2500;

export const DualNBack = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GamePhase>('instructions');
  const [nLevel, setNLevel] = useState(2);
  const [countdown, setCountdown] = useState(3);
  const [sequence, setSequence] = useState<Trial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showStimulus, setShowStimulus] = useState(false);
  const [positionResponse, setPositionResponse] = useState(false);
  const [audioResponse, setAudioResponse] = useState(false);
  const [results, setResults] = useState<{
    positionHit: number;
    positionMiss: number;
    positionFA: number;
    audioHit: number;
    audioMiss: number;
    audioFA: number;
  }>({ positionHit: 0, positionMiss: 0, positionFA: 0, audioHit: 0, audioMiss: 0, audioFA: 0 });

  const generateSequence = useCallback((n: number): Trial[] => {
    const trials: Trial[] = [];
    const positionTargets = Math.floor(TOTAL_TRIALS * TARGET_RATIO);
    const audioTargets = Math.floor(TOTAL_TRIALS * TARGET_RATIO);
    let currentPosTargets = 0;
    let currentAudioTargets = 0;

    for (let i = 0; i < TOTAL_TRIALS; i++) {
      let position: number;
      let letter: string;

      // Decide position
      if (i >= n && currentPosTargets < positionTargets && Math.random() < 0.35) {
        position = trials[i - n].position;
        currentPosTargets++;
      } else {
        do {
          position = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE));
        } while (i >= n && position === trials[i - n].position);
      }

      // Decide letter
      if (i >= n && currentAudioTargets < audioTargets && Math.random() < 0.35) {
        letter = trials[i - n].letter;
        currentAudioTargets++;
      } else {
        do {
          letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        } while (i >= n && letter === trials[i - n].letter);
      }

      trials.push({ position, letter });
    }

    return trials;
  }, []);

  const speakLetter = (letter: string) => {
    const utterance = new SpeechSynthesisUtterance(letter);
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  const startGame = () => {
    setSequence(generateSequence(nLevel));
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
      setResults({ positionHit: 0, positionMiss: 0, positionFA: 0, audioHit: 0, audioMiss: 0, audioFA: 0 });
      setShowStimulus(true);
      setPositionResponse(false);
      setAudioResponse(false);
    }
  }, [phase, countdown]);

  useEffect(() => {
    if (phase === 'playing' && showStimulus && sequence[currentIndex]) {
      speakLetter(sequence[currentIndex].letter);

      const timer = setTimeout(() => {
        setShowStimulus(false);

        // Calculate results for this trial
        if (currentIndex >= nLevel) {
          const isPositionTarget = sequence[currentIndex].position === sequence[currentIndex - nLevel].position;
          const isAudioTarget = sequence[currentIndex].letter === sequence[currentIndex - nLevel].letter;

          setResults(prev => ({
            positionHit: prev.positionHit + (isPositionTarget && positionResponse ? 1 : 0),
            positionMiss: prev.positionMiss + (isPositionTarget && !positionResponse ? 1 : 0),
            positionFA: prev.positionFA + (!isPositionTarget && positionResponse ? 1 : 0),
            audioHit: prev.audioHit + (isAudioTarget && audioResponse ? 1 : 0),
            audioMiss: prev.audioMiss + (isAudioTarget && !audioResponse ? 1 : 0),
            audioFA: prev.audioFA + (!isAudioTarget && audioResponse ? 1 : 0),
          }));
        }
      }, STIMULUS_DURATION);
      return () => clearTimeout(timer);
    }
  }, [phase, showStimulus, currentIndex, sequence, nLevel, positionResponse, audioResponse]);

  useEffect(() => {
    if (phase === 'playing' && !showStimulus) {
      const timer = setTimeout(() => {
        if (currentIndex + 1 >= TOTAL_TRIALS) {
          setPhase('results');
        } else {
          setCurrentIndex(prev => prev + 1);
          setShowStimulus(true);
          setPositionResponse(false);
          setAudioResponse(false);
        }
      }, ISI_DURATION);
      return () => clearTimeout(timer);
    }
  }, [phase, showStimulus, currentIndex]);

  const handlePositionResponse = useCallback(() => {
    if (phase === 'playing' && !positionResponse) {
      setPositionResponse(true);
    }
  }, [phase, positionResponse]);

  const handleAudioResponse = useCallback(() => {
    if (phase === 'playing' && !audioResponse) {
      setAudioResponse(true);
    }
  }, [phase, audioResponse]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') {
        handlePositionResponse();
      } else if (e.key === 'l' || e.key === 'L') {
        handleAudioResponse();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handlePositionResponse, handleAudioResponse]);

  const trial = sequence[currentIndex];

  return (
    <div className="game-wrapper">
      <div className="game-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="game-title">Dual {nLevel}-Back</h1>
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
              Track BOTH position AND audio simultaneously! Press the corresponding
              button when either matches {nLevel} steps back.
            </p>
            <ul>
              <li>Press <strong>A</strong> (or left button) when POSITION matches {nLevel} back</li>
              <li>Press <strong>L</strong> (or right button) when AUDIO/letter matches {nLevel} back</li>
              <li>Both can match on the same trial!</li>
            </ul>
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

            <div className="dual-grid">
              {[...Array(GRID_SIZE * GRID_SIZE)].map((_, i) => (
                <div
                  key={i}
                  className={`dual-cell ${showStimulus && trial?.position === i ? 'active' : ''}`}
                />
              ))}
            </div>

            <div className="dual-responses">
              <button
                className={`dual-btn position ${positionResponse ? 'pressed' : ''}`}
                onClick={handlePositionResponse}
              >
                Position Match (A)
              </button>
              <button
                className={`dual-btn audio ${audioResponse ? 'pressed' : ''}`}
                onClick={handleAudioResponse}
              >
                Audio Match (L)
              </button>
            </div>
          </>
        )}

        {phase === 'results' && (
          <div className="results">
            <h2>Results</h2>
            <div className="dual-results">
              <div className="result-section">
                <h3>Position</h3>
                <div className="results-grid">
                  <div className="result-card">
                    <div className="result-value">{results.positionHit}</div>
                    <div className="result-label">Hits</div>
                  </div>
                  <div className="result-card">
                    <div className="result-value">{results.positionMiss}</div>
                    <div className="result-label">Misses</div>
                  </div>
                  <div className="result-card">
                    <div className="result-value">{results.positionFA}</div>
                    <div className="result-label">False Alarms</div>
                  </div>
                </div>
              </div>
              <div className="result-section">
                <h3>Audio</h3>
                <div className="results-grid">
                  <div className="result-card">
                    <div className="result-value">{results.audioHit}</div>
                    <div className="result-label">Hits</div>
                  </div>
                  <div className="result-card">
                    <div className="result-value">{results.audioMiss}</div>
                    <div className="result-label">Misses</div>
                  </div>
                  <div className="result-card">
                    <div className="result-value">{results.audioFA}</div>
                    <div className="result-label">False Alarms</div>
                  </div>
                </div>
              </div>
            </div>
            <button className="play-again-btn" onClick={startGame}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
