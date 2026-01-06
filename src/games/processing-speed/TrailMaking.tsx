import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../shared/GameContainer.css';
import './TrailMaking.css';

type GamePhase = 'instructions' | 'countdown' | 'playing' | 'results';

interface Node {
  id: string;
  x: number;
  y: number;
  value: string;
  type: 'number' | 'letter';
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
const SEQUENCE_LENGTH = 13; // 1-A-2-B-3-C... up to 13 nodes

const generateNodes = (): Node[] => {
  const nodes: Node[] = [];
  const usedPositions: { x: number; y: number }[] = [];

  const getRandomPosition = (): { x: number; y: number } => {
    let pos: { x: number; y: number };
    let attempts = 0;
    do {
      pos = {
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
      };
      attempts++;
    } while (
      attempts < 100 &&
      usedPositions.some(p => Math.hypot(p.x - pos.x, p.y - pos.y) < 12)
    );
    usedPositions.push(pos);
    return pos;
  };

  // Create alternating sequence: 1, A, 2, B, 3, C...
  for (let i = 0; i < SEQUENCE_LENGTH; i++) {
    const isNumber = i % 2 === 0;
    const pos = getRandomPosition();
    const value = isNumber ? String(Math.floor(i / 2) + 1) : LETTERS[Math.floor(i / 2)];

    nodes.push({
      id: `node-${i}`,
      x: pos.x,
      y: pos.y,
      value,
      type: isNumber ? 'number' : 'letter',
    });
  }

  return nodes;
};

export const TrailMaking = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GamePhase>('instructions');
  const [countdown, setCountdown] = useState(3);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visitedNodes, setVisitedNodes] = useState<string[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [completionTime, setCompletionTime] = useState(0);
  const [errors, setErrors] = useState(0);
  const [lines, setLines] = useState<{ from: Node; to: Node }[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);

  const startGame = () => {
    setNodes(generateNodes());
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
      setVisitedNodes([]);
      setLines([]);
      setErrors(0);
      setStartTime(Date.now());
    }
  }, [phase, countdown]);

  const getExpectedNode = (index: number): Node | undefined => {
    // Expected sequence: 1, A, 2, B, 3, C...
    const isNumber = index % 2 === 0;
    const value = isNumber ? String(Math.floor(index / 2) + 1) : LETTERS[Math.floor(index / 2)];
    return nodes.find(n => n.value === value);
  };

  const handleNodeClick = (node: Node) => {
    if (phase !== 'playing') return;

    const expectedNode = getExpectedNode(currentIndex);

    if (node === expectedNode) {
      setVisitedNodes(prev => [...prev, node.id]);

      if (currentIndex > 0) {
        const prevNode = getExpectedNode(currentIndex - 1);
        if (prevNode) {
          setLines(prev => [...prev, { from: prevNode, to: node }]);
        }
      }

      if (currentIndex + 1 >= SEQUENCE_LENGTH) {
        setCompletionTime((Date.now() - startTime) / 1000);
        setPhase('results');
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } else {
      setErrors(prev => prev + 1);
    }
  };

  const getNextExpectedValue = (): string => {
    const expected = getExpectedNode(currentIndex);
    return expected?.value || '';
  };

  return (
    <div className="game-wrapper">
      <div className="game-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="game-title">Trail Making Test B</h1>
        {phase === 'playing' && (
          <div className="game-stats">
            <div className="stat">
              <div className="stat-value">{currentIndex}/{SEQUENCE_LENGTH}</div>
              <div className="stat-label">Progress</div>
            </div>
            <div className="stat">
              <div className="stat-value">{errors}</div>
              <div className="stat-label">Errors</div>
            </div>
          </div>
        )}
      </div>

      <div className="game-area">
        {phase === 'instructions' && (
          <div className="game-instructions">
            <h2>How to Play</h2>
            <p>
              Connect the circles in alternating order between numbers and letters:
              <strong> 1 → A → 2 → B → 3 → C</strong> and so on.
            </p>
            <ul>
              <li>Click on the circles in the correct sequence</li>
              <li>Alternate between numbers and letters</li>
              <li>Complete the trail as quickly as possible</li>
              <li>Errors are counted but won't stop you</li>
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
            <div className="trail-hint">
              Next: <span className="next-value">{getNextExpectedValue()}</span>
            </div>
            <div className="trail-board" ref={boardRef}>
              <svg className="trail-lines">
                {lines.map((line, i) => (
                  <line
                    key={i}
                    x1={`${line.from.x}%`}
                    y1={`${line.from.y}%`}
                    x2={`${line.to.x}%`}
                    y2={`${line.to.y}%`}
                    stroke="#6366f1"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                ))}
              </svg>
              {nodes.map(node => (
                <div
                  key={node.id}
                  className={`trail-node ${node.type} ${visitedNodes.includes(node.id) ? 'visited' : ''}`}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  onClick={() => handleNodeClick(node)}
                >
                  {node.value}
                </div>
              ))}
            </div>
          </>
        )}

        {phase === 'results' && (
          <div className="results">
            <h2>Trail Complete!</h2>
            <div className="results-grid">
              <div className="result-card">
                <div className="result-value">{completionTime.toFixed(1)}s</div>
                <div className="result-label">Completion Time</div>
              </div>
              <div className="result-card">
                <div className="result-value">{errors}</div>
                <div className="result-label">Errors</div>
              </div>
              <div className="result-card">
                <div className="result-value">
                  {completionTime < 30 ? 'Excellent' : completionTime < 60 ? 'Good' : 'Keep Practicing'}
                </div>
                <div className="result-label">Performance</div>
              </div>
            </div>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
              Average time for TMT-B is 75 seconds. Under 30 seconds is excellent!
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
