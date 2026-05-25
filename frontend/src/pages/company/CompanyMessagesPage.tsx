import { useState } from "react";
import { Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CompanyPageHeader } from "@/components/company/PageHeader";
import { conversations } from "@/data/companyMock";

const templates = [
  "Hi! We'd love to collaborate on a short project. Open to an intro chat?",
  "Could you share a quick walkthrough of a similar project you've worked on?",
  "Proposing a 30-min kickoff this week — does Thursday afternoon work?",
];

export function CompanyMessagesPage() {
  const [activeId, setActiveId] = useState(conversations[0]?.id ?? "");
  const [text, setText] = useState("");
  const active = conversations.find((c) => c.id === activeId) ?? conversations[0];

  if (!active) {
    return (
      <div className="p-8 text-center text-muted-foreground">No conversations yet.</div>
    );
  }

  const initials = active.with
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto">
      <CompanyPageHeader
        title="Messages"
        subtitle="Collaboration conversations with students and teams."
      />

      <Card className="cw-card-elevated overflow-hidden">
        <div className="grid grid-cols-12 min-h-[560px]">
          <div className="col-span-12 md:col-span-4 lg:col-span-3 border-r flex flex-col">
            <div className="p-3 border-b">
              <Input placeholder="Search conversations" className="rounded-lg" />
            </div>
            <div className="overflow-y-auto flex-1">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left p-3 flex gap-3 border-b hover:bg-secondary/40 ${
                    activeId === c.id ? "bg-secondary/60" : ""
                  }`}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-[10px]">
                      {c.with
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{c.with}</span>
                      <span className="text-[10px] text-muted-foreground">{c.time}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {c.request} · {c.type}
                    </div>
                    <div className="text-xs truncate mt-0.5">{c.lastMessage}</div>
                  </div>
                  {c.unread > 0 && (
                    <Badge className="bg-primary text-primary-foreground border-0 shrink-0">
                      {c.unread}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col">
            <div className="p-4 border-b flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-sm">{active.with}</div>
                <div className="text-[11px] text-muted-foreground">Re: {active.request}</div>
              </div>
            </div>

            <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-secondary/20">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-card border px-4 py-2.5 text-sm">
                {active.lastMessage}
              </div>
            </div>

            <div className="p-3 border-t space-y-2">
              <div className="flex flex-wrap gap-1">
                {templates.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setText(t)}
                    className="text-[10px] px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-left max-w-full truncate"
                  >
                    {t.slice(0, 40)}…
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write a message…"
                  className="rounded-xl"
                />
                <Button size="icon" className="rounded-xl shrink-0 cw-btn-gradient">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
