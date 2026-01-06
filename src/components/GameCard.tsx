import type { GameMetadata } from '../types/game.ts';
import './GameCard.css';

interface GameCardProps {
  game: GameMetadata;
  onClick: () => void;
}

export const GameCard = ({ game, onClick }: GameCardProps) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return '#4ade80';
      case 'Medium':
        return '#fbbf24';
      case 'Hard':
        return '#f87171';
      default:
        return '#888';
    }
  };

  return (
    <div className="game-card" onClick={onClick}>
      <div className="game-card-header">
        <h3 className="game-card-title">{game.name}</h3>
        <span
          className="game-card-difficulty"
          style={{ backgroundColor: getDifficultyColor(game.difficulty) }}
        >
          {game.difficulty}
        </span>
      </div>

      <div className="game-card-meta">
        <span className="game-card-category">{game.categoryLabel}</span>
        <span className="game-card-duration">{game.duration}</span>
      </div>

      <p className="game-card-description">{game.description}</p>

      <div className="game-card-benefits">
        <h4>Benefits:</h4>
        <ul>
          {game.benefits.slice(0, 2).map((benefit, index) => (
            <li key={index}>{benefit}</li>
          ))}
        </ul>
      </div>

      <button className="game-card-button">Play Now</button>
    </div>
  );
};
