import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import AiAgent from '../features/ai/AiAgent.jsx';

/**
 * Shared shell for authenticated pages: animated background (rendered globally)
 * + glass navbar + routed content + the universal AI assistant.
 */
export default function DashboardLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <AiAgent />
    </div>
  );
}
