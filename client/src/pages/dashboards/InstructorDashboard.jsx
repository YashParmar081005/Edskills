import { BookPlus, Layers, FileQuestion, ClipboardList, MessagesSquare, LineChart } from 'lucide-react';
import DashboardScaffold from '../../features/dashboard/DashboardScaffold.jsx';

const accent = {
  badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 ring-amber-500/30',
  dot: 'bg-amber-500',
  text: 'text-amber-500',
  iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
};

const cards = [
  { Icon: BookPlus, label: 'My Courses', desc: 'Create & manage your courses.', to: '/instructor/courses' },
  { Icon: Layers, label: 'Course Builder', desc: 'Add modules, lessons & videos.', to: '/instructor/courses' },
  { Icon: FileQuestion, label: 'AI Quiz Generator', desc: 'Generate quizzes from lesson content.', soon: true },
  { Icon: ClipboardList, label: 'Assignments', desc: 'Create & AI-grade submissions.', soon: true },
  { Icon: MessagesSquare, label: 'Discussions', desc: 'Answer questions in course forums.', soon: true },
  { Icon: LineChart, label: 'Analytics', desc: 'Track engagement & quiz scores.', soon: true },
];

export default function InstructorDashboard() {
  return (
    <DashboardScaffold
      accent={accent}
      badge="Instructor workspace"
      title="Hello"
      blurb="Create and manage your courses. The full course builder and AI teaching tools arrive in the next phases."
      cards={cards}
    />
  );
}
