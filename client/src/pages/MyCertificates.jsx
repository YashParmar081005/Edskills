import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Award, Download, ShieldCheck, GraduationCap } from 'lucide-react';
import { getMyCertificates } from '../api/certificates.js';
import Spinner from '../components/Spinner.jsx';
import { formatDateTime } from '../lib/dates.js';

export default function MyCertificates() {
  const { data: certificates, isLoading } = useQuery({
    queryKey: ['certificates', 'mine'],
    queryFn: getMyCertificates,
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <Award className="h-6 w-6 text-brand-500" /> My Certificates
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Certificates you've earned by completing courses.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!isLoading && certificates?.length === 0 && (
        <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-brand-600 text-white">
            <Award className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No certificates yet</h3>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Complete a course 100% to earn your first certificate.
          </p>
          <Link to="/student/my-courses" className="btn-primary mt-2">
            <GraduationCap className="h-4 w-4" /> Go to My Learning
          </Link>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {certificates?.map((c) => (
          <div key={c.certificateId} className="glass-card flex flex-col p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="mt-3 font-bold text-slate-900 dark:text-white">
              {c.course?.title || 'Course'}
            </h3>
            <p className="text-xs text-slate-400">Issued {formatDateTime(c.issuedAt)}</p>
            <p className="mt-1 font-mono text-[11px] text-slate-400">{c.certificateId}</p>
            <div className="mt-4 flex gap-2">
              <a href={c.downloadUrl} target="_blank" rel="noreferrer" className="btn-primary flex-1 !py-2 text-xs">
                <Download className="h-3.5 w-3.5" /> Download
              </a>
              <Link to={`/verify/${c.certificateId}`} className="btn-ghost !py-2 text-xs" title="Verify">
                <ShieldCheck className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
