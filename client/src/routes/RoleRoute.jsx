import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, DASHBOARD_BY_ROLE } from '../context/AuthContext.jsx';
import { FullScreenLoader } from '../components/Spinner.jsx';

/**
 * Gate that requires the authenticated user to have one of `roles`.
 * Wrong-role users are redirected to their own dashboard.
 *
 *   <Route element={<RoleRoute roles={['admin']} />}>
 *     <Route path="/admin" element={<AdminDashboard />} />
 *   </Route>
 */
export default function RoleRoute({ roles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <FullScreenLoader label="Checking access…" />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles.length && !roles.includes(user.role)) {
    return <Navigate to={DASHBOARD_BY_ROLE[user.role] || '/'} replace />;
  }

  return <Outlet />;
}
