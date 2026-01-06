import type { GameMetadata } from '../types/game.ts';

export const games: GameMetadata[] = [
  // Attention & Inhibition
  {
    id: 'stroop-task',
    name: 'Stroop Task',
    category: 'attention-inhibition',
    categoryLabel: 'Attention & Inhibition',
    description: 'Test your ability to overcome automatic responses and focus on relevant information.',
    benefits: ['Improves inhibitory control', 'Enhances selective attention', 'Strengthens cognitive flexibility'],
    difficulty: 'Medium',
    duration: '5-10 min',
    route: '/games/stroop-task',
  },
  {
    id: 'flanker-task',
    name: 'Flanker Task',
    category: 'attention-inhibition',
    categoryLabel: 'Attention & Inhibition',
    description: 'Train your ability to focus on target stimuli while ignoring distracting flankers.',
    benefits: ['Trains conflict resolution', 'Improves focused attention', 'Enhances response selection'],
    difficulty: 'Medium',
    duration: '5-10 min',
    route: '/games/flanker-task',
  },
  {
    id: 'go-no-go',
    name: 'Go/No-Go Task',
    category: 'attention-inhibition',
    categoryLabel: 'Attention & Inhibition',
    description: 'Practice inhibiting responses to certain stimuli while responding to others.',
    benefits: ['Enhances response inhibition', 'Improves impulse control', 'Strengthens self-regulation'],
    difficulty: 'Easy',
    duration: '5-8 min',
    route: '/games/go-no-go',
  },

  // Working Memory
  {
    id: 'n-back',
    name: 'N-Back Task',
    category: 'working-memory',
    categoryLabel: 'Working Memory',
    description: 'One of the most researched cognitive training tasks for improving working memory.',
    benefits: ['Strengthens working memory updating', 'Improves fluid intelligence', 'Enhances cognitive control'],
    difficulty: 'Hard',
    duration: '10-15 min',
    route: '/games/n-back',
  },
  {
    id: 'dual-n-back',
    name: 'Dual N-Back',
    category: 'working-memory',
    categoryLabel: 'Working Memory',
    description: 'Advanced variant combining visual and auditory streams for maximum challenge.',
    benefits: ['Maximizes working memory training', 'Improves multitasking', 'Enhances dual-task performance'],
    difficulty: 'Hard',
    duration: '15-20 min',
    route: '/games/dual-n-back',
  },
  {
    id: 'corsi-blocks',
    name: 'Corsi Block-Tapping Task',
    category: 'working-memory',
    categoryLabel: 'Working Memory',
    description: 'Train your visuospatial working memory by remembering sequences of block positions.',
    benefits: ['Trains visuospatial working memory', 'Improves spatial reasoning', 'Enhances visual memory'],
    difficulty: 'Medium',
    duration: '8-12 min',
    route: '/games/corsi-blocks',
  },
  {
    id: 'operation-span',
    name: 'Operation Span Task',
    category: 'working-memory',
    categoryLabel: 'Working Memory',
    description: 'Combine processing arithmetic operations with remembering sequences.',
    benefits: ['Improves working memory capacity', 'Enhances processing with retention', 'Strengthens executive function'],
    difficulty: 'Hard',
    duration: '12-15 min',
    route: '/games/operation-span',
  },

  // Processing Speed & Flexibility
  {
    id: 'task-switching',
    name: 'Task Switching (Set-Shifting)',
    category: 'processing-speed',
    categoryLabel: 'Processing Speed & Flexibility',
    description: 'Practice switching between different mental tasks quickly and efficiently.',
    benefits: ['Improves cognitive flexibility', 'Enhances task-switching ability', 'Reduces switching costs'],
    difficulty: 'Medium',
    duration: '8-12 min',
    route: '/games/task-switching',
  },
  {
    id: 'trail-making',
    name: 'Trail Making Test (TMT-B)',
    category: 'processing-speed',
    categoryLabel: 'Processing Speed & Flexibility',
    description: 'Connect numbers and letters in alternating sequence as quickly as possible.',
    benefits: ['Trains sequencing', 'Improves mental flexibility', 'Enhances processing speed'],
    difficulty: 'Medium',
    duration: '5-8 min',
    route: '/games/trail-making',
  },
  {
    id: 'ufov',
    name: 'Useful Field of View (UFOV)',
    category: 'processing-speed',
    categoryLabel: 'Processing Speed & Flexibility',
    description: 'Developed for older adults to improve visual processing speed and attention.',
    benefits: ['Improves visual processing speed', 'Enhances divided attention', 'Expands useful field of view'],
    difficulty: 'Easy',
    duration: '10-12 min',
    route: '/games/ufov',
  },

  // Reasoning & Problem-Solving
  {
    id: 'ravens-matrices',
    name: "Raven's Progressive Matrices",
    category: 'reasoning-problem-solving',
    categoryLabel: 'Reasoning & Problem-Solving',
    description: 'Train pattern recognition and abstract reasoning with progressive matrix puzzles.',
    benefits: ['Targets fluid intelligence', 'Improves pattern recognition', 'Enhances abstract reasoning'],
    difficulty: 'Hard',
    duration: '15-20 min',
    route: '/games/ravens-matrices',
  },
  {
    id: 'tower-of-hanoi',
    name: 'Tower of Hanoi / Tower of London',
    category: 'reasoning-problem-solving',
    categoryLabel: 'Reasoning & Problem-Solving',
    description: 'Solve planning puzzles by moving disks to achieve the goal configuration.',
    benefits: ['Trains planning', 'Improves problem-solving', 'Enhances sequential thinking'],
    difficulty: 'Medium',
    duration: '10-15 min',
    route: '/games/tower-of-hanoi',
  },
];

export const getCategoriesWithCounts = () => {
  const categories = games.reduce((acc, game) => {
    const { category, categoryLabel } = game;
    if (!acc[category]) {
      acc[category] = { label: categoryLabel, count: 0 };
    }
    acc[category].count++;
    return acc;
  }, {} as Record<string, { label: string; count: number }>);

  return categories;
};

export const getGamesByCategory = (category: string) => {
  return games.filter(game => game.category === category);
};
