import { useRef } from 'react'
import { UploadCloud, User } from 'lucide-react'
import { cn } from '@/components/ui/utils'

type Props = {
  preview: string | null
  onFile: (file: File) => void
  label?: string
  hint?: string
  className?: string
}

export function ProfilePhotoUpload({
  preview,
  onFile,
  label = 'Profile photo',
  hint = 'Optional · JPG or PNG',
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className={cn('space-y-2', className)}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 p-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full bg-background overflow-hidden ring-2 ring-border hover:ring-primary/40 transition"
        >
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="h-8 w-8 text-muted-foreground" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{hint}</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 hover:bg-primary/15 transition"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            {preview ? 'Replace photo' : 'Upload photo'}
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
          }}
        />
      </div>
    </div>
  )
}
