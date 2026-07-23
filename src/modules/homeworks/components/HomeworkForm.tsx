import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CalendarDays, Loader2 } from 'lucide-react'
import { createHomework } from '../api'
import { FileUploadZone } from '@/shared/ui/FileUploadZone'

const MAX_FILE_SIZE = 100 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function toDateValue(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  file: z.instanceof(File)
    .optional()
    .nullable()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, 'File must be 100 MB or smaller')
    .refine((file) => {
      if (!file) return true
      const extension = file.name.split('.').pop()?.toLowerCase()
      return extension ? ALLOWED_EXTENSIONS.includes(extension) : false
    }, 'Allowed formats: PDF, JPG, PNG, DOC, DOCX'),
  due_date: z.string().optional().refine((value) => !value || DATE_RE.test(value), {
    message: 'Use format YYYY-MM-DD',
  }),
})

type FormData = z.infer<typeof schema>

interface HomeworkFormProps {
  groupId: number
  onSuccess?: () => void
}

export function HomeworkForm({ groupId, onSuccess }: HomeworkFormProps) {
  const queryClient = useQueryClient()
  
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      file: null,
      due_date: '',
    },
  })
  const dueDate = watch('due_date')

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      createHomework({
        group: groupId,
        title: data.title,
        description: data.description,
        file: data.file,
        due_date: data.due_date ? data.due_date.slice(0, 10) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-homeworks', groupId] })
      toast.success('Homework created successfully!')
      onSuccess?.()
    },
    onError: (err: any) => {
      const data = err.response?.data
      const msg =
        data?.detail ||
        data?.file?.[0] ||
        data?.due_date?.[0] ||
        data?.group?.[0] ||
        data?.title?.[0] ||
        err.message ||
        'Failed to create homework'
      toast.error(msg)
    },
  })

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-white/60">
          Title
        </label>
        <input
          id="title"
          {...register('title')}
          className="input-field"
          placeholder="e.g. Chapter 1 Exercises"
          disabled={mutation.isPending}
        />
        {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-white/60">
          Instructions (Optional)
        </label>
        <textarea
          id="description"
          {...register('description')}
          className="input-field min-h-[80px]"
          placeholder="Detailed instructions for the students..."
          disabled={mutation.isPending}
        />
      </div>

      <div>
        <label htmlFor="due_date" className="mb-1.5 block text-sm font-medium text-white/60">
          Due Date (Optional)
        </label>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              id="due_date"
              type="text"
              inputMode="numeric"
              {...register('due_date')}
              className="input-field input-with-icon !rounded-lg !bg-black/15"
              placeholder="YYYY-MM-DD"
              disabled={mutation.isPending}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ['Today', 0],
              ['Tomorrow', 1],
              ['Next week', 7],
            ].map(([label, days]) => (
              <button
                key={label}
                type="button"
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  dueDate === toDateValue(Number(days))
                    ? 'border-accent/60 bg-accent/20 text-white'
                    : 'border-white/[0.08] bg-white/[0.03] text-white/55 hover:border-accent/30 hover:text-white/80'
                }`}
                disabled={mutation.isPending}
                onClick={() => setValue('due_date', toDateValue(Number(days)), { shouldValidate: true })}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/45 transition hover:border-white/15 hover:text-white/70"
              disabled={mutation.isPending}
              onClick={() => setValue('due_date', '', { shouldValidate: true })}
            >
              Clear
            </button>
          </div>
        </div>
        {errors.due_date && <p className="mt-1 text-xs text-red-400">{errors.due_date.message}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-white/60">
          Attachment (Optional)
        </label>
        <Controller
          control={control}
          name="file"
          render={({ field }) => (
            <FileUploadZone
              value={field.value ?? null}
              onChange={field.onChange}
              disabled={mutation.isPending}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              label="Drop your file here"
              hint="PDF, JPG, PNG, DOC, or DOCX. Max 100 MB"
            />
          )}
        />
        {errors.file && <p className="mt-1 text-xs text-red-400">{errors.file.message}</p>}
      </div>

      <button
        type="submit"
        className="btn-primary mt-6 w-full"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Creating...
          </span>
        ) : (
          'Create Homework'
        )}
      </button>
    </form>
  )
}
