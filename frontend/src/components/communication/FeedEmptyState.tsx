import { Inbox } from "lucide-react";

type Props = {
  title: string;
  description: string;
};

export function FeedEmptyState({ title, description }: Props) {
  return (
    <div className="hub-card hub-empty communication-hub__empty">
      <Inbox className="mx-auto mb-3 h-10 w-10 opacity-40" aria-hidden />
      <p className="hub-empty__title">{title}</p>
      <p className="m-0 text-sm">{description}</p>
    </div>
  );
}
