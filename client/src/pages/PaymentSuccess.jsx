import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, XCircle, PlayCircle, Compass } from 'lucide-react';
import { confirmPayment } from '../api/payments.js';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const courseId = params.get('course');
  const qc = useQueryClient();
  const [state, setState] = useState('verifying'); // verifying | success | pending | error

  useEffect(() => {
    if (!sessionId) {
      setState('error');
      return;
    }
    let active = true;
    confirmPayment(sessionId)
      .then((d) => {
        if (!active) return;
        if (d.paid) {
          qc.invalidateQueries();
          setState('success');
        } else {
          setState('pending');
        }
      })
      .catch(() => active && setState('error'));
    return () => {
      active = false;
    };
  }, [sessionId, qc]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="glass-card w-full max-w-md animate-fade-in p-8 text-center">
        {state === 'verifying' && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand-500" />
            <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
              Confirming your payment…
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Hang tight while we enroll you.
            </p>
          </>
        )}

        {state === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
            <h1 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">
              Payment successful! 🎉
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              You're enrolled. Time to start learning.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {courseId && (
                <Link to={`/learn/${courseId}`} className="btn-primary w-full">
                  <PlayCircle className="h-4 w-4" /> Start the course
                </Link>
              )}
              <Link to="/student/my-courses" className="btn-ghost w-full">
                Go to My Learning
              </Link>
            </div>
          </>
        )}

        {state === 'pending' && (
          <>
            <Loader2 className="mx-auto h-12 w-12 text-amber-500" />
            <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
              Payment is processing
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              This can take a moment. Check My Learning shortly.
            </p>
            <Link to="/student/my-courses" className="btn-primary mt-6 inline-flex">
              Go to My Learning
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <XCircle className="mx-auto h-14 w-14 text-rose-500" />
            <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
              Couldn't confirm payment
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              If you were charged, your enrollment will appear shortly. Otherwise, try again.
            </p>
            <Link to="/courses" className="btn-ghost mt-6 inline-flex">
              <Compass className="h-4 w-4" /> Browse courses
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
