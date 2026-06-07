import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, ShieldX, GraduationCap, Calendar } from 'lucide-react';
import { verifyCertificate } from '../api/certificates.js';
import Logo from '../components/Logo.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import Spinner from '../components/Spinner.jsx';
import { formatDateTime } from '../lib/dates.js';

export default function CertificateVerify() {
  const { certificateId } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['verify', certificateId],
    queryFn: () => verifyCertificate(certificateId),
  });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="glass-card w-full max-w-md animate-fade-in p-8 text-center">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-7 w-7" />
            </div>
          ) : data?.valid ? (
            <>
              <ShieldCheck className="mx-auto h-14 w-14 text-green-500" />
              <h1 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
                Verified Certificate
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                This is an authentic EdSkill.ai certificate.
              </p>

              <div className="mt-6 space-y-3 rounded-xl bg-white/40 p-5 text-left dark:bg-white/5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Awarded to</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {data.studentName}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Course</p>
                  <p className="flex items-center gap-1.5 font-semibold text-brand-600 dark:text-brand-300">
                    <GraduationCap className="h-4 w-4" /> {data.courseTitle}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Issued</p>
                  <p className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                    <Calendar className="h-4 w-4" /> {formatDateTime(data.issuedAt)}
                  </p>
                </div>
              </div>
              <p className="mt-4 font-mono text-xs text-slate-400">{data.certificateId}</p>
            </>
          ) : (
            <>
              <ShieldX className="mx-auto h-14 w-14 text-rose-500" />
              <h1 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
                Certificate not found
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                We couldn't verify <span className="font-mono">{certificateId}</span>. Check the ID
                and try again.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
