import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Download, Calendar, FileType, Loader2 } from 'lucide-react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { getMaterialDetail } from '@/modules/materials/api'
import { useCommonCopy } from '@/shared/i18n'
import { buildMediaUrl } from '@/shared/utils/buildMediaUrl'

function buildFileUrl(file?: string | null) {
  return file ? buildMediaUrl(file) : null
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function isImageFile(fileUrl: string) {
  return /\.(png|jpe?g|webp|gif)$/i.test(fileUrl.split('?')[0] ?? '')
}

function getFileName(fileUrl: string) {
  const cleanUrl = fileUrl.split('?')[0] ?? fileUrl
  return decodeURIComponent(cleanUrl.split('/').pop() || 'file')
}

export default function MaterialDetailPage() {
  const { t } = useCommonCopy()
  const { id } = useParams()
  const location = useLocation()
  const materialId = Number(id)
  const isStudentView = location.pathname.startsWith('/student/')

  const { data: material, isLoading } = useQuery({
    queryKey: ['material', materialId],
    queryFn: () => getMaterialDetail(materialId),
    enabled: Number.isFinite(materialId),
  })

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!material) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="h-10 w-10 text-white/15" />
        <h1 className="mt-4 font-heading text-xl font-bold text-white">{t.materialNotFound}</h1>
        <Link to={isStudentView ? '/student/materials' : '/groups'} className="btn-primary mt-6 !py-2.5">
          {isStudentView ? t.backToMaterials : t.backToGroups}
        </Link>
      </div>
    )
  }

  const fileUrl = buildFileUrl(material.file)
  const uploadedDate = formatDate(material.created_at)
  const isImage = fileUrl ? isImageFile(fileUrl) : false
  const backTo = isStudentView ? `/student/materials?group=${material.group}` : `/groups/${material.group}`

  return (
    <div className="space-y-6">
      <div>
        <Link to={backTo} className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70">
          <ArrowLeft className="h-4 w-4" />
          {isStudentView ? t.backToMaterials : t.backToGroup}
        </Link>
        <PageHeader
          title={material.title}
          description={uploadedDate ? `${t.uploaded} ${uploadedDate}` : t.material}
          actions={
            fileUrl ? (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
                <Download className="h-4 w-4" />
                {t.download}
              </a>
            ) : null
          }
        />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-400 shadow-lg" style={{ boxShadow: '0 8px 24px rgba(16,185,129,0.15)' }}>
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-xl font-bold text-white">{material.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/45">
                {material.description || t.noDescriptionYet}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-white/[0.06] pt-5">
            {uploadedDate && (
              <div className="flex items-center gap-2 text-sm text-white/35">
                <Calendar className="h-4 w-4" />
                <span>{uploadedDate}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-white/35">
              <FileType className="h-4 w-4" />
              <span>{fileUrl ? getFileName(fileUrl) : t.noFile}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="mb-4 font-heading text-sm font-semibold text-white/60">{t.filePreview}</h3>
        {!fileUrl ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.01] py-16 text-center">
            <FileType className="h-10 w-10 text-white/15" />
            <p className="mt-4 text-sm font-medium text-white/40">{t.noFile}</p>
          </div>
        ) : isImage ? (
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20">
            <img src={fileUrl} alt={material.title} className="max-h-[640px] w-full object-contain" />
            <div className="flex justify-end border-t border-white/[0.06] p-4">
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
                <Download className="h-4 w-4" />
                {t.downloadImage}
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.01] py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04]">
              <FileType className="h-8 w-8 text-white/15" />
            </div>
            <p className="mt-4 text-sm font-medium text-white/40">{t.fileAttachment}</p>
            <p className="mt-1 text-xs text-white/25">{getFileName(fileUrl)}</p>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-5 text-sm">
              <Download className="h-4 w-4" />
              {t.downloadFile}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
