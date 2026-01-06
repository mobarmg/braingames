import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../shared/GameContainer.css';
import './TowerOfHanoi.css';

type GamePhase = 'instructions' | 'countdown' | 'playing' | 'results';

interface Disk {
  id: number;
  size: number;
}

type Towers = [Disk[], Disk[], Disk[]];

export const TowerOfHanoi = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GamePhase>('instructions');
  const [countdown, setCountdown] = useState(3);
  const [numDisks, setNumDisks] = useState(4);
  const [towers, setTowers] = useState<Towers>([[], [], []]);
  const [selectedTower, setSelectedTower] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [completionTime, setCompletionTime] = useState(0);
  const [minMoves, setMinMoves] = useState(0);

  const initializeTowers = (disks: number): Towers => {
    const initialDisks: Disk[] = [];
    for (let i = disks; i >= 1; i--) {
      initialDisks.push({ id: i, size: i });
    }
    return [initialDisks, [], []];
  };

  const startGame = () => {
    setPhase('countdown');
    setCountdown(3);
    setMinMoves(Math.pow(2, numDisks) - 1);
  };

  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'countdown' && countdown === 0) {
      setTowers(initializeTowers(numDisks));
      setMoves(0);
      setSelectedTower(null);
      setStartTime(Date.now());
      setPhase('playing');
    }
  }, [phase, countdown, numDisks]);

  const handleTowerClick = (towerIndex: number) => {
    if (phase !== 'playing') return;

    if (selectedTower === null) {
      // Select tower if it has disks
      if (towers[towerIndex].length > 0) {
        setSelectedTower(towerIndex);
      }
    } else {
      // Try to move disk
      if (selectedTower === towerIndex) {
        // Deselect
        setSelectedTower(null);
      } else {
        const sourceTower = towers[selectedTower];
        const targetTower = towers[towerIndex];
        const diskToMove = sourceTower[sourceTower.length - 1];

        // Check if move is valid
        if (targetTower.length === 0 || diskToMove.size < targetTower[targetTower.length - 1].size) {
          const newTowers: Towers = [
            [...towers[0]],
            [...towers[1]],
            [...towers[2]],
          ];
          newTowers[selectedTower] = sourceTower.slice(0, -1);
          newTowers[towerIndex] = [...targetTower, diskToMove];
          setTowers(newTowers);
          setMoves(prev => prev + 1);

          // Check win condition
          if (newTowers[2].length === numDisks) {
            setCompletionTime((Date.now() - startTime) / 1000);
            setPhase('results');
          }
        }
        setSelectedTower(null);
      }
    }
  };

  const getDiskColor = (size: number) => {
    const colors = [
      '#ef4444', '#f97316', '#eab308', '#22c55e',
      '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
    ];
    return colors[(size - 1) % colors.length];
  };

  return (
    <div className="game-wrapper">
      <div className="game-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="game-title">Tower of Hanoi</h1>
        {phase === 'playing' && (
          <div className="game-stats">
            <div className="stat">
              <div className="stat-value">{moves}</div>
              <div className="stat-label">Moves</div>
            </div>
            <div className="stat">
              <div className="stat-value">{minMoves}</div>
              <div className="stat-label">Minimum</div>
            </div>
          </div>
        )}
      </div>

      <div className="game-area">
        {phase === 'instructions' && (
          <div className="game-instructions">
            <h2>How to Play</h2>
            <p>
              Move all disks from the left tower to the right tower,
              following these rules:
            </p>
            <ul>
              <li>Only one disk can be moved at a time</li>
              <li>A larger disk cannot be placed on top of a smaller disk</li>
              <li>Try to complete the puzzle in the minimum number of moves</li>
            </ul>
            <div className="difficulty-selector">
              <label>Number of Disks:</label>
              <div className="level-buttons">
                {[3, 4, 5, 6].map(n => (
                  <button
                    key={n}
                    className={`level-btn ${numDisks === n ? 'active' : ''}`}
                    onClick={() => setNumDisks(n)}
                  >
                    {n} Disks
                  </button>
                ))}
              </div>
              <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
                Minimum moves: {Math.pow(2, numDisks) - 1}
              </p>
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
          <div className="hanoi-game">
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
              {selectedTower !== null
                ? 'Click a tower to place the disk'
                : 'Click a tower to pick up the top disk'}
            </p>
            <div className="hanoi-towers">
              {towers.map((tower, towerIndex) => (
                <div
                  key={towerIndex}
                  className={`hanoi-tower ${selectedTower === towerIndex ? 'selected' : ''}`}
                  onClick={() => handleTowerClick(towerIndex)}
                >
                  <div className="tower-peg" />
                  <div className="tower-base" />
                  <div className="tower-disks">
                    {tower.map((disk, diskIndex) => (
                      <div
                        key={disk.id}
                        className={`hanoi-disk ${
                          selectedTower === towerIndex && diskIndex === tower.length - 1
                            ? 'selected'
                            : ''
                        }`}
                        style={{
                          width: `${disk.size * 25 + 30}px`,
                          backgroundColor: getDiskColor(disk.size),
                        }}
                      />
                    ))}
                  </div>
                  <div className="tower-label">
                    {towerIndex === 0 ? 'Start' : towerIndex === 1 ? 'Middle' : 'Goal'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === 'results' && (
          <div className="results">
            <h2>Puzzle Complete!</h2>
            <div className="results-grid">
              <div className="result-card">
                <div className="result-value">{moves}</div>
                <div className="result-label">Your Moves</div>
              </div>
              <div className="result-card">
                <div className="result-value">{minMoves}</div>
                <div className="result-label">Minimum Moves</div>
              </div>
              <div className="result-card">
                <div className="result-value">{completionTime.toFixed(1)}s</div>
                <div className="result-label">Time</div>
              </div>
              <div className="result-card">
                <div className="result-value">
                  {moves === minMoves ? 'Perfect!' : `+${moves - minMoves}`}
                </div>
                <div className="result-label">Efficiency</div>
              </div>
            </div>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
              {moves === minMoves
                ? 'Outstanding! You solved it optimally!'
                : moves <= minMoves * 1.2
                ? 'Great job! Very close to optimal!'
                : 'Good effort! Try to use fewer moves next time.'}
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
