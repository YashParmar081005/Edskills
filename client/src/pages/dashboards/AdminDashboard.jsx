import { Users, BookOpen, BarChart3, ShieldCheck, CreditCard, Bell, ClipboardCheck, Cpu } from 'lucide-react';
import DashboardScaffold from '../../features/dashboard/DashboardScaffold.jsx';

const accent = {
  badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 ring-rose-500/30',
  dot: 'bg-rose-500',
  text: 'text-rose-500',
  iconBg: 'bg-gradient-to-br from-rose-400 to-rose-600',
};

const cards = [
  { Icon: ClipboardCheck, label: 'Course Approvals', desc: 'Review & approve instructor submissions.', to: '/admin/approvals' },
  { Icon: Users, label: 'User Management', desc: 'Manage admins, instructors & students.', to: '/admin/users' },
  { Icon: BookOpen, label: 'All Courses', desc: 'Oversee every course on the platform.', to: '/instructor/courses' },
  { Icon: BarChart3, label: 'Platform Analytics', desc: 'Enrollments, revenue & completion rates.', to: '/admin/analytics' },
  { Icon: Cpu, label: 'AI Usage & Cost', desc: 'Token usage & estimated AI spend.', to: '/admin/ai-usage' },
  { Icon: CreditCard, label: 'Payments', desc: 'Track Stripe transactions & revenue.', to: '/admin/payments' },
  { Icon: Bell, label: 'Announcements', desc: 'Broadcast notifications & reminders.', to: '/admin/announcements' },
  { Icon: ShieldCheck, label: 'Roles & Access', desc: 'Permissions matrix & role changes.', to: '/admin/roles' },
];

export default function AdminDashboard() {
  return (
    <DashboardScaffold
      accent={accent}
      badge="Admin workspace"
      title="Welcome"
      blurb="You have full control over the platform — manage users, oversee courses, track payments, and view analytics."
      cards={cards}
    />
  );
}
