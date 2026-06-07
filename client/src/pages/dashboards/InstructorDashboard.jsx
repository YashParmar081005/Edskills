import { BookPlus, Layers, FileQuestion, ClipboardList, MessagesSquare, LineChart } from 'lucide-react';
import DashboardScaffold from '../../features/dashboard/DashboardScaffold.jsx';

const accent = {
  badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 ring-amber-500/30',
  dot: 'bg-amber-500',
  text: 'text-amber-500',
  iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
};

const cards = [
  { Icon: BookPlus, label: 'My Courses', desc: 'Create, edit & publish courses.', to: '/instructor/courses' },
  { Icon: Layers, label: 'Course Builder', desc: 'Create a brand-new course.', to: '/instructor/courses?new=1' },
  { Icon: FileQuestion, label: 'AI Quiz Generator', desc: 'All your quizzes across courses.', to: '/instructor/quizzes' },
  { Icon: ClipboardList, label: 'Assignments', desc: 'Create & AI-grade submissions.', to: '/instructor/assignments' },
  { Icon: MessagesSquare, label: 'Discussions', desc: 'Answer student questions.', to: '/instructor/discussions' },
  { Icon: LineChart, label: 'Analytics', desc: 'Track engagement & quiz scores.', to: '/instructor/analytics' },
];

export default function InstructorDashboard() {
  return (
    <DashboardScaffold
      accent={accent}
      badge="Instructor workspace"
      title="Hello"
      blurb="Create courses, generate AI quizzes, AI-grade assignments, answer discussions, and track analytics."
      cards={cards}
    />
  );
}
