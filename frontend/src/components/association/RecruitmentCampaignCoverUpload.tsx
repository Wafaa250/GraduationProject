import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type DragEvent,
  type HTMLAttributes,
} from 'react'
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'
import { resolveApiFileUrl } from '@/api/axiosInstance'
import { uploadRecruitmentCampaignCover } from '@/api/recruitmentCampaignsApi'
import { assocDash } from '@/pages/association/dashboard/associationDashTokens'

const ACCEPT = 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp'
const MAX_BYTES = 5 * 1024 * 1024

type Props = {
  coverImageUrl: string | null
  onCoverImageUrlChange: (url: string | null) => void
  disabled?: boolean
  variant?: 'default' | 'hero'
}

export function RecruitmentCampaignCoverUpload({
  coverImageUrl,
  onCoverImageUrlChange,
  disabled = false,
  variant = 'default',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const displayUrl = localPreview ?? (coverImageUrl ? resolveApiFileUrl(coverImageUrl) : null)

  const validateFile = (file: File): string | null => {
    if (!file.size) return 'Please select a valid image file.'
    if (file.size > MAX_BYTES) return 'Cover image must be 5MB or smaller.'
    const type = file.type.toLowerCase()
    const okType = type === 'image/png' || type === 'image/jpeg' || type === 'image/webp'
    const ext = file.name.split('.').pop()?.toLowerCase()
    const okExt = ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp'
    if (!okType && !okExt) return 'Only PNG, JPG, JPEG, and WebP images are allowed.'
    return null
  }

  const setPreviewFromFile = (file: File | null) => {
    if (localPreview) URL.revokeObjectURL(localPreview)
    setLocalPreview(file ? URL.createObjectURL(file) : null)
  }

  const handleFile = useCallback(
    async (file: File | null) => {
      setError(null)
      if (!file) return
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
      setPreviewFromFile(file)
      setUploading(true)
      setProgress(0)
      try {
        const url = await uploadRecruitmentCampaignCover(file)
        onCoverImageUrlChange(url)
        setPreviewFromFile(null)
        setProgress(100)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed.')
        setPreviewFromFile(null)
      } finally {
        setUploading(false)
      }
    },
    [onCoverImageUrlChange],
  )

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    void handleFile(e.target.files?.[0] ?? null)
    e.target.value = ''
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled || uploading) return
    void handleFile(e.dataTransfer.files?.[0] ?? null)
  }

  const clearCover = () => {
    if (localPreview) URL.revokeObjectURL(localPreview)
    setLocalPreview(null)
    setError(null)
    onCoverImageUrlChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const isHero = variant === 'hero'

  return (
    <div style={{ marginBottom: isHero ? 0 : 16 }}>
      <label
        style={{
          display: 'block',
          fontSize: isHero ? 11 : 13,
          fontWeight: isHero ? 700 : 600,
          letterSpacing: isHero ? '0.04em' : undefined,
          textTransform: isHero ? 'uppercase' : undefined,
          color: isHero ? assocDash.label : assocDash.textSecondary,
          marginBottom: 8,
        }}
      >
        Cover image {!isHero ? <span style={{ fontWeight: 400, color: assocDash.subtle }}>(optional)</span> : null}
      </label>
      <DropZone
        role="button"
        tabIndex={disabled || uploading ? -1 : 0}
        onClick={() => {
          if (!disabled && !uploading) inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled && !uploading) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{
          borderRadius: isHero ? 12 : 14,
          border: `2px dashed ${dragOver ? assocDash.accent : assocDash.accentBorder}`,
          background: dragOver ? assocDash.accentMuted : isHero ? assocDash.bg : assocDash.accentSoft,
          padding: displayUrl ? 16 : isHero ? 24 : 28,
          minHeight: isHero && !displayUrl ? 200 : undefined,
          display: isHero && !displayUrl ? 'flex' : undefined,
          flexDirection: isHero && !displayUrl ? 'column' : undefined,
          alignItems: isHero && !displayUrl ? 'center' : undefined,
          justifyContent: isHero && !displayUrl ? 'center' : undefined,
          textAlign: 'center',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          style={{ display: 'none' }}
          disabled={disabled || uploading}
          onChange={onInputChange}
        />
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Cover preview"
            style={{ width: '100%', maxHeight: isHero ? 220 : 160, objectFit: 'cover', borderRadius: 10 }}
          />
        ) : uploading ? (
          <Loader2 size={28} color={assocDash.accent} className="recruit-cover-spin" />
        ) : (
          <ImagePlus size={28} color={assocDash.accent} strokeWidth={1.8} />
        )}
        {!displayUrl && !uploading && (
          <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 600, color: assocDash.accentInk }}>
            Drag & drop or click to upload
          </p>
        )}
        {uploading && (
          <div style={{ marginTop: 12, height: 6, borderRadius: 4, background: assocDash.accentBar, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.max(progress, 8)}%`,
                background: assocDash.gradient,
              }}
            />
          </div>
        )}
      </DropZone>
      {displayUrl && !uploading && !disabled && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button type="button" onClick={() => inputRef.current?.click()} style={actionBtnStyle}>
            <Upload size={14} />
            Change
          </button>
          <button type="button" onClick={clearCover} style={{ ...actionBtnStyle, color: assocDash.error }}>
            <Trash2 size={14} />
            Remove
          </button>
        </div>
      )}
      {error && <p style={{ margin: '8px 0 0', fontSize: 12, color: assocDash.error }}>{error}</p>}
      <style>{`.recruit-cover-spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function DropZone({ style, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div style={style} {...rest}>
      {children}
    </div>
  )
}

const actionBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 12px',
  borderRadius: 8,
  border: `1px solid ${assocDash.border}`,
  background: assocDash.surface,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
