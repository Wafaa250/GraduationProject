import { cn } from '@/shared/lib/cn'
import { profileImageSrc } from '@/shared/lib/profileImage'

interface UserAvatarProps {
  name: string
  imageSrc?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'size-8 text-xs',
  md: 'size-9 text-sm',
  lg: 'size-11 text-sm',
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function UserAvatar({ name, imageSrc, size = 'md', className }: UserAvatarProps) {
  const src = profileImageSrc(imageSrc)

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/90 to-glow font-semibold text-primary-foreground ring-2 ring-card',
        sizeMap[size],
        className,
      )}
      aria-hidden={!name}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  )
}
