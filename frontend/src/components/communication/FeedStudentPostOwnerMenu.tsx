import { useEffect, useRef, useState } from "react";
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { deleteStudentPost } from "@/api/studentPostsApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
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
import { FeedStudentPostEditDialog } from "@/components/communication/FeedStudentPostEditDialog";
import type { StudentPost } from "@/api/studentPostsApi";
import type { FeedItem } from "@/lib/feedTypes";

type Props = {
  item: FeedItem;
  onUpdated: (post: StudentPost) => void;
  onDeleted: (postId: number) => void;
};

export function FeedStudentPostOwnerMenu({ item, onUpdated, onDeleted }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteStudentPost(item.relatedEntityId);
      toast({ title: "Post deleted" });
      onDeleted(item.relatedEntityId);
      setDeleteOpen(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not delete post",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="feed-post__owner-menu" ref={menuRef}>
        <button
          type="button"
          className="feed-post__owner-menu-trigger"
          aria-label="Post options"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </button>

        {menuOpen ? (
          <div className="feed-post__owner-menu-panel" role="menu">
            <button
              type="button"
              role="menuitem"
              className="feed-post__owner-menu-item"
              onClick={() => {
                setMenuOpen(false);
                setEditOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Edit post
            </button>
            <button
              type="button"
              role="menuitem"
              className="feed-post__owner-menu-item feed-post__owner-menu-item--danger"
              onClick={() => {
                setMenuOpen(false);
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete post
            </button>
          </div>
        ) : null}
      </div>

      <FeedStudentPostEditDialog
        item={item}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={onUpdated}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md gap-0 p-0">
          <DialogHeader>
            <DialogTitle>Delete post?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={deleting} onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
