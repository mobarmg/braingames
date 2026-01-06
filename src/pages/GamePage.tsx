import { useNavigate, useParams } from 'react-router-dom';
import { games } from '../data/games.ts';
import './GamePage.css';

export const GamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const game = games.find((g) => g.id === gameId);

  if (!game) {
    return (
      <div className="game-page">
        <div className="game-not-found">
          <h2>Game Not Found</h2>
          <button onClick={() => navigate('/')}>Back to Marketplace</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page">
      <div className="game-page-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Marketplace
        </button>
      </div>

      <div className="game-page-content">
        <div className="game-info">
          <h1>{game.name}</h1>
          <div className="game-meta">
            <span className="game-category-badge">{game.categoryLabel}</span>
            <span className="game-difficulty-badge">{game.difficulty}</span>
            <span className="game-duration-badge">{game.duration}</span>
          </div>

          <p className="game-description">{game.description}</p>

          <div className="game-benefits-section">
            <h2>Benefits</h2>
            <ul>
              {game.benefits.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="game-container">
          <div className="game-placeholder">
            <h3>Game Coming Soon!</h3>
            <p>
              The {game.name} is currently under development. This game will help you:
            </p>
            <ul>
              {game.benefits.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
            <p className="implementation-note">
              Implementation of this cognitive training game will be added in future updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
