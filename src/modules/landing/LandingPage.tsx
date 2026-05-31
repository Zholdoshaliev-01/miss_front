import { Link } from 'react-router-dom'
import {
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Users,
  BarChart3,
  Layout,
  ArrowRight,
  Star,
  Sparkles,
  Zap,
  Shield,
  ChevronRight,
  Play,
} from 'lucide-react'

/* ════════════════════════════════════
   FEATURES DATA
   ════════════════════════════════════ */
const features = [
  {
    icon: Users,
    title: 'Group Management',
    desc: 'Create and manage student groups with invite codes. Track enrollment and organize your classes effortlessly.',
    color: 'from-blue-500 to-cyan-400',
    glow: 'rgba(59,130,246,0.15)',
  },
  {
    icon: ClipboardCheck,
    title: 'Smart Tests',
    desc: 'Build interactive tests with auto-grading. Create questions, set points, and review results instantly.',
    color: 'from-violet-500 to-purple-400',
    glow: 'rgba(139,92,246,0.15)',
  },
  {
    icon: BookOpen,
    title: 'Homework Tracking',
    desc: 'Assign homework with deadlines, collect submissions, and leave reviews — all in one workflow.',
    color: 'from-emerald-500 to-green-400',
    glow: 'rgba(16,185,129,0.15)',
  },
  {
    icon: GraduationCap,
    title: 'Materials Hub',
    desc: 'Upload and share learning materials. Students access everything they need from a single dashboard.',
    color: 'from-amber-500 to-orange-400',
    glow: 'rgba(245,158,11,0.15)',
  },
  {
    icon: BarChart3,
    title: 'Student Ratings',
    desc: 'Track performance with detailed ratings. Identify top students and those that need extra support.',
    color: 'from-rose-500 to-pink-400',
    glow: 'rgba(244,63,94,0.15)',
  },
  {
    icon: Layout,
    title: 'Real-time Dashboard',
    desc: 'Get a bird\'s-eye view of your entire workspace — groups, tests, submissions, and student activity.',
    color: 'from-indigo-500 to-blue-400',
    glow: 'rgba(99,102,241,0.15)',
  },
]

const stats = [
  { value: '10K+', label: 'Active Students' },
  { value: '500+', label: 'Teachers' },
  { value: '2K+', label: 'Courses' },
  { value: '98%', label: 'Satisfaction' },
]

const steps = [
  {
    num: '01',
    title: 'Create Your Space',
    desc: 'Set up your teacher account and create your first group in seconds.',
    icon: Sparkles,
  },
  {
    num: '02',
    title: 'Build & Share',
    desc: 'Upload materials, create tests, and assign homework to your groups.',
    icon: Zap,
  },
  {
    num: '03',
    title: 'Track & Grow',
    desc: 'Monitor progress, review submissions, and help students succeed.',
    icon: BarChart3,
  },
]

const testimonials = [
  {
    name: 'Aigerim K.',
    role: 'University Teacher',
    text: 'EduFlow transformed how I manage my courses. The test builder alone saved me hours every week.',
    rating: 5,
  },
  {
    name: 'Daulet M.',
    role: 'Computer Science Student',
    text: 'Finally, a platform that doesn\'t feel outdated. The interface is clean and everything just works.',
    rating: 5,
  },
  {
    name: 'Nursultan T.',
    role: 'Department Head',
    text: 'We rolled out EduFlow across three departments. The analytics alone made it worth the switch.',
    rating: 5,
  },
]

