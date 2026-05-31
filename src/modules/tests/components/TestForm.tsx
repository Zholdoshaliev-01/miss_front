import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { createTest } from '../api'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface TestFormProps {
  groupId: number
  onSuccess?: () => void
}

export function TestForm({ groupId, onSuccess }: TestFormProps) {
  const queryClient = useQueryClient()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      createTest({
        group: groupId,
        title: data.title,
        description: data.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-tests', groupId] })
      toast.success('Test created successfully!')
      onSuccess?.()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || err.message || 'Failed to create test'
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
          placeholder="e.g. Midterm Exam"
          disabled={mutation.isPending}
        />
        {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-white/60">
          Description (Optional)
        </label>
        <textarea
          id="description"
          {...register('description')}
          className="input-field min-h-[80px]"
          placeholder="Instructions or topics covered..."
          disabled={mutation.isPending}
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
          'Create Test'
        )}
      </button>
    </form>
  )
}
