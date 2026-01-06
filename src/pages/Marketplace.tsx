import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { games, getCategoriesWithCounts } from '../data/games.ts';
import { GameCard } from '../components/GameCard.tsx';
import type { GameMetadata } from '../types/game.ts';
import './Marketplace.css';

export const Marketplace = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const categories = getCategoriesWithCounts();

  const filteredGames = games.filter((game: GameMetadata) => {
    const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         game.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleGameClick = (game: GameMetadata) => {
    navigate(game.route);
  };

  return (
    <div className="marketplace">
      <header className="marketplace-header">
        <h1>Brain Games Marketplace</h1>
        <p className="marketplace-subtitle">
          Train your cognitive abilities with scientifically-backed brain training games
        </p>
      </header>

      <div className="marketplace-controls">
        <input
          type="text"
          placeholder="Search games..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="marketplace-search"
        />

        <div className="marketplace-filters">
          <button
            className={`filter-button ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Games ({games.length})
          </button>
          {Object.entries(categories).map(([key, { label, count }]) => (
            <button
              key={key}
              className={`filter-button ${selectedCategory === key ? 'active' : ''}`}
              onClick={() => setSelectedCategory(key)}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      <div className="marketplace-stats">
        <div className="stat-card">
          <div className="stat-value">{games.length}</div>
          <div className="stat-label">Total Games</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">4</div>
          <div className="stat-label">Categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{filteredGames.length}</div>
          <div className="stat-label">Showing</div>
        </div>
      </div>

      {filteredGames.length === 0 ? (
        <div className="no-results">
          <p>No games found matching your criteria.</p>
        </div>
      ) : (
        <div className="games-grid">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} onClick={() => handleGameClick(game)} />
          ))}
        </div>
      )}
    </div>
  );
};
