import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Marketplace } from './pages/Marketplace.tsx'
// Attention & Inhibition Games
import { StroopTask } from './games/attention-inhibition/StroopTask.tsx'
import { FlankerTask } from './games/attention-inhibition/FlankerTask.tsx'
import { GoNoGo } from './games/attention-inhibition/GoNoGo.tsx'
// Working Memory Games
import { NBack } from './games/working-memory/NBack.tsx'
import { DualNBack } from './games/working-memory/DualNBack.tsx'
import { CorsiBlocks } from './games/working-memory/CorsiBlocks.tsx'
import { OperationSpan } from './games/working-memory/OperationSpan.tsx'
// Processing Speed Games
import { TaskSwitching } from './games/processing-speed/TaskSwitching.tsx'
import { TrailMaking } from './games/processing-speed/TrailMaking.tsx'
import { UFOV } from './games/processing-speed/UFOV.tsx'
// Reasoning & Problem-Solving Games
import { RavensMatrices } from './games/reasoning-problem-solving/RavensMatrices.tsx'
import { TowerOfHanoi } from './games/reasoning-problem-solving/TowerOfHanoi.tsx'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Marketplace />} />
        {/* Attention & Inhibition */}
        <Route path="/games/stroop-task" element={<StroopTask />} />
        <Route path="/games/flanker-task" element={<FlankerTask />} />
        <Route path="/games/go-no-go" element={<GoNoGo />} />
        {/* Working Memory */}
        <Route path="/games/n-back" element={<NBack />} />
        <Route path="/games/dual-n-back" element={<DualNBack />} />
        <Route path="/games/corsi-blocks" element={<CorsiBlocks />} />
        <Route path="/games/operation-span" element={<OperationSpan />} />
        {/* Processing Speed */}
        <Route path="/games/task-switching" element={<TaskSwitching />} />
        <Route path="/games/trail-making" element={<TrailMaking />} />
        <Route path="/games/ufov" element={<UFOV />} />
        {/* Reasoning & Problem-Solving */}
        <Route path="/games/ravens-matrices" element={<RavensMatrices />} />
        <Route path="/games/tower-of-hanoi" element={<TowerOfHanoi />} />
      </Routes>
    </Router>
  )
}

export default App
