import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { createHomework } from '../api'
import { FileUploadZone } from '@/shared/ui/FileUploadZone'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  file: z.instanceof(File).optional().nullable(),
  due_date: z.string().optional(),
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

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      createHomework({
        group: groupId,
        title: data.title,
        description: data.description,
        file: data.file,
        due_date: data.due_date || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-homeworks', groupId] })
      toast.success('Homework created successfully!')
      onSuccess?.()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || err.message || 'Failed to create homework'
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
        <input
          id="due_date"
          type="datetime-local"
          {...register('due_date')}
          className="input-field"
          disabled={mutation.isPending}
        />
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
              accept="*/*"
              label="Drop your file here"
              hint="Any file format, max 50MB"
            />
          )}
        />
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
