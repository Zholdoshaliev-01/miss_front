import { useState } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Download, FileText, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { getStudentGroups, getStudentHomeworks, submitHomeworkAnswer } from '@/modules/student/api'
import { FileUploadZone } from '@/shared/ui/FileUploadZone'

const MAX_FILE_SIZE = 100 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'doc', 'docx']
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function buildFileUrl(file?: string | null) {
  if (!file) return null
  return file.startsWith('http') ? file : `${BASE_URL}${file}`
}

function getFileName(file?: string | null) {
  if (!file) return 'assignment file'
  const clean = file.split('?')[0]
  return decodeURIComponent(clean.split('/').pop() || 'assignment file')
}

function getFileExtension(file?: string | null) {
  if (!file) return ''
  return file.split('?')[0].split('.').pop()?.toLowerCase() || ''
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return 'No deadline'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return 'No deadline'
  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function normalizeStudentGroup(raw: any) {
  return {
    id: raw.group_id ?? raw.id,
    group_name: raw.group_name ?? raw.name ?? 'Untitled group',
  }
}

function validateFile(file: File | null) {
  if (!file) return null
  if (file.size > MAX_FILE_SIZE) return 'File must be 100 MB or smaller'

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return 'Allowed formats: PDF, JPG, PNG, WEBP, GIF, DOC, DOCX'
  }

  return null
}

function getErrorMessage(err: any) {
  const data = err.response?.data
  return (
    data?.detail ||
    data?.file?.[0] ||
    data?.comment?.[0] ||
    err.message ||
    'Failed to submit homework'
  )
}

