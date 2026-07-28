import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { createMaterial } from '../api'
import { FileUploadZone } from '@/shared/ui/FileUploadZone'

const MAX_FILE_SIZE = 100 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']

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
})

type FormData = z.infer<typeof schema>

interface MaterialFormProps {
  groupId: number
  onSuccess?: () => void
}

export function MaterialForm({ groupId, onSuccess }: MaterialFormProps) {
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
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      createMaterial({
        group: groupId,
        title: data.title,
        description: data.description,
        file: data.file,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-materials', groupId] })
      toast.success('Material uploaded successfully!')
      onSuccess?.()
    },
    onError: (err: any) => {
      const data = err.response?.data
      const msg =
        data?.detail ||
        data?.file?.[0] ||
        data?.group?.[0] ||
        data?.title?.[0] ||
        err.message ||
        'Failed to upload material'
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
          placeholder="e.g. Lecture 1 Slides"
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
          placeholder="Brief description of the material..."
          disabled={mutation.isPending}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-white/60">
          File (Optional)
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
            <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
          </span>
        ) : (
          'Upload Material'
        )}
      </button>
    </form>
  )
}
