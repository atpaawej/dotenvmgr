export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-26rem] h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(148,163,184,0.13),transparent_66%)]" />
      <div className="absolute -left-48 top-1/3 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.05),transparent_70%)]" />
      <div className="absolute -right-56 bottom-[-16rem] h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,rgba(129,140,248,0.05),transparent_70%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.09] to-transparent" />
    </div>
  );
}
