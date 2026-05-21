import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, Sparkles, X } from "lucide-react";

import type { SkillPack } from "../../../constants/studentSkillPools";
import { CUSTOM_SKILL_MAX_LENGTH } from "../../../constants/studentSkillPools";
import {
  groupStringsByUxCategory,
  SKILL_UX_CATEGORY_ORDER,
  type SkillUxCategoryId,
} from "./graduationProjectSkillCategories";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { cn } from "../../components/ui/utils";

const PREVIEW_LIMIT = 8;

type SkillTab = "roles" | "expertise" | "tools";

function tabItems(tab: SkillTab, pack: SkillPack): string[] {
  if (tab === "roles") return pack.roles;
  if (tab === "expertise") return pack.technicalSkills;
  return pack.tools;
}

function matchesQuery(skill: string, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return skill.toLowerCase().includes(t);
}

function SkillChipButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-left text-xs font-medium leading-snug transition-all duration-200 sm:px-3.5 sm:py-2 sm:text-[13px]",
        "max-w-[min(100%,20rem)] break-words",
        selected
          ? "border-primary/60 bg-gradient-to-br from-primary/15 via-primary/8 to-accent/10 text-primary shadow-sm ring-1 ring-primary/25"
          : "border-border/70 bg-muted/35 text-muted-foreground hover:border-primary/35 hover:bg-muted/55 hover:text-foreground",
      )}
    >
      <span className="line-clamp-3">{label}</span>
    </button>
  );
}

export type GraduationProjectSkillsPickerProps = {
  skillsPack: SkillPack | null;
  requiredSkills: string[];
  onToggleSkill: (skill: string) => void;
  skillDraft: string;
  setSkillDraft: (v: string) => void;
  showSkillInput: boolean;
  setShowSkillInput: (v: boolean) => void;
  onAddCustomSkill: () => void;
};

