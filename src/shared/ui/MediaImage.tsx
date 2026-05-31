import { cn } from '@/shared/utils/cn'
import { buildMediaUrl } from '@/shared/utils/buildMediaUrl'

interface MediaImageProps {
  src: string
  alt: string
  className?: string
}

export function MediaImage({ src, alt, className }: MediaImageProps) {
  const url = buildMediaUrl(src)
  if (!url) return null
  return <img src={url} alt={alt} className={cn('object-cover', className)} loading="lazy" />
}
