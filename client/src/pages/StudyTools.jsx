import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, FileText, Layers, ClipboardList } from 'lucide-react';
import DocQa from '../features/studytools/DocQa.jsx';
import Flashcards from '../features/studytools/Flashcards.jsx';
import MockTest from '../features/studytools/MockTest.jsx';

const TABS = [
  { key: 'doc', label: 'Doc Q&A', Icon: FileText, Component: DocQa },
  { key: 'cards', label: 'Flashcards', Icon: Layers, Component: Flashcards },
  { key: 'mock', label: 'Mock Test', Icon: ClipboardList, Component: MockTest },
];

export default function StudyTools() {
  const [params, setParams] = useSearchParams();
  const active = TABS.find((t) => t.key === params.get('tab')) ? params.get('tab') : 'doc';
  const ActiveComponent = TABS.find((t) => t.key === active).Component;

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/student" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <Sparkles className="h-6 w-6 text-brand-500" /> AI Study Tools
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Upload a document to ask questions, generate flashcards, or take a mock test — all powered by AI.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setParams({ tab: key }, { replace: true })}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              active === key
                ? 'bg-gradient-to-r from-sky-500 to-brand-600 text-white shadow-lg shadow-brand-600/25'
                : 'border border-white/40 bg-white/40 text-slate-600 hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <ActiveComponent />
    </div>
  );
}
