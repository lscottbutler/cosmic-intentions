// Vite entry — Phase 0.
// For now this only pulls the stylesheet through the build pipeline so Vite
// minifies and content-hashes it. The application logic still lives in the
// classic global scripts loaded from index.html; it will move here, as proper
// ES modules, in later phases.
import './styles/main.css';
