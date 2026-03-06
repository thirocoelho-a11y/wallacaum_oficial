// ═══════════════════════════════════════════════════════
//  main.tsx — Entry Point (SEM StrictMode para evitar double game loop)
// ═══════════════════════════════════════════════════════
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
