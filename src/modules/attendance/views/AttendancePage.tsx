import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCheck,
  Loader2,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { getGroups, getGroupStudents } from '@/modules/groups/api'
import { useCommonCopy } from '@/shared/i18n'
import { getAttendance, saveAttendance } from '../api'
import type { AttendanceRecord, AttendanceResponse, AttendanceStatus } from '../types'

const copy = {
  ru: {
    title: 'Журнал группы',
    description: 'Отмечайте посещаемость и быстрые оценки по дням, как в настоящей таблице.',
    group: 'Группа',
    chooseGroup: 'Выберите группу',
    search: 'Найти ученика...',
    present: 'Был',
    late: 'Опоздал',
    absent: 'Н',
    excused: 'У',
    presentLong: 'Присутствует',
    lateLong: 'Опоздал',
    absentLong: 'Отсутствует',
    excusedLong: 'Уважительная',
    score: 'Оценка',
    allPresent: 'Всех отметить',
    saved: 'Журнал сохранён',
    loadError: 'Не удалось загрузить журнал. Можно заполнить заново.',
    saveError: 'Не удалось сохранить отметку',
    noGroups: 'Сначала создайте группу.',
    noStudents: 'В этой группе пока нет учеников.',
    nothingFound: 'По вашему запросу ничего не найдено.',
    total: 'Всего',
    marked: 'Отмечено',
    avgScore: 'Средний балл',
    attendanceRate: 'Посещаемость',
    prev: 'Пред.',
    next: 'След.',
    today: 'Сегодня',
    number: '№',
    student: 'Ученик',
    attendance: 'Посещ.',
    average: 'Ср. балл',
    notePlaceholder: 'Комментарий',
    autoSave: 'Изменения сохраняются сразу после выбора ячейки.',
    selectCell: 'Выберите ячейку в таблице, чтобы поставить оценку или отметить посещение.',
    selectedCell: 'Выбрана ячейка',
    chooseScore: 'Поставить оценку',
    chooseAttendance: 'Отметить посещение',
    clickCellHint: 'Нажмите на день напротив ученика',
    willSaveInstantly: 'Сохранится сразу после выбора',
  },
  ky: {
    title: 'Топ журналы',
    description: 'Күндөр боюнча катышууну жана тез бааларды белгилеңиз.',
    group: 'Топ',
    chooseGroup: 'Топту тандаңыз',
    search: 'Окуучуну издөө...',
    present: 'Болду',
    late: 'Кеч',
    absent: 'Ж',
    excused: 'С',
    presentLong: 'Катышты',
    lateLong: 'Кечикти',
    absentLong: 'Катышкан жок',
    excusedLong: 'Себептүү',
    score: 'Баа',
    allPresent: 'Баарын белгилөө',
    saved: 'Журнал сакталды',
    loadError: 'Журнал жүктөлгөн жок. Кайра толтурсаңыз болот.',
    saveError: 'Белгини сактоо мүмкүн болгон жок',
    noGroups: 'Алгач топ түзүңүз.',
    noStudents: 'Бул топто азырынча окуучулар жок.',
    nothingFound: 'Суроо боюнча эч нерсе табылган жок.',
    total: 'Баары',
    marked: 'Белгиленди',
    avgScore: 'Орточо баа',
    attendanceRate: 'Катышуу',
    prev: 'Артка',
    next: 'Алга',
    today: 'Бүгүн',
    number: '№',
    student: 'Окуучу',
    attendance: 'Катыш.',
    average: 'Ор. баа',
    notePlaceholder: 'Комментарий',
    autoSave: 'Өзгөрүүлөр ячейка тандалганда дароо сакталат.',
    selectCell: 'Баа коюу же катышууну белгилөө үчүн таблицадан ячейка тандаңыз.',
    selectedCell: 'Ячейка тандалды',
    chooseScore: 'Баа коюу',
    chooseAttendance: 'Катышууну белгилөө',
    clickCellHint: 'Окуучунун тушундагы күндү басыңыз',
    willSaveInstantly: 'Тандаганда дароо сакталат',
  },
  en: {
    title: 'Group Gradebook',
    description: 'Track attendance and quick lesson scores in a clean monthly grid.',
    group: 'Group',
    chooseGroup: 'Choose a group',
    search: 'Find a student...',
    present: 'In',
    late: 'Late',
    absent: 'A',
    excused: 'E',
    presentLong: 'Present',
    lateLong: 'Late',
    absentLong: 'Absent',
    excusedLong: 'Excused',
    score: 'Score',
    allPresent: 'Mark all present',
    saved: 'Gradebook saved',
    loadError: 'Could not load the gradebook. You can fill it again.',
    saveError: 'Could not save the mark',
    noGroups: 'Create a group first.',
    noStudents: 'There are no students in this group yet.',
    nothingFound: 'No students match your search.',
    total: 'Total',
    marked: 'Marked',
    avgScore: 'Avg score',
    attendanceRate: 'Attendance',
    prev: 'Prev',
    next: 'Next',
    today: 'Today',
    number: 'No.',
    student: 'Student',
    attendance: 'Attend.',
    average: 'Average',
    notePlaceholder: 'Note',
    autoSave: 'Changes are saved immediately after choosing a cell value.',
    selectCell: 'Select a table cell to add a score or mark attendance.',
    selectedCell: 'Selected cell',
    chooseScore: 'Give a score',
    chooseAttendance: 'Mark attendance',
    clickCellHint: 'Click a day next to a student',
    willSaveInstantly: 'Saved immediately after selection',
  },
} as const

