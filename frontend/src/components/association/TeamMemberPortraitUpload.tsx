import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import { Camera, Loader2, Trash2, Upload, UserRound } from 'lucide-react'
import { resolveApiFileUrl } from '@/api/axiosInstance'
import { assocDash } from '@/pages/association/dashboard/associationDashTokens'

const ACCEPT = 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp'
const MAX_BYTES = 5 * 1024 * 1024

export type TeamMemberPortraitUploadProps = {
  imageUrl: string | null
  onImageUrlChange: (url: string | null) => void
  onUpload?: (file: File, onProgress?: (pct: number) => void) => Promise<string>
  onDisplayUrlChange?: (url: string | null) => void
  disabled?: boolean
  variant?: 'inline' | 'hero'
}

export function TeamMemberPortraitUpload({
  imageUrl,
  onImageUrlChange,
  onUpload,
  onDisplayUrlChange,
  disabled = false,
  variant = 'inline',
}: TeamMemberPortraitUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const displayUrl = localPreview ?? (imageUrl ? resolveApiFileUrl(imageUrl) : null)

  useEffect(() => {
    onDisplayUrlChange?.(displayUrl)
  }, [displayUrl, onDisplayUrlChange])

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

  const canInteract = !disabled && !uploading && !!onUpload
  const isHero = variant === 'hero'

  return (
    <div className={`lt-portrait-upload${isHero ? ' lt-portrait-upload--hero' : ''}`}>
      <div
        className={`lt-portrait-drop${dragOver ? ' lt-portrait-drop--active' : ''}${isHero ? ' lt-portrait-drop--hero' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          if (canInteract) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => {
          if (canInteract && isHero) inputRef.current?.click()
        }}
        onKeyDown={(e) => {
          if (isHero && canInteract && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        role={isHero && canInteract ? 'button' : undefined}
        tabIndex={isHero && canInteract ? 0 : undefined}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="lt-portrait-input"
          disabled={disabled || uploading || !onUpload}
          onChange={onInputChange}
        />

        {isHero ? (
          <div className="lt-portrait-hero">
            <div className="lt-portrait-hero-avatar" aria-hidden>
              {displayUrl ? (
                <img src={displayUrl} alt="" className="lt-portrait-hero-img" />
              ) : uploading ? (
                <div className="lt-portrait-hero-ph">
                  <Loader2 size={28} className="lt-portrait-spin" />
                </div>
              ) : (
                <div className="lt-portrait-hero-ph">
                  <UserRound size={32} strokeWidth={1.5} />
                </div>
              )}
              {canInteract && !uploading && (
                <span className="lt-portrait-hero-badge">
                  <Camera size={14} strokeWidth={2.25} />
                </span>
              )}
            </div>
            {canInteract && (
              <button
                type="button"
                className="lt-portrait-upload-btn lt-portrait-upload-btn--hero"
                onClick={(e) => {
                  e.stopPropagation()
                  inputRef.current?.click()
                }}
              >
                <Upload size={14} strokeWidth={2.25} />
                {displayUrl ? 'Change photo' : 'Upload photo'}
              </button>
            )}
            {uploading && (
              <span className="lt-portrait-helper lt-portrait-helper--uploading">Uploading…</span>
            )}
          </div>
        ) : (
          <div className="lt-portrait-row">
            <div className="lt-portrait-avatar-wrap" aria-hidden>
              {displayUrl ? (
                <img src={displayUrl} alt="" className="lt-portrait-avatar-img" />
              ) : uploading ? (
                <div className="lt-portrait-avatar-ph">
                  <Loader2 size={22} className="lt-portrait-spin" />
                </div>
              ) : (
                <div className="lt-portrait-avatar-ph">
                  <UserRound size={22} strokeWidth={1.75} />
                </div>
              )}
            </div>
            <div className="lt-portrait-actions">
              {canInteract && (
                <button
                  type="button"
                  className="lt-portrait-upload-btn"
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload size={14} strokeWidth={2.25} />
                  {displayUrl ? 'Change photo' : 'Upload photo'}
                </button>
              )}
              {canInteract && (
                <span className="lt-portrait-helper">
                  or drag and drop · PNG, JPG, WebP · max 5MB
                </span>
              )}
              {uploading && (
                <span className="lt-portrait-helper lt-portrait-helper--uploading">Uploading…</span>
              )}
            </div>
          </div>
        )}

        {uploading && (
          <div
            className="lt-portrait-progress"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="lt-portrait-progress-bar" style={{ width: `${Math.max(progress, 8)}%` }} />
          </div>
        )}
      </div>

      {displayUrl && !uploading && !disabled && (
        <button type="button" onClick={clearImage} className="lt-portrait-remove">
          <Trash2 size={13} strokeWidth={2.25} />
          Remove photo
        </button>
      )}

      {error && <p className="lt-portrait-error">{error}</p>}

      <PortraitUploadStyles />
    </div>
  )
}

function PortraitUploadStyles() {
  return (
    <style>{`
      .lt-portrait-upload {
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
      }

      .lt-portrait-upload--hero {
        align-items: center;
        width: 100%;
      }

      .lt-portrait-drop {
        width: 100%;
        border-radius: 16px;
        border: 1px dashed #cbd5e1;
        background: linear-gradient(180deg, #fafbfc 0%, #f8fafc 100%);
        padding: 18px;
        transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
        box-sizing: border-box;
      }

      .lt-portrait-drop--hero {
        padding: 20px 24px;
        cursor: default;
        text-align: center;
      }

      .lt-portrait-drop--hero:not(:has(.lt-portrait-upload-btn:disabled)) {
        cursor: pointer;
      }

      .lt-portrait-drop--active {
        border-color: ${assocDash.accent};
        background: ${assocDash.accentMuted};
        box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
      }

      .lt-portrait-input {
        display: none;
      }

      .lt-portrait-hero {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }

      .lt-portrait-hero-avatar {
        position: relative;
      }

      .lt-portrait-hero-img,
      .lt-portrait-hero-ph {
        width: 96px;
        height: 96px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid #fff;
        box-shadow: 0 4px 20px rgba(15, 23, 42, 0.12), 0 0 0 1px ${assocDash.border};
      }

      .lt-portrait-hero-ph {
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(145deg, ${assocDash.accentMuted}, #fff);
        color: ${assocDash.subtle};
      }

      .lt-portrait-hero-badge {
        position: absolute;
        right: 0;
        bottom: 0;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${assocDash.gradient};
        color: #fff;
        border: 3px solid #fff;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.15);
      }

      .lt-portrait-row {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .lt-portrait-avatar-wrap {
        flex-shrink: 0;
      }

      .lt-portrait-avatar-img,
      .lt-portrait-avatar-ph {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        object-fit: cover;
        box-shadow: 0 0 0 3px #fff, 0 0 0 4px ${assocDash.accentBorder};
      }

      .lt-portrait-avatar-ph {
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${assocDash.surface};
        border: 1.5px solid ${assocDash.border};
        color: ${assocDash.subtle};
      }

      .lt-portrait-actions {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        min-width: 0;
      }

      .lt-portrait-upload-btn {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 8px 16px;
        border-radius: 999px;
        border: 1px solid ${assocDash.border};
        background: ${assocDash.surface};
        font-size: 13px;
        font-weight: 600;
        color: ${assocDash.text};
        cursor: pointer;
        font-family: inherit;
        transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
      }

      .lt-portrait-upload-btn--hero {
        background: ${assocDash.gradient};
        color: #fff;
        border: none;
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
      }

      .lt-portrait-upload-btn--hero:hover {
        box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);
      }

      .lt-portrait-upload-btn:not(.lt-portrait-upload-btn--hero):hover {
        border-color: ${assocDash.accentBorder};
        background: ${assocDash.accentMuted};
      }

      .lt-portrait-helper {
        font-size: 12px;
        line-height: 1.45;
        color: ${assocDash.subtle};
      }

      .lt-portrait-upload--hero .lt-portrait-helper {
        max-width: 240px;
      }

      .lt-portrait-helper--uploading {
        color: ${assocDash.accentDark};
        font-weight: 600;
      }

      .lt-portrait-progress {
        margin-top: 12px;
        height: 4px;
        border-radius: 999px;
        background: #e2e8f0;
        overflow: hidden;
        width: 100%;
      }

      .lt-portrait-progress-bar {
        height: 100%;
        border-radius: 999px;
        background: ${assocDash.gradient};
        transition: width 0.2s ease;
      }

      .lt-portrait-remove {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 0;
        border: none;
        background: none;
        font-size: 12px;
        font-weight: 600;
        color: #b91c1c;
        cursor: pointer;
        font-family: inherit;
      }

      .lt-portrait-upload--hero .lt-portrait-remove {
        align-self: center;
      }

      .lt-portrait-remove:hover {
        color: #991b1b;
        text-decoration: underline;
      }

      .lt-portrait-error {
        margin: 0;
        font-size: 12px;
        color: #b91c1c;
        font-weight: 500;
        text-align: center;
        width: 100%;
      }

      .lt-portrait-spin {
        animation: lt-portrait-spin 1s linear infinite;
        color: ${assocDash.accent};
      }

      @keyframes lt-portrait-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
  )
}
