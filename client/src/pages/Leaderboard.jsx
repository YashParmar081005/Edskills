import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Trophy, Crown } from 'lucide-react';
import { getLeaderboard } from '../api/gamification.js';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/Spinner.jsx';

function initials(name = '') {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

const medal = ['text-amber-400', 'text-slate-400', 'text-orange-400'];

export default function Leaderboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['gamification', 'leaderboard'], queryFn: getLeaderboard });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const leaders = data?.leaders || [];

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/student" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <Trophy className="h-6 w-6 text-amber-400" /> Leaderboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Top learners by XP. You're <span className="font-semibold text-brand-600 dark:text-brand-300">#{data?.me?.rank}</span> with {data?.me?.xp || 0} XP.
        </p>
      </div>

      {leaders.length === 0 ? (
        <div className="glass-card p-10 text-center text-sm text-slate-500 dark:text-slate-400">
          No XP earned yet. Complete lessons and quizzes to climb the board!
        </div>
      ) : (
        <div className="glass-card divide-y divide-white/30 p-2 dark:divide-white/10">
          {leaders.map((u) => {
            const isMe = user && u.name === user.name && u.rank === data?.me?.rank;
            return (
              <div
                key={u.rank}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 ${isMe ? 'bg-sky-500/10' : ''}`}
              >
                <div className="w-8 text-center">
                  {u.rank <= 3 ? (
                    <Crown className={`mx-auto h-5 w-5 ${medal[u.rank - 1]}`} />
                  ) : (
                    <span className="text-sm font-bold text-slate-400">{u.rank}</span>
                  )}
                </div>
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-400 to-brand-600 text-xs font-bold text-white">
                  {u.avatar ? <img src={u.avatar} alt="" className="h-full w-full object-cover" /> : initials(u.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {u.name} {isMe && <span className="text-xs font-normal text-sky-500">(you)</span>}
                  </p>
                  <p className="text-xs text-slate-400">Level {u.level}</p>
                </div>
                <p className="font-bold text-brand-600 dark:text-brand-300">{u.xp} XP</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