type CellChoice =
  | { kind: 'score'; label: string; score: number; className: string }
  | { kind: 'status'; label: string; status: AttendanceStatus; score?: null; className: string }

const cellChoices: CellChoice[] = [
  { kind: 'score', label: '5', score: 5, className: 'bg-emerald-400/90 text-emerald-950' },
  { kind: 'score', label: '4', score: 4, className: 'bg-amber-300/90 text-amber-950' },
  { kind: 'score', label: '3', score: 3, className: 'bg-orange-400/90 text-orange-950' },
  { kind: 'score', label: '2', score: 2, className: 'bg-rose-500/90 text-white' },
  { kind: 'status', label: '✓', status: 'present', className: 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30' },
  { kind: 'status', label: 'О', status: 'late', className: 'bg-yellow-500/20 text-yellow-200 ring-1 ring-yellow-400/30' },
  { kind: 'status', label: 'Н', status: 'absent', className: 'bg-rose-500/85 text-white' },
  { kind: 'status', label: 'У', status: 'excused', className: 'bg-sky-500/20 text-sky-200 ring-1 ring-sky-400/30' },
]

function todayInputValue() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

function monthInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 7)
}

function recordsFromResponse(data: AttendanceResponse | AttendanceRecord[] | undefined) {
  if (!data) return []
  if (Array.isArray(data)) return data
  return data.records ?? data.results ?? []
}

function errorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback
  const body = error.response?.data as { detail?: string; error?: string } | undefined
  return body?.detail ?? body?.error ?? fallback
}

function getMonthDays(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const daysCount = new Date(year, monthNumber, 0).getDate()
  return Array.from({ length: daysCount }, (_, index) => {
    const date = new Date(year, monthNumber - 1, index + 1)
    const value = `${year}-${String(monthNumber).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`
    return {
      value,
      day: String(index + 1).padStart(2, '0'),
      weekDay: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
      isToday: value === todayInputValue(),
      isWeekend: [0, 6].includes(date.getDay()),
    }
  })
}

