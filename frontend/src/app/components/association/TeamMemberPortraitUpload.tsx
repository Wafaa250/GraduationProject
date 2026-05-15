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
import { resolveApiFileUrl } from '../../../api/axiosInstance'
import { assocDash } from '../../pages/association/dashboard/associationDashTokens'

const ACCEPT = 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp'
const MAX_BYTES = 5 * 1024 * 1024

export type TeamMemberPortraitUploadProps = {
  imageUrl: string | null
  onImageUrlChange: (url: string | null) => void
  onUpload?: (file: File, onProgress?: (pct: number) => void) => Promise<string>
  disabled?: boolean
}

export function TeamMemberPortraitUpload({
  imageUrl,
  onImageUrlChange,
  onUpload,
  disabled = false,
}: TeamMemberPortraitUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const displayUrl = localPreview ?? (imageUrl ? resolveApiFileUrl(imageUrl) : null)

  const validateFile = (file: File): string | null => {
    if (!file.size) return 'Please select a valid image file.'
    if (file.size > MAX_BYTES) return 'Image must be 5MB or smaller.'
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
      if (!file || !onUpload) return

      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      setPreviewFromFile(file)
      setUploading(true)
      setProgress(0)
      try {
        const url = await onUpload(file, setProgress)
        onImageUrlChange(url)
        setPreviewFromFile(null)
        setProgress(100)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed.')
        setPreviewFromFile(null)
      } finally {
        setUploading(false)
      }
    },
    [onUpload, onImageUrlChange],
  )

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    void handleFile(file)
    e.target.value = ''
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled || uploading) return
    void handleFile(e.dataTransfer.files?.[0] ?? null)
  }

  const clearImage = () => {
    if (localPreview) URL.revokeObjectURL(localPreview)
    setLocalPreview(null)
    setError(null)
    onImageUrlChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div style={{ marginBottom: 4 }}>
      <DropZone
        role="button"
        tabIndex={disabled || uploading || !onUpload ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!disabled && !uploading && onUpload) inputRef.current?.click()
          }
        }}
        onClick={() => {
          if (!disabled && !uploading && onUpload) inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled && !uploading && onUpload) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{
          borderRadius: 14,
          border: `2px dashed ${dragOver ? assocDash.accent : assocDash.accentBorder}`,
          background: dragOver ? assocDash.accentMuted : '#fffbeb',
          padding: displayUrl ? 16 : 22,
          textAlign: 'center',
          cursor: disabled || uploading || !onUpload ? 'default' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'border-color 0.2s, background 0.2s',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          style={{ display: 'none' }}
          disabled={disabled || uploading || !onUpload}
          onChange={onInputChange}
        />

        {displayUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <img
              src={displayUrl}
              alt="Portrait preview"
              style={{
                width: 88,
                height: 88,
                objectFit: 'cover',
                borderRadius: '50%',
                border: `2px solid ${assocDash.border}`,
                background: '#fff',
              }}
            />
            {onUpload && !disabled && !uploading && (
              <p style={{ margin: 0, fontSize: 12, color: assocDash.muted }}>Click or drag to replace portrait</p>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {uploading ? (
              <Loader2 size={26} color={assocDash.accent} className="team-portrait-spin" />
            ) : (
              <ImagePlus size={26} color={assocDash.accent} strokeWidth={1.8} />
            )}
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#92400e' }}>
              {uploading ? 'Uploading…' : onUpload ? 'Upload portrait (optional)' : 'No portrait'}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: assocDash.muted }}>
              PNG, JPG, WebP · max 5MB
            </p>
          </div>
        )}

        {uploading && (
          <div style={{ marginTop: 12, height: 6, borderRadius: 4, background: '#fde68a', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.max(progress, 8)}%`,
                background: assocDash.gradient,
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        )}
      </DropZone>

      {displayUrl && !uploading && !disabled && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {onUpload && (
            <button type="button" onClick={() => inputRef.current?.click()} style={actionBtnStyle}>
              <Upload size={14} />
              Change
            </button>
          )}
          <button
            type="button"
            onClick={clearImage}
            style={{ ...actionBtnStyle, color: '#b91c1c', borderColor: '#fecaca' }}
          >
            <Trash2 size={14} />
            Remove
          </button>
        </div>
      )}

      {error && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#b91c1c', fontWeight: 500 }}>{error}</p>}

      <style>{`
        .team-portrait-spin { animation: team-portrait-spin 1s linear infinite; }
        @keyframes team-portrait-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
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
  background: '#fff',
  fontSize: 12,
  fontWeight: 600,
  color: assocDash.muted,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
