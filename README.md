# Brain Games Marketplace

A React-based web application marketplace for scientifically-backed cognitive training games. Train your brain across multiple cognitive domains including attention, working memory, processing speed, and problem-solving.

## Features

- **15 Cognitive Training Games** across 4 categories
- **Category Filtering** - Browse games by cognitive domain
- **Search Functionality** - Find games quickly by name or description
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Modern UI** - Beautiful dark theme with gradient accents

## Game Categories

### Attention & Inhibition
- **Stroop Task** - Improves inhibitory control and selective attention
- **Flanker Task** - Trains conflict resolution and focused attention
- **Go/No-Go Task** - Enhances response inhibition

### Working Memory
- **N-Back Task** - One of the most researched tasks for working memory
- **Dual N-Back** - Advanced variant with visual and auditory streams
- **Corsi Block-Tapping Task** - Trains visuospatial working memory
- **Operation Span Task** - Combines processing with memory retention

### Processing Speed & Flexibility
- **Task Switching** - Improves cognitive flexibility
- **Trail Making Test (TMT-B)** - Trains sequencing and mental flexibility
- **Useful Field of View (UFOV)** - Improves visual processing speed

### Reasoning & Problem-Solving
- **Raven's Progressive Matrices** - Targets fluid intelligence and pattern recognition
- **Tower of Hanoi / Tower of London** - Trains planning and problem-solving

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm 11+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:5173/`

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── GameCard.tsx
│   └── GameCard.css
├── pages/           # Page components
│   ├── Marketplace.tsx
│   ├── Marketplace.css
│   ├── GamePage.tsx
│   └── GamePage.css
├── games/           # Individual game implementations
│   ├── attention-inhibition/
│   ├── working-memory/
│   ├── processing-speed/
│   └── reasoning-problem-solving/
├── types/           # TypeScript type definitions
│   └── game.ts
├── data/            # Game metadata and configurations
│   └── games.ts
├── App.tsx          # Main app component with routing
└── main.tsx         # Application entry point
```

## Development

### Adding New Games

1. Add game metadata to `src/data/games.ts`
2. Create game component in appropriate category folder under `src/games/`
3. Update routing in `src/App.tsx` if needed

### Customizing Styles

- Global styles: `src/index.css`
- Component-specific styles: Co-located `.css` files

## Next Steps

The marketplace structure is complete. To implement individual games:

1. Create game components in their respective category folders
2. Each game should follow cognitive training best practices
3. Include scoring, progress tracking, and difficulty adjustment
4. Add game instructions and feedback mechanisms

## License

MIT
