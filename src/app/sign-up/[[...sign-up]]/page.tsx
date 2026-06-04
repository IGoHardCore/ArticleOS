import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
        style={{
          background:
            'radial-gradient(circle at 20% 15%, rgba(167,139,250,0.22), transparent 40%),' +
            'radial-gradient(circle at 80% 80%, rgba(99,102,241,0.18), transparent 42%),' +
            'linear-gradient(145deg, #1e1035 0%, #2d1b69 40%, #1a1040 100%)',
        }}
      >
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, #a78bfa 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Glow orbs */}
        <div className="absolute top-[-80px] left-[-80px] w-80 h-80 rounded-full bg-violet-600 opacity-20 blur-3xl" />
        <div className="absolute bottom-[-60px] right-[-40px] w-64 h-64 rounded-full bg-indigo-500 opacity-15 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/brand/articleos-mark-white.svg"
              alt="ArticleOS"
              className="h-10 w-10 drop-shadow-lg"
            />
            <span className="brand-wordmark text-[22px] text-white" style={{ letterSpacing: '0.04em' }}>
              article<span className="text-violet-300">OS</span>
            </span>
          </div>

          {/* Hero copy */}
          <div className="mt-auto mb-auto pt-24">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3.5 py-1.5 mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-300 animate-pulse" />
              <span className="text-violet-200 text-xs font-medium tracking-wide uppercase">Medical Intelligence</span>
            </div>

            <h1 className="text-white font-bold leading-tight mb-4" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)' }}>
              Your personal<br />
              <span className="text-violet-300">pharmacy</span> &amp;<br />
              medicine news OS
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-xs">
              Join and get curated medical literature, AI-powered summaries, and clinical insights — all in one place.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-col gap-3 mt-auto">
            {[
              { icon: '⚡', label: 'Real-time article feeds' },
              { icon: '🤖', label: 'AI-powered summaries & chat' },
              { icon: '🔒', label: 'Your data, your keys, your privacy' },
            ].map(({ icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <span className="text-lg">{icon}</span>
                <span className="text-slate-300 text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="mt-8 text-slate-600 text-xs">
            © {new Date().getFullYear()} ArticleOS · Built for clinicians
          </p>
        </div>
      </div>

      {/* ── Right sign-up panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-slate-50">
        {/* Mobile logo */}
        <div className="flex items-center gap-2.5 mb-10 lg:hidden">
          <img src="/brand/articleos-mark-purple.svg" alt="ArticleOS" className="h-9 w-9" />
          <span className="brand-wordmark text-[20px] text-slate-900">
            article<span className="text-violet-600">OS</span>
          </span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h2>
          <p className="text-slate-500 text-sm mb-8">Get started with ArticleOS for free</p>

          <SignUp
            appearance={{
              elements: {
                card: 'shadow-none border-0 bg-transparent p-0',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton:
                  'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl h-11 transition-colors',
                dividerLine: 'bg-slate-200',
                dividerText: 'text-slate-400 text-xs',
                formFieldLabel: 'text-slate-700 text-sm font-medium',
                formFieldInput:
                  'border border-slate-200 bg-white rounded-xl h-11 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-violet-500',
                formButtonPrimary:
                  'bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl h-11 transition-colors',
                footerActionLink: 'text-violet-600 hover:text-violet-700 font-medium',
                identityPreviewText: 'text-slate-700',
                identityPreviewEditButton: 'text-violet-600',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
