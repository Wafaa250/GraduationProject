import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type HTMLAttributes,
} from 'react'
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'
import { resolveApiFileUrl } from '@/api/axiosInstance'
import { assocDash } from '@/pages/association/dashboard/associationDashTokens'

const ACCEPT = 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp'
const MAX_BYTES = 5 * 1024 * 1024

export type AssociationLogoUploadProps = {
  logoUrl: string | null
  onLogoUrlChange: (url: string | null) => void
  canUpload?: boolean
  onPendingFile?: (file: File | null) => void
  onUpload?: (file: File, onProgress?: (pct: number) => void) => Promise<string>
  disabled?: boolean
}

export function AssociationLogoUpload({
  logoUrl,
  onLogoUrlChange,
  canUpload = true,
  onPendingFile,
  onUpload,
  disabled = false,
}: AssociationLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const displayUrl = localPreview ?? (logoUrl ? resolveApiFileUrl(logoUrl) : null)
  const zoneDisabled = disabled || uploading

  const validateFile = (file: File): string | null => {
    if (!file.size) return 'Please select a valid image file.'
    if (file.size > MAX_BYTES) return 'Logo must be 5MB or smaller.'
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

      if (!canUpload) {
        onPendingFile?.(file)
        return
      }

      if (!onUpload) return

      setUploading(true)
      setProgress(0)
      try {
        const url = await onUpload(file, setProgress)
        onLogoUrlChange(url)
        onPendingFile?.(null)
        setProgress(100)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed.')
        setPreviewFromFile(null)
        onPendingFile?.(null)
      } finally {
        setUploading(false)
      }
    },
    [canUpload, onUpload, onLogoUrlChange, onPendingFile],
  )

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    void handleFile(file)
    e.target.value = ''
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (zoneDisabled) return
    void handleFile(e.dataTransfer.files?.[0] ?? null)
  }

  const clearLogo = () => {
    if (localPreview) URL.revokeObjectURL(localPreview)
    setLocalPreview(null)
    setError(null)
    onLogoUrlChange(null)
    onPendingFile?.(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const zoneClass = [
    'assoc-logo-upload__zone',
    displayUrl ? 'assoc-logo-upload__zone--filled' : 'assoc-logo-upload__zone--empty',
    dragOver ? 'assoc-logo-upload__zone--drag' : '',
    zoneDisabled ? 'assoc-logo-upload__zone--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="assoc-logo-upload">
      <DropZone
        className={zoneClass}
        role="button"
        tabIndex={zoneDisabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!zoneDisabled) inputRef.current?.click()
          }
        }}
        onClick={() => {
          if (!zoneDisabled) inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!zoneDisabled) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          style={{ display: 'none' }}
          disabled={zoneDisabled}
          onChange={onInputChange}
        />

        {displayUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={displayUrl} alt="Logo preview" className="assoc-logo-upload__preview" />
            {!zoneDisabled && (
              <p className="assoc-logo-upload__hint">Click or drag to replace</p>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {uploading ? (
              <Loader2 size={26} color="#d97706" className="assoc-logo-spin" />
            ) : (
              <ImagePlus size={26} color="#d97706" strokeWidth={1.8} />
            )}
            <p className="assoc-logo-upload__title">
              {uploading ? 'Uploading…' : 'Upload organization logo'}
            </p>
            <p className="assoc-logo-upload__sub">Drag and drop or click to browse</p>
          </div>
        )}

        {uploading && (
          <div
            style={{
              marginTop: 12,
              height: 5,
              borderRadius: 4,
              background: assocDash.accentBar,
              overflow: 'hidden',
              maxWidth: 240,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
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
        <div className="assoc-logo-upload__actions">
          <button
            type="button"
            className="assoc-logo-upload__action-btn"
            onClick={(e) => {
              e.stopPropagation()
              inputRef.current?.click()
            }}
          >
            <Upload size={14} />
            Change
          </button>
          <button
            type="button"
            className="assoc-logo-upload__action-btn assoc-logo-upload__action-btn--danger"
            onClick={(e) => {
              e.stopPropagation()
              clearLogo()
            }}
          >
            <Trash2 size={14} />
            Remove
          </button>
        </div>
      )}

      {error && <p className="assoc-logo-upload__error">{error}</p>}

      <style>{`
        .assoc-logo-spin { animation: assoc-logo-spin 1s linear infinite; }
        @keyframes assoc-logo-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

function DropZone({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  )
}