export default function HomeworkSubmitPage() {
  const { id } = useParams()
  const homeworkId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [comment, setComment] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)

  const { data: rawGroupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['student-groups'],
    queryFn: () => getStudentGroups(),
  })

  const groups = (Array.isArray(rawGroupsData)
    ? rawGroupsData
    : (rawGroupsData as any)?.results ?? []
  ).map(normalizeStudentGroup)

  const homeworkQueries = useQueries({
    queries: groups.map((group: any) => ({
      queryKey: ['student-homeworks', group.id],
      queryFn: () => getStudentHomeworks(group.id),
      enabled: Number.isFinite(homeworkId),
    })),
  })

  const homeworkRecords = homeworkQueries.flatMap((query, index) => {
    const rawHomeworks = Array.isArray(query.data)
      ? query.data
      : (query.data as any)?.results ?? []
    return rawHomeworks.map((homework: any) => ({
      ...homework,
      groupId: groups[index]?.id,
      groupName: groups[index]?.group_name,
    }))
  })

  const homework = homeworkRecords.find((item: any) => item.id === homeworkId)
  const isLoadingHomework = groupsLoading || homeworkQueries.some((query) => query.isLoading)
  const homeworkFileUrl = buildFileUrl(homework?.file)
  const homeworkFileName = getFileName(homework?.file)
  const homeworkFileExtension = getFileExtension(homework?.file)
  const isHomeworkImage = IMAGE_EXTENSIONS.includes(homeworkFileExtension)
  const backTo = homework?.groupId ? `/student/homeworks?group=${homework.groupId}` : '/student/homeworks'

  const mutation = useMutation({
    mutationFn: () => {
      if (!id) throw new Error('Homework id is missing')
      return submitHomeworkAnswer(Number(id), { file, comment })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-homeworks'] })
      toast.success('Homework submitted successfully!')
      navigate(backTo, { replace: true })
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })

  if (!Number.isFinite(homeworkId)) {
    return (
      <div className="glass-card mx-auto flex max-w-3xl flex-col items-center justify-center py-20 text-center">
        <FileText className="h-10 w-10 text-white/15" />
        <h1 className="mt-4 font-heading text-xl font-bold text-white">Homework link is invalid</h1>
        <Link to="/student/homeworks" className="btn-primary mt-6 !py-2.5">Back to Homework</Link>
      </div>
    )
  }

  if (isLoadingHomework) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!homework) {
    return (
      <div className="glass-card mx-auto flex max-w-3xl flex-col items-center justify-center py-20 text-center">
        <FileText className="h-10 w-10 text-white/15" />
        <h1 className="mt-4 font-heading text-xl font-bold text-white">Homework not found</h1>
        <p className="mt-2 max-w-sm text-sm text-white/35">
          This task is not available in your active groups.
        </p>
        <Link to="/student/homeworks" className="btn-primary mt-6 !py-2.5">Back to Homework</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70">
        <ArrowLeft className="h-4 w-4" />
        Back to Homework
      </Link>

      <div className="glass-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 shadow-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-300/70">
              Teacher Task
            </p>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
              Assignment: {homework.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/40">
              <span>{homework.groupName}</span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Due {formatDate(homework.due_date)}
              </span>
              <span className={homework.is_submitted ? 'text-emerald-300/80' : 'text-amber-300/80'}>
                {homework.is_submitted ? 'Already submitted' : 'Not submitted yet'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
            <FileText className="h-5 w-5 text-amber-300" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/70">
              What You Need To Do
            </p>
            <h2 className="mt-1 font-heading text-lg font-semibold text-white">
              {homework.title}
            </h2>
            <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/35">
                Teacher instructions
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/65">
                {homework.description || 'The teacher did not add text instructions. Check the attached file or ask your teacher.'}
              </p>
            </div>
            {homeworkFileUrl && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/35">
                  Attached file
                </p>
                {isHomeworkImage ? (
                  <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20">
                    <a href={homeworkFileUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <img
                        src={homeworkFileUrl}
                        alt={homework.title}
                        className="max-h-[420px] w-full object-contain"
                        loading="lazy"
                      />
                    </a>
                    <div className="flex flex-col gap-3 border-t border-white/[0.06] p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white/70">{homeworkFileName}</p>
                        <p className="text-xs text-white/35">Image preview</p>
                      </div>
                      <a href={homeworkFileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary shrink-0 text-sm">
                        <Download className="h-4 w-4" />
                        Download image
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.05]">
                        <FileText className="h-5 w-5 text-white/55" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white/70">{homeworkFileName}</p>
                        <p className="text-xs text-white/35">{homeworkFileExtension.toUpperCase() || 'FILE'} attachment</p>
                      </div>
                    </div>
                    <a href={homeworkFileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary shrink-0 text-sm">
                      <Download className="h-4 w-4" />
                      Download file
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <form
        className="glass-card p-6"
        onSubmit={(event) => {
          event.preventDefault()
          const validationError = validateFile(file)
          setFileError(validationError)
          if (validationError) return
          mutation.mutate()
        }}
      >
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-light/70">
            Your Submission
          </p>
          <h2 className="mt-1 font-heading text-lg font-semibold text-white">
            Upload your answer
          </h2>
          <p className="mt-1 text-sm text-white/35">
            Attach your completed work here. This file is what your teacher will review.
          </p>
        </div>

        <label className="mb-1.5 block text-sm font-medium text-white/65">Your answer file</label>
        <FileUploadZone
          value={file}
          onChange={(nextFile) => {
            setFile(nextFile)
            setFileError(validateFile(nextFile))
          }}
          disabled={mutation.isPending}
          accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx"
          label="Drop your file here"
          hint="PDF, JPG, PNG, WEBP, GIF, DOC, or DOCX. Max 100 MB"
        />
        {fileError && <p className="mt-2 text-xs text-red-400">{fileError}</p>}

        <div className="mt-6">
          <label className="mb-1.5 block text-sm font-medium text-white/65">Your comment (optional)</label>
          <textarea
            className="input-field min-h-[100px] resize-y"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Example: I completed the exercises and attached my PDF."
            disabled={mutation.isPending}
          />
        </div>

        <button type="submit" className="btn-primary mt-6 w-full !py-3" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {homework.is_submitted ? 'Update Submission' : 'Submit Homework'}
            </>
          )}
        </button>
      </form>
    </div>
  )
}
