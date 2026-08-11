import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, Check, Clock3, Loader2, ShieldCheck, UserX } from 'lucide-react'
import { useCommonCopy } from '@/shared/i18n'
import { getStudentAttendance } from '../api'
import type { AttendanceRecord, AttendanceStatus, StudentAttendanceResponse } from '../types'

const copy = {
  ru: { title: 'Моя посещаемость', description: 'Здесь отображаются только ваши отметки.', present: 'Присутствовал', late: 'Опоздал', absent: 'Отсутствовал', excused: 'Уважительная', lessons: 'Занятий', rate: 'Посещаемость', note: 'Комментарий преподавателя', empty: 'Отметок пока нет.', error: 'Не удалось загрузить посещаемость.' },
  ky: { title: 'Менин катышуум', description: 'Бул жерде сиздин гана белгилериңиз көрсөтүлөт.', present: 'Катышты', late: 'Кечикти', absent: 'Катышкан жок', excused: 'Себептүү', lessons: 'Сабактар', rate: 'Катышуу', note: 'Мугалимдин комментарийи', empty: 'Азырынча белгилер жок.', error: 'Катышууну жүктөө мүмкүн болгон жок.' },
  en: { title: 'My attendance', description: 'Only your own attendance records are shown here.', present: 'Present', late: 'Late', absent: 'Absent', excused: 'Excused', lessons: 'Lessons', rate: 'Attendance', note: 'Teacher note', empty: 'No attendance records yet.', error: 'Could not load attendance.' },
} as const

const statusStyle: Record<AttendanceStatus, { icon: typeof Check; className: string }> = {
  present: { icon: Check, className: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20' },
  late: { icon: Clock3, className: 'bg-amber-500/10 text-amber-300 border-amber-400/20' },
  absent: { icon: UserX, className: 'bg-rose-500/10 text-rose-300 border-rose-400/20' },
  excused: { icon: ShieldCheck, className: 'bg-sky-500/10 text-sky-300 border-sky-400/20' },
}

function extractRecords(data: StudentAttendanceResponse | AttendanceRecord[] | undefined) {
  if (!data) return []
  if (Array.isArray(data)) return data
  return data.results ?? data.records ?? []
}

export function StudentAttendancePanel({ groupId }: { groupId: number }) {
  const { language } = useCommonCopy()
  const t = copy[language]
  const query = useQuery({
    queryKey: ['student-attendance', groupId],
    queryFn: () => getStudentAttendance(groupId),
    enabled: Number.isFinite(groupId),
    retry: false,
  })
  const records = extractRecords(query.data).sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))
  const attended = records.filter((record) => record.status === 'present' || record.status === 'late').length
  const backendRate = !Array.isArray(query.data) ? query.data?.attendance_percentage : undefined
  const rate = backendRate ?? (records.length ? Math.round((attended / records.length) * 100) : 0)

  return (
    <section id="attendance" className="glass-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-white/[0.06] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-white"><CalendarCheck className="h-5 w-5 text-cyan-300" />{t.title}</h2>
          <p className="mt-1 text-sm text-white/40">{t.description}</p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-center"><p className="font-heading text-lg font-bold text-white">{records.length}</p><p className="text-[11px] text-white/35">{t.lessons}</p></div>
          <div className="rounded-xl border border-accent/15 bg-accent/[0.06] px-4 py-2 text-center"><p className="font-heading text-lg font-bold text-accent-light">{rate}%</p><p className="text-[11px] text-white/35">{t.rate}</p></div>
        </div>
      </div>
      {query.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
      ) : query.isError ? (
        <p className="px-6 py-12 text-center text-sm text-rose-300/70">{t.error}</p>
      ) : records.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-white/40">{t.empty}</p>
      ) : (
        <div className="divide-y divide-white/[0.05]">
          {records.map((record, index) => {
            const style = statusStyle[record.status] ?? statusStyle.present
            const Icon = style.icon
            return (
              <div key={record.id ?? `${record.date}-${index}`} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center">
                <div className="min-w-36 text-sm font-medium text-white/70">{record.date ? new Date(`${record.date}T00:00:00`).toLocaleDateString(language) : '—'}</div>
                <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${style.className}`}><Icon className="h-3.5 w-3.5" />{t[record.status]}</span>
                <p className="min-w-0 flex-1 text-sm text-white/40">{record.note || '—'}<span className="sr-only">{t.note}</span></p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
