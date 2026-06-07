import { Compass, GraduationCap, PlayCircle, FileQuestion, MessagesSquare, Award } from 'lucide-react';
import DashboardScaffold from '../../features/dashboard/DashboardScaffold.jsx';

const accent = {
  badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 ring-sky-500/30',
  dot: 'bg-sky-500',
  text: 'text-sky-500',
  iconBg: 'bg-gradient-to-br from-sky-400 to-brand-600',
};

const cards = [
  { Icon: Compass, label: 'Browse Courses', desc: 'Discover and enroll in new courses.', soon: true },
  { Icon: GraduationCap, label: 'My Courses', desc: 'Resume learning where you left off.', soon: true },
  { Icon: PlayCircle, label: 'Lessons & Progress', desc: 'Watch lessons and track completion.', soon: true },
  { Icon: FileQuestion, label: 'Quizzes', desc: 'Test yourself with AI-graded quizzes.', soon: true },
  { Icon: MessagesSquare, label: 'Ask & Discuss', desc: 'Get help in course forums + AI Q&A.', soon: true },
  { Icon: Award, label: 'Certificates', desc: 'Earn certificates on completion.', soon: true },
];

export default function StudentDashboard() {
  return (
    <DashboardScaffold
      accent={accent}
      badge="Student workspace"
      title="Welcome"
      blurb="Your learning hub. Course browsing, the lesson player, quizzes, and certificates unlock in the coming phases."
      cards={cards}
    />
  );
}
