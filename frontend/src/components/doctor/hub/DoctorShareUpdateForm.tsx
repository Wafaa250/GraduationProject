import { useEffect, useRef, useState, type ChangeEvent } from "react";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { FileText, ImagePlus, Loader2, Paperclip, Smile, X } from "lucide-react";
import {
  createDoctorPost,
  isDoctorPostDocumentFile,
  isDoctorPostImageFile,
} from "@/api/doctorPostsApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import "@/styles/communication-hub.css";

type PendingAttachment = {
  file: File;
  kind: "image" | "file";
  previewUrl?: string;
};

type Props = {
  onPublished: () => void;
  /** When false, clears draft state (e.g. modal closed). */
  active?: boolean;
};

export function DoctorShareUpdateForm({ onPublished, active = true }: Props) {
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const [posting, setPosting] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiWrapRef = useRef<HTMLDivElement>(null);

  const trimmed = content.trim();
  const canPost = trimmed.length > 0 && !posting;

  const clearAttachment = () => {
    if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    setAttachment(null);
  };

  const resetForm = () => {
    setContent("");
    clearAttachment();
    setEmojiOpen(false);
  };

  useEffect(() => {
    if (!active) {
      setContent("");
      setEmojiOpen(false);
      setAttachment((prev) => {
        if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
        return null;
      });
    }
  }, [active]);

  useEffect(() => {
    if (!emojiOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!emojiWrapRef.current?.contains(event.target as Node)) {
        setEmojiOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [emojiOpen]);

  const setPendingAttachment = (file: File, kind: PendingAttachment["kind"]) => {
    if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    setAttachment({
      file,
      kind,
      previewUrl: kind === "image" ? URL.createObjectURL(file) : undefined,
    });
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!isDoctorPostImageFile(file)) {
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

    if (!isDoctorPostDocumentFile(file)) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Use PDF or DOCX.",
      });
      return;
    }

    setPendingAttachment(file, "file");
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? content.length;
    const end = el?.selectionEnd ?? content.length;

    setContent((prev) => `${prev.slice(0, start)}${emoji}${prev.slice(end)}`);
    setEmojiOpen(false);

    requestAnimationFrame(() => {
      const nextPos = start + emoji.length;
      el?.focus();
      el?.setSelectionRange(nextPos, nextPos);
    });
  };

  const handleEmojiClick = (data: EmojiClickData) => {
    insertEmoji(data.emoji);
  };

  const handlePublish = async () => {
    if (!canPost) return;
    setPosting(true);
    try {
      await createDoctorPost({
        content: trimmed,
        file: attachment?.file,
      });
      resetForm();
      toast({
        title: "Update published",
        description: "Your post is now visible in the Communication Hub feed.",
      });
      onPublished();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not publish update",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="feed-composer doctor-share-update-form">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share news, guidance, or announcements with students…"
        rows={4}
        className="feed-composer__input min-h-[6rem] resize-y border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        disabled={posting}
      />

      {attachment?.kind === "image" && attachment.previewUrl ? (
        <div className="feed-composer__preview">
          <img src={attachment.previewUrl} alt="" className="feed-composer__preview-img" />
          <button
            type="button"
            className="feed-composer__preview-remove"
            onClick={clearAttachment}
            disabled={posting}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Remove
          </button>
        </div>
      ) : null}

      {attachment?.kind === "file" ? (
        <div className="feed-composer__file-preview">
          <FileText className="feed-composer__file-preview-icon" aria-hidden />
          <div className="feed-composer__file-preview-meta">
            <span className="feed-composer__file-preview-name">{attachment.file.name}</span>
            <span className="feed-composer__file-preview-hint">PDF or Word document</span>
          </div>
          <button
            type="button"
            className="feed-composer__file-preview-remove"
            onClick={clearAttachment}
            disabled={posting}
            aria-label="Remove file"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}

      <div className="feed-composer__toolbar">
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
            disabled={posting}
            aria-label="Add image"
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
            <span>Image</span>
          </button>

          <button
            type="button"
            className="feed-composer__tool-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={posting}
            aria-label="Add file"
          >
            <Paperclip className="h-4 w-4" aria-hidden />
            <span>File</span>
          </button>

          <div className="feed-composer__emoji-wrap" ref={emojiWrapRef}>
            <button
              type="button"
              className={`feed-composer__tool-btn${emojiOpen ? " feed-composer__tool-btn--active" : ""}`}
              onClick={() => setEmojiOpen((open) => !open)}
              disabled={posting}
              aria-label="Add emoji"
              aria-expanded={emojiOpen}
            >
              <Smile className="h-4 w-4" aria-hidden />
              <span>Emoji</span>
            </button>

            {emojiOpen ? (
              <div className="feed-composer__emoji-popover">
                <EmojiPicker onEmojiClick={handleEmojiClick} width="100%" height={320} />
              </div>
            ) : null}
          </div>
        </div>

        <Button
          type="button"
          className="feed-composer__submit ss-brand-cta rounded-lg px-4"
          disabled={!canPost}
          onClick={() => void handlePublish()}
        >
          {posting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Publishing…
            </>
          ) : (
            "Publish"
          )}
        </Button>
      </div>
    </div>
  );
}