export function GraduationProjectSkillsPicker({
  skillsPack,
  requiredSkills,
  onToggleSkill,
  skillDraft,
  setSkillDraft,
  showSkillInput,
  setShowSkillInput,
  onAddCustomSkill,
}: GraduationProjectSkillsPickerProps) {
  const [tab, setTab] = useState<SkillTab>("roles");
  const [search, setSearch] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<SkillUxCategoryId>>(
    () => new Set(),
  );
  const [showAllMap, setShowAllMap] = useState<Record<string, boolean>>({});

  const selectedSet = useMemo(
    () => new Set(requiredSkills),
    [requiredSkills],
  );

  const poolFlat = useMemo(() => {
    if (!skillsPack) return [];
    return [
      ...skillsPack.roles,
      ...skillsPack.technicalSkills,
      ...skillsPack.tools,
    ];
  }, [skillsPack]);

  const customPicked = useMemo(
    () => requiredSkills.filter((s) => !poolFlat.includes(s)),
    [requiredSkills, poolFlat],
  );

  useEffect(() => {
    if (!skillsPack) return;
    const items = tabItems(tab, skillsPack);
    const grouped = groupStringsByUxCategory(items);
    const q = search.trim().toLowerCase();

    if (q) {
      const open = new Set<SkillUxCategoryId>();
      for (const { id } of SKILL_UX_CATEGORY_ORDER) {
        const list = grouped.get(id) ?? [];
        if (list.some((s) => s.toLowerCase().includes(q))) open.add(id);
      }
      setExpandedCats(open);
    } else {
      const first = SKILL_UX_CATEGORY_ORDER.find(
        ({ id }) => (grouped.get(id) ?? []).length > 0,
      )?.id;
      setExpandedCats(first ? new Set([first]) : new Set());
    }
  }, [tab, skillsPack, search]);

  useEffect(() => {
    setShowAllMap({});
  }, [tab, search, skillsPack]);

  const toggleCategory = (id: SkillUxCategoryId, open: boolean) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const renderCategorizedTab = (tabKey: SkillTab) => {
    if (!skillsPack) return null;
    const items = tabItems(tabKey, skillsPack);
    const grouped = groupStringsByUxCategory(items);

    const blocks = SKILL_UX_CATEGORY_ORDER.map(({ id, label, hint }) => {
      const skills = grouped.get(id) ?? [];
      const filtered = skills.filter((s) => matchesQuery(s, search));
      if (filtered.length === 0) return null;

      const showAllKey = `${tabKey}-${id}`;
      const showAll = showAllMap[showAllKey] ?? false;
      const slice = showAll ? filtered : filtered.slice(0, PREVIEW_LIMIT);
      const rest = filtered.length - slice.length;

      const selectedInCat = filtered.filter((s) => selectedSet.has(s)).length;

      const isOpen = expandedCats.has(id);

      return (
        <Collapsible
          key={`${tabKey}-${id}`}
          open={isOpen}
          onOpenChange={(o) => toggleCategory(id, o)}
          className="overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card to-muted/20 shadow-sm"
        >
          <CollapsibleTrigger
            className={cn(
              "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors",
              "hover:bg-muted/40 data-[state=open]:bg-muted/30",
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {label}
                </span>
                <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {filtered.length} suggested
                </span>
                {selectedInCat > 0 ? (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {selectedInCat} selected
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180",
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-border/60 bg-card/50 px-4 pb-4 pt-3">
            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {slice.map((skill) => (
                <SkillChipButton
                  key={skill}
                  label={skill}
                  selected={selectedSet.has(skill)}
                  onClick={() => onToggleSkill(skill)}
                />
              ))}
            </div>
            {rest > 0 ? (
              <button
                type="button"
                className="mt-3 text-xs font-semibold text-primary hover:underline"
                onClick={() =>
                  setShowAllMap((m) => ({
                    ...m,
                    [showAllKey]: !showAll,
                  }))
                }
              >
                {showAll ? "Show less" : `Show more (${rest})`}
              </button>
            ) : null}
          </CollapsibleContent>
        </Collapsible>
      );
    }).filter(Boolean);

    if (blocks.length === 0) {
      return (
        <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          No suggestions in this section match your search. Try another tab or
          clear the search field.
        </p>
      );
    }

    return <div className="space-y-2 pt-1">{blocks}</div>;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] via-card to-accent/[0.04] p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4 shrink-0" />
              <p className="text-[11px] font-bold uppercase tracking-widest">
                Required skills
              </p>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Pick <strong className="text-foreground">who</strong> you need (roles),{" "}
              <strong className="text-foreground">what expertise</strong> matters, and{" "}
              <strong className="text-foreground">which tools</strong> you use — works
              across all majors. Everything is saved as one list for the matcher.
            </p>
          </div>
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 border-border/80 bg-background/80 pl-9 pr-3 text-sm shadow-inner"
            placeholder="Search roles, expertise, tools…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search skills"
          />
        </div>
      </div>

      {!skillsPack ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-2.5 leading-relaxed">
          Complete <strong>faculty</strong> and <strong>major</strong> on your profile to
          see curated suggestions for your discipline — you can still add custom skills
          below.
        </p>
      ) : (
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as SkillTab)}
          className="gap-4"
        >
          <TabsList className="grid h-auto w-full grid-cols-1 gap-1 rounded-2xl border border-border/70 bg-muted/40 p-1.5 sm:grid-cols-3">
            <TabsTrigger
              value="roles"
              className="rounded-xl px-3 py-2 text-xs font-semibold sm:text-[13px]"
            >
              Primary team roles
            </TabsTrigger>
            <TabsTrigger
              value="expertise"
              className="rounded-xl px-3 py-2 text-xs font-semibold sm:text-[13px]"
            >
              Expertise & domains
            </TabsTrigger>
            <TabsTrigger
              value="tools"
              className="rounded-xl px-3 py-2 text-xs font-semibold sm:text-[13px]"
            >
              Tools & technologies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="mt-0">
            {renderCategorizedTab("roles")}
          </TabsContent>
          <TabsContent value="expertise" className="mt-0">
            {renderCategorizedTab("expertise")}
          </TabsContent>
          <TabsContent value="tools" className="mt-0">
            {renderCategorizedTab("tools")}
          </TabsContent>
        </Tabs>
      )}

      {customPicked.length > 0 ? (
        <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/[0.03] p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
            Your custom picks
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {customPicked.map((skill) => (
              <button
                key={`custom-${skill}`}
                type="button"
                onClick={() => onToggleSkill(skill)}
                className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
              >
                {skill}
                <span className="ml-1 opacity-70">×</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {!showSkillInput ? (
          <button
            type="button"
            onClick={() => setShowSkillInput(true)}
            className="rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 hover:text-foreground"
          >
            + Add custom skill
          </button>
        ) : (
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              className="h-9 max-w-md text-sm"
              value={skillDraft}
              maxLength={CUSTOM_SKILL_MAX_LENGTH}
              placeholder="e.g. Project coordinator, SPSS, Rhino…"
              onChange={(e) => setSkillDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAddCustomSkill();
                }
              }}
            />
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onAddCustomSkill}
              >
                Add
              </Button>
              <button
                type="button"
                className="rounded-md p-2 text-muted-foreground hover:bg-muted"
                aria-label="Cancel"
                onClick={() => {
                  setShowSkillInput(false);
                  setSkillDraft("");
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
