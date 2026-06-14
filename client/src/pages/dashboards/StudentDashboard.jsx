import {
  Compass,
  GraduationCap,
  PlayCircle,
  FileQuestion,
  MessagesSquare,
  Award,
  FileText,
  Layers,
  ClipboardList,
  Trophy,
  Heart,
  NotebookPen,
} from 'lucide-react';
import DashboardScaffold from '../../features/dashboard/DashboardScaffold.jsx';
import GamificationWidget from '../../features/gamification/GamificationWidget.jsx';

const accent = {
  badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 ring-sky-500/30',
  dot: 'bg-sky-500',
  text: 'text-sky-500',
  iconBg: 'bg-gradient-to-br from-sky-400 to-brand-600',
};

const cards = [
  { Icon: Compass, label: 'Browse Courses', desc: 'Discover and enroll in new courses.', to: '/courses' },
  { Icon: GraduationCap, label: 'My Learning', desc: 'Resume learning where you left off.', to: '/student/my-courses' },
  { Icon: PlayCircle, label: 'Lessons & Progress', desc: 'Watch lessons and track completion.', to: '/student/my-courses' },
  { Icon: FileQuestion, label: 'Quizzes', desc: 'Test yourself with AI-graded quizzes.', to: '/student/quizzes' },
  { Icon: MessagesSquare, label: 'Ask & Discuss', desc: 'Course forums + AI Q&A in each course.', to: '/student/discuss' },
  { Icon: Award, label: 'Certificates', desc: 'Earn & download certificates.', to: '/student/certificates' },
  { Icon: Heart, label: 'Saved Courses', desc: 'Your wishlist — saved for later.', to: '/student/wishlist' },
  { Icon: NotebookPen, label: 'Notes & Bookmarks', desc: 'Your lesson notes and saved lessons.', to: '/student/notes' },
  { Icon: FileText, label: 'Doc Q&A', desc: 'Upload a PDF/doc and ask questions about it.', to: '/student/tools?tab=doc' },
  { Icon: Layers, label: 'Flashcards', desc: 'AI-generated flashcards on any topic.', to: '/student/tools?tab=cards' },
  { Icon: ClipboardList, label: 'Mock Test', desc: 'AI mock tests by topic & difficulty.', to: '/student/tools?tab=mock' },
  { Icon: Trophy, label: 'Leaderboard', desc: 'Earn XP, badges & climb the ranks.', to: '/student/leaderboard' },
];

export default function StudentDashboard() {
  return (
    <DashboardScaffold
      accent={accent}
      badge="Student workspace"
      title="Welcome"
      blurb="Your learning hub — browse courses, learn, take AI quizzes, ask the course AI, and earn certificates."
      cards={cards}
      extra={<GamificationWidget />}
    />
  );
}