/* ════════════════════════════════════
   COMPONENT
   ════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="relative min-h-dvh bg-navy overflow-x-hidden noise-overlay">
      {/* Mesh background */}
      <div className="mesh-gradient" />

      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-navy-900/70 px-6 py-3 backdrop-blur-xl">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-dark">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-heading text-lg font-bold tracking-tight text-white">
                Edu<span className="text-accent-light">Flow</span>
              </span>
            </Link>
            <div className="hidden items-center gap-6 md:flex">
              <a href="#features" className="text-sm text-white/60 transition hover:text-white">Features</a>
              <a href="#how-it-works" className="text-sm text-white/60 transition hover:text-white">How it works</a>
              <a href="#testimonials" className="text-sm text-white/60 transition hover:text-white">Reviews</a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
              <Link to="/register" className="btn-primary !py-2 !px-4 text-sm">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative flex min-h-dvh items-center justify-center px-4 pt-24 pb-20">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute top-1/4 left-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.05] blur-[120px] animate-glow-pulse" />
        <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-purple-500/[0.04] blur-[100px] animate-glow-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="animate-fade-in mb-8 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.08] px-4 py-1.5">
            <Sparkles className="h-4 w-4 text-accent-light" />
            <span className="text-sm font-medium text-accent-light">Modern LMS Platform</span>
          </div>

          {/* Main heading */}
          <h1 className="animate-slide-up font-heading text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-white">Teaching made</span>
            <br />
            <span className="gradient-text">beautifully simple</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-slide-up stagger-1 mx-auto mt-6 max-w-2xl text-lg text-white/50 sm:text-xl" style={{ opacity: 0 }}>
            Manage groups, create tests, track homework — all from one sleek dashboard.
            Built for modern educators who value their time.
          </p>

          {/* CTA buttons */}
          <div className="animate-slide-up stagger-2 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row" style={{ opacity: 0 }}>
            <Link to="/register" className="btn-primary !px-8 !py-3.5 text-base">
              Start for Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a href="#features" className="btn-secondary !px-8 !py-3.5 text-base">
              <Play className="h-4 w-4" />
              See how it works
            </a>
          </div>

          {/* Trust indicators */}
          <div className="animate-fade-in stagger-3 mt-14 flex flex-wrap items-center justify-center gap-8" style={{ opacity: 0 }}>
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-navy bg-gradient-to-br from-accent/30 to-purple-500/30 text-xs font-bold text-white/80"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm text-white/40">
              Trusted by <span className="font-semibold text-white/70">500+</span> teachers worldwide
            </p>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="relative z-10 border-y border-white/[0.04] bg-white/[0.01] py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-heading text-3xl font-bold text-white sm:text-4xl">{s.value}</div>
                <div className="mt-1 text-sm text-white/40">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="relative z-10 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/[0.06] px-3 py-1">
              <Zap className="h-3.5 w-3.5 text-accent-light" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent-light">Features</span>
            </div>
            <h2 className="mt-5 font-heading text-3xl font-bold text-white sm:text-4xl">
              Everything you need to <span className="gradient-text">teach effectively</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/45">
              A complete toolkit for modern education — from content delivery to performance analytics.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="glass-card glass-card-hover card-shine group p-6"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} shadow-lg`}
                  style={{ boxShadow: `0 8px 24px ${f.glow}` }}
                >
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/45 group-hover:text-white/55 transition-colors">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="relative z-10 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/[0.06] px-3 py-1">
              <Shield className="h-3.5 w-3.5 text-accent-light" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent-light">How it works</span>
            </div>
            <h2 className="mt-5 font-heading text-3xl font-bold text-white sm:text-4xl">
              Up and running in <span className="gradient-text">minutes</span>
            </h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.num} className="relative text-center">
                {/* Number */}
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/20 bg-accent/[0.06]">
                  <step.icon className="h-7 w-7 text-accent-light" />
                </div>
                <div className="mb-2 font-heading text-xs font-bold uppercase tracking-widest text-accent/60">{step.num}</div>
                <h3 className="font-heading text-xl font-semibold text-white">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-white/45">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="relative z-10 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/[0.06] px-3 py-1">
              <Star className="h-3.5 w-3.5 text-accent-light" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent-light">Testimonials</span>
            </div>
            <h2 className="mt-5 font-heading text-3xl font-bold text-white sm:text-4xl">
              Loved by <span className="gradient-text">educators</span>
            </h2>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="glass-card p-6">
                <div className="mb-4 flex gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-white/60">"{t.text}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent/30 to-purple-500/30 text-sm font-bold text-white">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-white/40">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative z-10 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-4">
          <div className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/[0.08] to-purple-500/[0.05] p-12 text-center sm:p-16">
            {/* Decorative glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-accent/20 blur-[100px]" />

            <h2 className="relative font-heading text-3xl font-bold text-white sm:text-4xl">
              Ready to transform your teaching?
            </h2>
            <p className="relative mx-auto mt-4 max-w-lg text-white/50">
              Join hundreds of educators already using EduFlow to create better learning experiences.
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/register" className="btn-primary !px-10 !py-3.5 text-base">
                Get Started Free
                <ChevronRight className="h-5 w-5" />
              </Link>
              <Link to="/login" className="btn-ghost text-base text-white/60">
                Already have an account?
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 border-t border-white/[0.04] py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-dark">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="font-heading text-base font-bold text-white/80">
                Edu<span className="text-accent-light">Flow</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/35">
              <a href="#features" className="transition hover:text-white/60">Features</a>
              <a href="#how-it-works" className="transition hover:text-white/60">How it works</a>
              <a href="#testimonials" className="transition hover:text-white/60">Reviews</a>
              <Link to="/login" className="transition hover:text-white/60">Sign in</Link>
            </div>
            <p className="text-xs text-white/25">© 2026 EduFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
