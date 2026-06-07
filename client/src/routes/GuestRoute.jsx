import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, DASHBOARD_BY_ROLE } from '../context/AuthContext.jsx';
import { FullScreenLoader } from '../components/Spinner.jsx';

/**
 * Guest-only routes (login/register). Authenticated users are bounced to
 * their role dashboard.
 */
export default function GuestRoute() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (isAuthenticated) {
    return <Navigate to={DASHBOARD_BY_ROLE[user.role] || '/'} replace />;
  }
  return <Outlet />;
}
