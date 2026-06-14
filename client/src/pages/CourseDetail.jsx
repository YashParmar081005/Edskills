import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  PlayCircle,
  FileText,
  Video,
  Lock,
  GraduationCap,
  Users,
  Layers,
  CheckCircle2,
  Pencil,
  CreditCard,
  Ticket,
  X,
} from 'lucide-react';
import { usePublicCourse, useEnroll } from '../features/learn/hooks.js';
import { priceLabel } from '../features/learn/PublicCourseCard.jsx';
import { createCheckout } from '../api/payments.js';
import { validateCoupon } from '../api/coupons.js';
import Spinner from '../components/Spinner.jsx';
import StarRating from '../components/StarRating.jsx';
import CourseReviews from '../features/reviews/CourseReviews.jsx';

function fmtDuration(s) {
  if (!s) return '';
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: course, isLoading, isError, error } = usePublicCourse(id);
  const enrollMut = useEnroll(id);
  const [buying, setBuying] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [applied, setApplied] = useState(null); // { code, percentOff, discountedPrice }
  const [applying, setApplying] = useState(false);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplying(true);
    try {
      const data = await validateCoupon(couponInput.trim(), id);
      setApplied(data);
      toast.success(`Coupon applied — ${data.percentOff}% off`);
    } catch (e) {
      setApplied(null);
      toast.error(e.response?.data?.message || 'Invalid coupon');
    } finally {
      setApplying(false);
    }
  };

  const handleBuy = async () => {
    setBuying(true);
    try {
      const res = await createCheckout(id, applied?.code);
      if (res.free) {
        toast.success('Enrolled with your coupon! 🎉');
        navigate(`/learn/${id}`);
        return;
      }
      window.location.href = res.url; // redirect to Stripe Checkout
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not start checkout');
      setBuying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (isError) {
    const code = error?.response?.status;
    return (
      <div className="glass-card mx-auto max-w-md p-8 text-center">
        <p className="text-rose-500">
          {code === 404 ? 'Course not found or not published.' : "Couldn't load this course."}
        </p>
        <Link to="/courses" className="btn-ghost mt-4 inline-flex">
          <ArrowLeft className="h-4 w-4" /> Browse courses
        </Link>
      </div>
    );
  }

  const totalLessons = course.modules.reduce((n, m) => n + m.lessons.length, 0);

  const handleEnroll = () => {
    if (course.price > 0) return; // paid handled later
    enrollMut.mutate(undefined, {
      onSuccess: () => navigate(`/learn/${id}`),
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <Link
        to="/courses"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" /> Browse courses
      </Link>

      {/* Hero */}
      <div className="glass-card grid gap-6 p-6 md:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-sky-500/15 px-2 py-0.5 font-medium text-sky-600 dark:text-sky-300">
              {course.category}
            </span>
            {course.tags?.slice(0, 4).map((t) => (
              <span key={t} className="rounded bg-white/40 px-2 py-0.5 text-slate-500 dark:bg-white/10 dark:text-slate-300">
                #{t}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {course.title}
          </h1>
          {course.description && (
            <p className="mt-3 text-slate-600 dark:text-slate-300">{course.description}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="h-4 w-4" /> {course.instructor?.name}
            </span>
            <span className="inline-flex items-center gap-1">
              <Layers className="h-4 w-4" /> {course.modules.length} modules
            </span>
            <span className="inline-flex items-center gap-1">
              <PlayCircle className="h-4 w-4" /> {totalLessons} lessons
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" /> {course.totalEnrollments || 0} enrolled
            </span>
            {course.ratingCount > 0 && (
              <StarRating value={course.ratingAvg} count={course.ratingCount} showValue />
            )}
          </div>
        </div>

        {/* Enroll panel */}
        <div className="glass-soft flex flex-col p-5">
          <div className="h-36 w-full overflow-hidden rounded-xl bg-gradient-to-br from-sky-400/30 to-brand-600/30">
            {course.thumbnail ? (
              <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/70">
                <Video className="h-10 w-10" />
              </div>
            )}
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            {applied ? (
              <>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {priceLabel(applied.discountedPrice)}
                </span>
                <span className="text-lg text-slate-400 line-through">{priceLabel(course.price)}</span>
                <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-bold text-green-600 dark:text-green-300">
                  -{applied.percentOff}%
                </span>
              </>
            ) : (
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {priceLabel(course.price)}
              </span>
            )}
          </div>

          <div className="mt-4 space-y-2">
            {course.isOwner ? (
              <Link to={`/instructor/courses/${id}`} className="btn-ghost w-full">
                <Pencil className="h-4 w-4" /> Edit in builder
              </Link>
            ) : course.isEnrolled ? (
              <Link to={`/learn/${id}`} className="btn-primary w-full">
                <PlayCircle className="h-4 w-4" /> Continue learning
              </Link>
            ) : course.price > 0 ? (
              <>
                {/* Coupon */}
                {applied ? (
                  <div className="flex items-center justify-between rounded-xl border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-green-700 dark:text-green-300">
                      <Ticket className="h-4 w-4" /> {applied.code}
                    </span>
                    <button
                      onClick={() => { setApplied(null); setCouponInput(''); }}
                      className="text-slate-400 hover:text-rose-500"
                      title="Remove coupon"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyCoupon())}
                      placeholder="Coupon code"
                      className="glass-input !py-2 text-sm uppercase"
                    />
                    <button onClick={applyCoupon} disabled={applying || !couponInput.trim()} className="btn-ghost shrink-0 !py-2 text-sm">
                      {applying ? <Spinner /> : 'Apply'}
                    </button>
                  </div>
                )}
                <button onClick={handleBuy} disabled={buying} className="btn-primary w-full">
                  {buying ? <Spinner /> : <CreditCard className="h-4 w-4" />}
                  Buy for {priceLabel(applied ? applied.discountedPrice : course.price)}
                </button>
              </>
            ) : (
              <button onClick={handleEnroll} disabled={enrollMut.isPending} className="btn-primary w-full">
                {enrollMut.isPending ? <Spinner /> : <CheckCircle2 className="h-4 w-4" />}
                Enroll for free
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
          <Layers className="h-5 w-5 text-brand-500" /> Curriculum
        </h2>
        {course.modules.length === 0 ? (
          <div className="glass-card p-6 text-center text-sm text-slate-500">
            Curriculum coming soon.
          </div>
        ) : (
          <div className="space-y-3">
            {course.modules.map((m, i) => (
              <div key={m._id} className="glass-card p-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-brand-500/15 px-2 py-1 text-xs font-bold text-brand-600 dark:text-brand-300">
                    {i + 1}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white">{m.title}</h3>
                  <span className="ml-auto text-xs text-slate-400">{m.lessons.length} lessons</span>
                </div>
                <ul className="mt-3 space-y-1.5 pl-1">
                  {m.lessons.map((l) => (
                    <li
                      key={l._id}
                      className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
                    >
                      {l.type === 'video' ? (
                        <Video className="h-4 w-4 text-sky-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-brand-500" />
                      )}
                      <span className="flex-1 truncate">{l.title}</span>
                      {l.duration > 0 && (
                        <span className="text-xs text-slate-400">{fmtDuration(l.duration)}</span>
                      )}
                      {!course.isEnrolled && !course.isOwner && (
                        <Lock className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviews */}
      <CourseReviews courseId={id} canReview={course.isEnrolled && !course.isOwner} />
    </div>
  );
}
