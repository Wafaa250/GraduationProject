import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { FileText, ImagePlus, Loader2, Paperclip, X } from "lucide-react";
import {
  isDoctorPostDocumentFile,
  isDoctorPostImageFile,
  updateDoctorPost,
  type DoctorPost,
} from "@/api/doctorPostsApi";
import {
  isStudentPostDocumentFile,
  isStudentPostImageFile,
  updateStudentPost,
  type StudentPost,
} from "@/api/studentPostsApi";
import { resolveApiFileUrl, parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FEED_SOURCE_TYPES, type FeedItem } from "@/lib/feedTypes";

type PendingAttachment = {
  file: File;
  kind: "image" | "file";
  previewUrl?: string;
};

type Props = {
  item: FeedItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (post: StudentPost | DoctorPost) => void;
};

export function FeedSocialPostEditDialog({ item, open, onOpenChange, onSaved }: Props) {
  const isDoctor = item.relatedEntityType === FEED_SOURCE_TYPES.doctorPost;
  const [content, setContent] = useState(item.description);
  const [newAttachment, setNewAttachment] = useState<PendingAttachment | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingUrl = item.attachmentUrl ?? item.imageUrl ?? null;
  const existingResolved = existingUrl ? resolveApiFileUrl(existingUrl) ?? existingUrl : null;
  const showExisting =
    !removeExisting && !newAttachment && existingResolved && item.attachmentType;

  useEffect(() => {
    if (!open) return;
    setContent(item.description);
    setNewAttachment(null);
    setRemoveExisting(false);
  }, [open, item]);

  const clearNewAttachment = () => {
    if (newAttachment?.previewUrl) URL.revokeObjectURL(newAttachment.previewUrl);
    setNewAttachment(null);
  };

  const setPendingAttachment = (file: File, kind: PendingAttachment["kind"]) => {
    clearNewAttachment();
    setRemoveExisting(false);
    setNewAttachment({
      file,
      kind,
      previewUrl: kind === "image" ? URL.createObjectURL(file) : undefined,
    });
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const valid = isDoctor ? isDoctorPostImageFile(file) : isStudentPostImageFile(file);
    if (!valid) {
      toast({
        variant: "destructive",
        title: "Invalid image",
        description: "Use JPG, JPEG, PNG, or WEBP.",
      });
      return;
    }
    setPendingAttachment(file, "image");
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const valid = isDoctor ? isDoctorPostDocumentFile(file) : isStudentPostDocumentFile(file);
    if (!valid) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Use PDF or DOCX.",
      });
      return;
    }
    setPendingAttachment(file, "file");
  };

  const handleRemoveExisting = () => {
    clearNewAttachment();
    setRemoveExisting(true);
  };

  const trimmed = content.trim();
  const canSave = trimmed.length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload = {
        content: trimmed,
        file: newAttachment?.file,
        removeAttachment: removeExisting && !newAttachment,
      };
      const updated = isDoctor
        ? await updateDoctorPost(item.relatedEntityId, payload)
        : await updateStudentPost(item.relatedEntityId, payload);
      toast({ title: "Post updated" });
      onSaved(updated);
      onOpenChange(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not update post",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-visible p-0">
        <DialogHeader>
          <DialogTitle>Edit post</DialogTitle>
          <DialogDescription>Update your post text or attachment.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="min-h-[7rem] resize-y"
            disabled={saving}
          />

          {showExisting && item.attachmentType === "Image" ? (
            <div className="feed-composer__preview">
              <img src={existingResolved!} alt="" className="feed-composer__preview-img" />
              <button
                type="button"
                className="feed-composer__preview-remove"
                onClick={handleRemoveExisting}
                disabled={saving}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Remove
              </button>
            </div>
          ) : null}

          {showExisting && item.attachmentType === "File" ? (
            <div className="feed-composer__file-preview">
              <FileText className="feed-composer__file-preview-icon" aria-hidden />
              <div className="feed-composer__file-preview-meta">
                <span className="feed-composer__file-preview-name">
                  {existingResolved?.split("/").pop() ?? "Attachment"}
                </span>
                <span className="feed-composer__file-preview-hint">Current file attachment</span>
              </div>
              <button
                type="button"
                className="feed-composer__file-preview-remove"
                onClick={handleRemoveExisting}
                disabled={saving}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : null}

          {newAttachment?.kind === "image" && newAttachment.previewUrl ? (
            <div className="feed-composer__preview">
              <img src={newAttachment.previewUrl} alt="" className="feed-composer__preview-img" />
              <button
                type="button"
                className="feed-composer__preview-remove"
                onClick={clearNewAttachment}
                disabled={saving}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Remove
              </button>
            </div>
          ) : null}

          {newAttachment?.kind === "file" ? (
            <div className="feed-composer__file-preview">
              <FileText className="feed-composer__file-preview-icon" aria-hidden />
              <div className="feed-composer__file-preview-meta">
                <span className="feed-composer__file-preview-name">{newAttachment.file.name}</span>
                <span className="feed-composer__file-preview-hint">New file attachment</span>
              </div>
              <button
                type="button"
                className="feed-composer__file-preview-remove"
                onClick={clearNewAttachment}
                disabled={saving}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : null}

          <div className="feed-composer__tools">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              className="sr-only"
              onChange={handleImageChange}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="feed-composer__tool-btn"
              onClick={() => imageInputRef.current?.click()}
              disabled={saving}
            >
              <ImagePlus className="h-4 w-4" aria-hidden />
              <span>Image</span>
            </button>
            <button
              type="button"
              className="feed-composer__tool-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
            >
              <Paperclip className="h-4 w-4" aria-hidden />
              <span>File</span>
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="ss-brand-cta"
            disabled={!canSave}
            onClick={() => void handleSave()}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
