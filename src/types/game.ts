export type GameCategory =
  | 'attention-inhibition'
  | 'working-memory'
  | 'processing-speed'
  | 'reasoning-problem-solving';

export interface GameMetadata {
  id: string;
  name: string;
  category: GameCategory;
  categoryLabel: string;
  description: string;
  benefits: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  duration: string;
  route: string;
}
