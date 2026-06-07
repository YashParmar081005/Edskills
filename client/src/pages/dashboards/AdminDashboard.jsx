import { Users, BookOpen, BarChart3, ShieldCheck, CreditCard, Bell } from 'lucide-react';
import DashboardScaffold from '../../features/dashboard/DashboardScaffold.jsx';

const accent = {
  badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 ring-rose-500/30',
  dot: 'bg-rose-500',
  text: 'text-rose-500',
  iconBg: 'bg-gradient-to-br from-rose-400 to-rose-600',
};

const cards = [
  { Icon: Users, label: 'User Management', desc: 'Manage admins, instructors & students.', soon: true },
  { Icon: BookOpen, label: 'All Courses', desc: 'Oversee every course on the platform.', to: '/instructor/courses' },
  { Icon: BarChart3, label: 'Platform Analytics', desc: 'Enrollments, revenue & completion rates.', soon: true },
  { Icon: CreditCard, label: 'Payments', desc: 'Track Stripe transactions & payouts.', soon: true },
  { Icon: Bell, label: 'Notifications', desc: 'Broadcast announcements to users.', soon: true },
  { Icon: ShieldCheck, label: 'Roles & Access', desc: 'Configure role-based permissions.', soon: true },
];

export default function AdminDashboard() {
  return (
    <DashboardScaffold
      accent={accent}
      badge="Admin workspace"
      title="Welcome"
      blurb="You have full control over the platform. Course, payment, and analytics tools light up in the coming phases."
      cards={cards}
    />
  );
}