function formatMonthTitle(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(year, monthNumber - 1, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
}

function moveMonth(month: string, direction: -1 | 1) {
  const [year, monthNumber] = month.split('-').map(Number)
  return monthInputValue(new Date(year, monthNumber - 1 + direction, 1))
}

function cellKey(date: string, studentId: number) {
  return `${date}:${studentId}`
}

function normalizeRecord(record: AttendanceRecord) {
  const raw = record as AttendanceRecord & { student?: number | { id?: number } }
  const studentId = raw.student_id ?? (typeof raw.student === 'number' ? raw.student : raw.student?.id)
  const rawScore = (record as { score?: unknown }).score
  const score = rawScore === undefined || rawScore === null || rawScore === '' ? null : Number(rawScore)
  return studentId && raw.date
    ? { ...record, student_id: studentId, score: Number.isFinite(score) ? score : null, note: record.note ?? '' }
    : null
}

export default function AttendancePage({ groupId: fixedGroupId }: { groupId?: number }) {
  const queryClient = useQueryClient()
  const { language } = useCommonCopy()
  const t = copy[language]
  const embedded = fixedGroupId !== undefined
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const groupId = fixedGroupId ?? selectedGroupId
  const [month, setMonth] = useState(monthInputValue)
  const [search, setSearch] = useState('')
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({})
  const [editingCell, setEditingCell] = useState<{ date: string; studentId: number } | null>(null)

  const groupsQuery = useQuery({
    queryKey: ['groups', 'attendance'],
    queryFn: () => getGroups(),
    enabled: !embedded,
  })
  const groups = groupsQuery.data?.results ?? []

  useEffect(() => {
    if (!embedded && selectedGroupId === null && groups.length > 0) setSelectedGroupId(groups[0].id)
  }, [embedded, selectedGroupId, groups])

  const studentsQuery = useQuery({
    queryKey: ['group-students', groupId],
    queryFn: () => getGroupStudents(groupId as number),
    enabled: groupId !== null,
  })
  const students = studentsQuery.data?.results ?? []

  const attendanceQuery = useQuery({
    queryKey: ['attendance', groupId, month],
    queryFn: () => getAttendance(groupId as number, undefined, month),
    enabled: groupId !== null,
    retry: false,
  })

  useEffect(() => {
    const next: Record<string, AttendanceRecord> = {}
    for (const record of recordsFromResponse(attendanceQuery.data)) {
      const normalized = normalizeRecord(record)
      if (normalized?.date) next[cellKey(normalized.date, normalized.student_id)] = normalized
    }
    setRecords(next)
  }, [attendanceQuery.data, groupId, month])

  const days = useMemo(() => getMonthDays(month), [month])
  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return students
    return students.filter((student) => `${student.full_name} ${student.email}`.toLowerCase().includes(query))
  }, [search, students])

  const markedCount = Object.values(records).filter((record) => record.status).length
  const presentCount = Object.values(records).filter((record) => record.status === 'present' || record.status === 'late').length
  const scores = Object.values(records).map((record) => record.score).filter((score): score is number => typeof score === 'number')
  const avgScore = scores.length ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) : '—'
  const attendanceRate = markedCount ? Math.round((presentCount / markedCount) * 100) : 0
  const isLoading = groupsQuery.isLoading || studentsQuery.isLoading || attendanceQuery.isFetching

  const saveMutation = useMutation({
    mutationFn: ({ date, records: nextRecords }: { date: string; records: AttendanceRecord[] }) => {
      if (groupId === null) throw new Error(t.chooseGroup)
      return saveAttendance(groupId, { date, records: nextRecords })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', groupId, month] })
      queryClient.invalidateQueries({ queryKey: ['student-attendance', groupId] })
      toast.success(`${t.saved}: ${variables.date}`)
    },
    onError: (error) => toast.error(errorMessage(error, t.saveError)),
  })

  const applyChoice = (date: string, studentId: number, choice: CellChoice) => {
    const nextRecord: AttendanceRecord = {
      student_id: studentId,
      date,
      status: choice.kind === 'score' ? 'present' : choice.status,
      score: choice.kind === 'score' ? choice.score : null,
      note: records[cellKey(date, studentId)]?.note ?? '',
    }
    setRecords((current) => ({ ...current, [cellKey(date, studentId)]: nextRecord }))
    saveMutation.mutate({ date, records: [nextRecord] })
  }

  const markVisibleToday = () => {
    const date = todayInputValue().slice(0, 7) === month ? todayInputValue() : days[0]?.value
    if (!date) return
    const nextRecords = filteredStudents.map((student) => ({
      student_id: student.id,
      date,
      status: 'present' as const,
      score: null,
      note: records[cellKey(date, student.id)]?.note ?? '',
    }))
    setRecords((current) => ({
      ...current,
      ...Object.fromEntries(nextRecords.map((record) => [cellKey(date, record.student_id), record])),
    }))
    saveMutation.mutate({ date, records: nextRecords })
  }

  const selectedStudent = editingCell ? students.find((student) => student.id === editingCell.studentId) : undefined
  const selectedDay = editingCell ? days.find((day) => day.value === editingCell.date) : undefined
  const selectedRecord = editingCell ? records[cellKey(editingCell.date, editingCell.studentId)] : undefined

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-cyan-400 text-white shadow-lg shadow-accent/20">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-200/60">{formatMonthTitle(month)}</p>
          <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight text-white">{t.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/45">{t.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-secondary text-sm" onClick={() => setMonth(moveMonth(month, -1))}>
            <ChevronLeft className="h-4 w-4" /> {t.prev}
          </button>
          <input className="input-field w-[170px] !py-2.5 text-sm" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          <button type="button" className="btn-secondary text-sm" onClick={() => setMonth(monthInputValue())}>{t.today}</button>
          <button type="button" className="btn-secondary text-sm" onClick={() => setMonth(moveMonth(month, 1))}>
            {t.next} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className={`grid gap-4 ${embedded ? 'xl:grid-cols-4' : 'xl:grid-cols-5'}`}>
        {!embedded && (
          <label className="glass-card space-y-2 p-4 text-sm font-medium text-white/60 xl:col-span-1">
            <span>{t.group}</span>
            <select
              className="input-field !py-2.5"
              value={groupId ?? ''}
              onChange={(event) => { setSelectedGroupId(event.target.value ? Number(event.target.value) : null); setSearch('') }}
            >
              <option value="">{t.chooseGroup}</option>
              {groups.map((group) => <option key={group.id} value={group.id}>{group.group_name}</option>)}
            </select>
          </label>
        )}
        <Stat label={t.total} value={students.length} icon={Users} tone="text-white/55" />
        <Stat label={t.marked} value={markedCount} icon={CalendarCheck} tone="text-accent-light" />
        <Stat label={t.attendanceRate} value={`${attendanceRate}%`} icon={CheckCheck} tone="text-emerald-300" />
        <Stat label={t.avgScore} value={avgScore} icon={Sparkles} tone="text-amber-300" />
      </div>

      {!embedded && groupsQuery.isSuccess && groups.length === 0 ? (
        <Empty icon={Users} text={t.noGroups} />
      ) : groupId !== null && (
        <section className="glass-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
              <input className="input-field !pl-10" placeholder={t.search} value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Legend label="5" className="bg-emerald-400/90 text-emerald-950" text={t.score} />
              <Legend label={language === 'en' ? 'A' : 'Н'} className="bg-rose-500/85 text-white" text={t.absentLong} />
              <Legend label={language === 'en' ? 'E' : 'У'} className="bg-sky-500/20 text-sky-200 ring-1 ring-sky-400/30" text={t.excusedLong} />
              <button
                type="button"
                className="btn-secondary ml-0 text-sm xl:ml-3"
                disabled={filteredStudents.length === 0 || saveMutation.isPending}
                onClick={markVisibleToday}
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-emerald-300" />}
                {t.allPresent}
              </button>
            </div>
          </div>

          <div className="border-b border-white/[0.06] bg-gradient-to-r from-white/[0.045] via-accent/[0.06] to-transparent p-4">
            {editingCell && selectedStudent && selectedDay ? (
              <div className="grid gap-4 xl:grid-cols-[minmax(240px,0.9fr)_minmax(320px,1.1fr)_minmax(360px,1.4fr)] xl:items-center">
                <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent-light/70">{t.selectedCell}</p>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-lg leading-none text-white/45 transition hover:bg-white/10 hover:text-white"
                      onClick={() => setEditingCell(null)}
                      aria-label="Close selected cell"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/25 font-heading text-base font-bold text-accent-light">
                      {(selectedStudent.full_name || selectedStudent.email || '?').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-heading text-lg font-bold text-white">{selectedStudent.full_name || t.student}</p>
                      <p className="text-sm text-white/45">{selectedDay.day} • {selectedDay.weekDay} • {editingCell.date}</p>
                    </div>
                  </div>
                </div>

                <MarkChoiceGroup
                  title={t.chooseScore}
                  hint={t.willSaveInstantly}
                  choices={cellChoices.filter((choice) => choice.kind === 'score')}
                  selectedRecord={selectedRecord}
                  language={language}
                  onChoose={(choice) => applyChoice(editingCell.date, editingCell.studentId, choice)}
                />

                <MarkChoiceGroup
                  title={t.chooseAttendance}
                  hint={`${t.presentLong} / ${t.lateLong} / ${t.absentLong} / ${t.excusedLong}`}
                  choices={cellChoices.filter((choice) => choice.kind === 'status')}
                  selectedRecord={selectedRecord}
                  language={language}
                  onChoose={(choice) => applyChoice(editingCell.date, editingCell.studentId, choice)}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-white/10 bg-black/10 p-5 text-white/50 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-heading text-lg font-semibold text-white/75">{t.selectCell}</p>
                  <p className="mt-1 text-sm text-white/40">{t.clickCellHint}</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-accent-light">
                  <CalendarCheck className="h-4 w-4" />
                  {formatMonthTitle(month)}
                </div>
              </div>
            )}
          </div>

          {attendanceQuery.isError && (
            <div className="mx-4 mt-4 rounded-xl border border-amber-400/20 bg-amber-500/[0.07] px-4 py-3 text-sm text-amber-200/80">
              {errorMessage(attendanceQuery.error, t.loadError)}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
          ) : students.length === 0 ? (
            <Empty icon={Users} text={t.noStudents} plain />
          ) : filteredStudents.length === 0 ? (
            <Empty icon={Search} text={t.nothingFound} plain />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1180px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.025] text-xs uppercase tracking-[0.16em] text-white/38">
                    <th className="sticky left-0 z-20 w-16 bg-[#111725] px-4 py-3">{t.number}</th>
                    <th className="sticky left-16 z-20 w-64 bg-[#111725] px-4 py-3">{t.student}</th>
                    <th className="w-24 px-3 py-3 text-center">{t.attendance}</th>
                    <th className="w-24 px-3 py-3 text-center">{t.average}</th>
                    {days.map((day) => (
                      <th key={day.value} className={`min-w-[70px] px-2 py-3 text-center ${day.isToday ? 'bg-accent/15 text-accent-light' : day.isWeekend ? 'bg-white/[0.025]' : ''}`}>
                        <span className="block font-heading text-base text-white/80">{day.day}</span>
                        <span className="mt-0.5 block text-[10px] normal-case tracking-normal text-white/35">{day.weekDay}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => {
                    const studentRecords = days.map((day) => records[cellKey(day.value, student.id)]).filter(Boolean)
                    const studentPresent = studentRecords.filter((record) => record.status === 'present' || record.status === 'late').length
                    const studentScores = studentRecords.map((record) => record.score).filter((score): score is number => typeof score === 'number')
                    const studentAvg = studentScores.length ? (studentScores.reduce((sum, score) => sum + score, 0) / studentScores.length).toFixed(1) : '—'
                    return (
                      <tr key={student.id} className="group border-b border-white/[0.045] hover:bg-white/[0.025]">
                        <td className="sticky left-0 z-10 bg-[#0f1422] px-4 py-3 text-sm font-semibold text-white/40 group-hover:bg-[#12192a]">{index + 1}</td>
                        <td className="sticky left-16 z-10 bg-[#0f1422] px-4 py-3 group-hover:bg-[#12192a]">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/20 font-heading text-sm font-bold text-accent-light">
                              {(student.full_name || student.email || '?').slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white/85">{student.full_name || t.student}</p>
                              <p className="truncate text-xs text-white/35">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center font-heading text-lg font-bold text-white/70">{studentPresent}</td>
                        <td className="px-3 py-3 text-center font-heading text-lg font-bold text-cyan-200">{studentAvg}</td>
                        {days.map((day) => {
                          const record = records[cellKey(day.value, student.id)]
                          const label = getCellLabel(record, language)
                          const className = getCellClass(record)
                          const isOpen = editingCell?.date === day.value && editingCell.studentId === student.id
                          return (
                            <td key={day.value} className={`relative px-1.5 py-2 text-center ${day.isToday ? 'bg-accent/[0.06]' : day.isWeekend ? 'bg-white/[0.018]' : ''}`}>
                              <button
                                type="button"
                                className={`mx-auto flex h-10 w-12 items-center justify-center rounded-lg text-sm font-black transition hover:scale-105 ${isOpen ? 'ring-2 ring-accent-light ring-offset-2 ring-offset-[#0f1422]' : ''} ${className}`}
                                onClick={() => setEditingCell(isOpen ? null : { date: day.value, studentId: student.id })}
                                title={`${student.full_name} • ${day.value}`}
                              >
                                {label}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-white/[0.06] px-4 py-3 text-sm text-white/45">
            {t.autoSave}
          </div>
        </section>
      )}
    </div>
  )
}

function getCellLabel(record: AttendanceRecord | undefined, language: keyof typeof copy) {
  if (!record) return ''
  if (typeof record.score === 'number') return String(record.score)
  if (record.status === 'present') return '✓'
  if (record.status === 'late') return language === 'en' ? 'L' : 'О'
  if (record.status === 'absent') return language === 'en' ? 'A' : 'Н'
  return language === 'en' ? 'E' : 'У'
}

function getCellClass(record: AttendanceRecord | undefined) {
  if (!record) return 'border border-white/[0.06] bg-white/[0.025] text-white/20 hover:bg-white/[0.06]'
  if (record.score === 5) return 'bg-emerald-400/90 text-emerald-950 shadow-lg shadow-emerald-500/10'
  if (record.score === 4) return 'bg-amber-300/90 text-amber-950'
  if (record.score === 3) return 'bg-orange-400/90 text-orange-950'
  if (record.score === 2) return 'bg-rose-500/90 text-white'
  if (record.status === 'present') return 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30'
  if (record.status === 'late') return 'bg-yellow-500/20 text-yellow-200 ring-1 ring-yellow-400/30'
  if (record.status === 'absent') return 'bg-rose-500/85 text-white'
  return 'bg-sky-500/20 text-sky-200 ring-1 ring-sky-400/30'
}

function getChoiceLabel(choice: CellChoice, language: keyof typeof copy) {
  if (choice.kind === 'status' && choice.status === 'absent' && language === 'en') return 'A'
  if (choice.kind === 'status' && choice.status === 'excused' && language === 'en') return 'E'
  return choice.label
}

function getChoiceText(choice: CellChoice, language: keyof typeof copy) {
  if (choice.kind === 'score') return `${copy[language].score} ${choice.score}`
  if (choice.status === 'present') return copy[language].presentLong
  if (choice.status === 'late') return copy[language].lateLong
  if (choice.status === 'absent') return copy[language].absentLong
  return copy[language].excusedLong
}

function isChoiceSelected(record: AttendanceRecord | undefined, choice: CellChoice) {
  if (!record) return false
  if (choice.kind === 'score') return record.score === choice.score
  return record.status === choice.status && record.score == null
}

function MarkChoiceGroup({
  title,
  hint,
  choices,
  selectedRecord,
  language,
  onChoose,
}: {
  title: string
  hint: string
  choices: CellChoice[]
  selectedRecord?: AttendanceRecord
  language: keyof typeof copy
  onChoose: (choice: CellChoice) => void
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-heading text-base font-bold text-white">{title}</p>
          <p className="mt-0.5 text-xs text-white/35">{hint}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {choices.map((choice) => {
          const selected = isChoiceSelected(selectedRecord, choice)
          return (
            <button
              key={`${choice.kind}-${choice.label}`}
              type="button"
              className={`group rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06] ${selected ? 'border-accent-light/60 bg-accent/15 shadow-lg shadow-accent/10' : 'border-white/10 bg-white/[0.03]'}`}
              onClick={() => onChoose(choice)}
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl font-heading text-base font-black ${choice.className}`}>
                {getChoiceLabel(choice, language)}
              </span>
              <span className="mt-2 block text-xs font-semibold text-white/65">{getChoiceText(choice, language)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: number | string; icon: typeof Users; tone: string }) {
  return (
    <div className="glass-card p-4">
      <Icon className={`h-5 w-5 ${tone}`} />
      <p className="mt-3 font-heading text-2xl font-bold text-white">{value}</p>
      <p className="mt-0.5 truncate text-xs text-white/40">{label}</p>
    </div>
  )
}

function Legend({ label, text, className }: { label: string; text: string; className: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.035] px-3 py-2">
      <span className={`flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-xs font-black ${className}`}>{label}</span>
      <span className="text-xs font-semibold text-white/45">{text}</span>
    </div>
  )
}

function Empty({ icon: Icon, text, plain = false }: { icon: typeof Users; text: string; plain?: boolean }) {
  return (
    <div className={`${plain ? '' : 'glass-card'} flex flex-col items-center justify-center py-16 text-center`}>
      <Icon className="h-9 w-9 text-white/15" />
      <p className="mt-3 text-sm text-white/45">{text}</p>
    </div>
  )
}
