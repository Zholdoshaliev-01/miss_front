import { Outlet, Link } from 'react-router-dom'
import { GraduationCap, BookOpen, Users, ClipboardCheck, BarChart3 } from 'lucide-react'
import { academyConfig } from '@/core/config/academy'

const features = [
  { icon: Users, text: 'Manage student groups' },
  { icon: ClipboardCheck, text: 'Create interactive tests' },
  { icon: BookOpen, text: 'Share materials & homework' },
  { icon: BarChart3, text: 'Track performance' },
]

export function AuthLayout() {
  return (
    <div className="relative min-h-dvh bg-navy noise-overlay">
      <div className="mesh-gradient" />

      <div className="relative z-10 flex min-h-dvh">
        {/* Left panel — branding (hidden on mobile) */}
        <div className="hidden w-[480px] shrink-0 flex-col justify-between border-r border-white/[0.04] bg-white/[0.01] p-10 lg:flex xl:w-[520px]">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-dark">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-heading text-xl font-bold tracking-tight text-white">
                {academyConfig.academyName}
              </span>
            </Link>

            <div className="mt-16">
              <h2 className="font-heading text-3xl font-bold leading-tight text-white">
                Welcome to
                <br />
                <span className="gradient-text">{academyConfig.teacherName}'s classroom</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/40">
                {academyConfig.shortDescription}
              </p>
            </div>

            <div className="mt-10 space-y-4">
              {features.map((f) => (
                <div key={f.text} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/[0.08] text-accent-light">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-white/55">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/20">{academyConfig.copyright}</p>
        </div>

        {/* Right panel — form */}
        <div className="flex flex-1 items-center justify-center px-4 py-10">
          {/* Mobile logo */}
          <div className="absolute left-4 top-6 lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-dark">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="font-heading text-lg font-bold text-white">
                {academyConfig.academyName}
              </span>
            </Link>
          </div>

          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
