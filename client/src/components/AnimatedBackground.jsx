/**
 * Decorative animated gradient "blobs" behind the glass UI.
 * Pure CSS/Tailwind, pointer-events-none, fixed behind all content.
 */
export default function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-sky-400/30 blur-3xl animate-blob dark:bg-sky-500/20" />
      <div className="absolute right-[-6rem] top-1/4 h-96 w-96 rounded-full bg-brand-500/25 blur-3xl animate-blob [animation-delay:4s] dark:bg-brand-600/20" />
      <div className="absolute bottom-[-8rem] left-1/3 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl animate-blob [animation-delay:8s] dark:bg-blue-700/20" />
    </div>
  );
}
