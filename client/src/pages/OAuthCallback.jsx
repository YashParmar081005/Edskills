import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { insforge } from '../lib/insforge.js';
import { oauthInsforgeRequest } from '../api/auth.js';
import { useAuth, DASHBOARD_BY_ROLE } from '../context/AuthContext.jsx';
import { FullScreenLoader } from '../components/Spinner.jsx';

/**
 * Lands here after Google → InsForge OAuth. The SDK auto-exchanges the
 * `insforge_code` in the URL for a session; we read the token, exchange it with
 * our backend for an app session, then redirect to the dashboard.
 */
export default function OAuthCallback() {
  const navigate = useNavigate();
  const { applySession } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard React StrictMode double-run
    ran.current = true;

    (async () => {
      try {
        // Triggers the SDK to detect + exchange the callback code and save the session.
        await insforge.auth.getCurrentUser();
        const token = insforge.auth.tokenManager.getAccessToken();
        if (!token) throw new Error('No session from Google. Please try again.');

        const data = await oauthInsforgeRequest(token);
        const user = applySession(data);
        toast.success(`Welcome, ${user.name.split(' ')[0]}!`);
        navigate(DASHBOARD_BY_ROLE[user.role] || '/', { replace: true });
      } catch (e) {
        toast.error(e.response?.data?.message || e.message || 'Google sign-in failed.');
        navigate('/login', { replace: true });
      }
    })();
  }, [applySession, navigate]);

  return <FullScreenLoader label="Finishing Google sign-in…" />;
}
