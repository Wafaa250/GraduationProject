import { useEffect, useState } from "react";

import { Bot, Send, Sparkles, Users } from "lucide-react";

import { useParams } from "react-router-dom";



import {

  getHubAiRecommendations,

  hubTeamChoicePath,

  sendHubTeamInvitation,

} from "../../../api/studentCoursesHubApi";

import type { HubAiRecommendation, HubApiError } from "../../../types/studentCoursesHub";

import { useToast } from "../../../context/ToastContext";

import { Badge } from "../../components/ui/badge";

import { Button } from "../../components/ui/button";

import { Card } from "../../components/ui/card";

import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";

import {

  AvailabilityBadge,

  MatchScoreBadge,

} from "../courses/components/courseHub/CourseHubBadges";

import { CourseHubEmptyState } from "../courses/components/courseHub/CourseHubEmptyState";

import { StudentCourseSubpageShell } from "../courses/components/StudentCourseSubpageShell";



function avatarSrc(raw: string | null | undefined): string | null {

  const trimmed = raw?.trim();

  if (!trimmed) return null;

  return trimmed.startsWith("data:") ? trimmed : `data:image/*;base64,${trimmed}`;

}



export default function StudentAiTeamPage() {

  const { showToast } = useToast();

  const { courseId = "", projectId = "" } = useParams<{ courseId?: string; projectId?: string }>();



  const [data, setData] = useState<{

    projectTitle: string;

    teamSize: number;

    recommendations: HubAiRecommendation[];

  } | null>(null);

  const [error, setError] = useState<HubApiError | null>(null);

  const [sending, setSending] = useState<string | null>(null);



  useEffect(() => {

    if (!courseId || !projectId) return;

    let cancelled = false;

    setError(null);

    setData(null);

    getHubAiRecommendations(courseId, projectId)

      .then((d) => {

        if (!cancelled) setData(d);

      })

      .catch((e) => {

        if (!cancelled) setError(e as HubApiError);

      });

    return () => {

      cancelled = true;

    };

  }, [courseId, projectId]);



  const onInvite = async (s: HubAiRecommendation) => {

    setSending(s.studentId);

    try {

      await sendHubTeamInvitation(courseId, projectId, s.studentId);

      showToast(`Your invite to ${s.name} is on its way.`, "success");

      const refreshed = await getHubAiRecommendations(courseId, projectId);

      setData(refreshed);

    } catch (e) {

      const err = e as HubApiError;

      showToast(err.message || "Could not send invitation", "error");

    } finally {

      setSending(null);

    }

  };



  if (error) {

    return (

      <StudentCourseSubpageShell

        backTo={hubTeamChoicePath(courseId, projectId)}

        backLabel="Back to team choice"

        title="AI recommendations"

        eyebrow="AI teammates"

      >

        <CourseHubEmptyState

          icon={<Bot className="h-6 w-6" />}

          title="No AI recommendations"

          description={error.message}

        />

      </StudentCourseSubpageShell>

    );

  }



  if (!data) {

    return (

      <StudentCourseSubpageShell

        backTo={hubTeamChoicePath(courseId, projectId)}

        backLabel="Back to team choice"

        title="Loading…"

        eyebrow="AI teammates"

      >

        <div className="h-96 animate-pulse rounded-3xl bg-muted/60" />

      </StudentCourseSubpageShell>

    );

  }



  return (

    <StudentCourseSubpageShell

      backTo={hubTeamChoicePath(courseId, projectId)}

      backLabel="Back to team choice"

      eyebrow={

        <span className="inline-flex items-center gap-1">

          <Sparkles className="h-3 w-3" /> AI recommendations

        </span>

      }

      title={data.projectTitle}

      description="Classmates whose skills complement yours, ranked by how well they fit your team."

      headerActions={

        <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary-soft text-primary">

          <Users className="h-3.5 w-3.5" /> Team size: {data.teamSize}

        </Badge>

      }

    >

      {data.recommendations.length === 0 ? (

        <CourseHubEmptyState icon={<Bot className="h-6 w-6" />} title="No recommendations yet" />

      ) : (

        <div className="space-y-4">

          {data.recommendations.map((s, i) => {

            const canInvite = s.availabilityStatus === "available";

            const src = avatarSrc(s.avatar ?? null);

            return (

              <Card

                key={s.studentId}

                className="relative overflow-hidden border-border shadow-card transition-shadow hover:shadow-elegant"

              >

                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-primary" />

                <div className="grid gap-5 p-6 md:grid-cols-[auto_1fr_auto] md:items-center">

                  <div className="flex items-center gap-4">

                    <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">

                      #{i + 1}

                    </div>

                    <Avatar className="h-14 w-14 ring-2 ring-primary/10">

                      {src ? <AvatarImage src={src} alt={s.name} /> : null}

                      <AvatarFallback className="bg-primary-soft text-primary">

                        {s.name

                          .split(/\s+/)

                          .map((p) => p[0])

                          .slice(0, 2)

                          .join("")

                          .toUpperCase()}

                      </AvatarFallback>

                    </Avatar>

                  </div>



                  <div className="space-y-2">

                    <div className="flex flex-wrap items-center gap-2">

                      <h3 className="font-display text-lg font-semibold">{s.name}</h3>

                      <Badge variant="outline" className="border-border text-xs">

                        {s.sectionName}

                      </Badge>

                      <MatchScoreBadge score={s.matchScore} />

                    </div>

                    <p className="text-sm italic text-muted-foreground">

                      &ldquo;{s.matchReason}&rdquo;

                    </p>

                    <div className="flex flex-wrap gap-1.5">

                      {s.skills.map((sk) => (

                        <Badge

                          key={sk}

                          variant="outline"

                          className="border-primary/20 bg-primary-soft text-primary"

                        >

                          {sk}

                        </Badge>

                      ))}

                    </div>

                  </div>



                  <div className="flex flex-col items-end gap-3">

                    <AvailabilityBadge

                      status={s.availabilityStatus}

                      reason={s.availabilityReason}

                    />

                    <Button

                      onClick={() => void onInvite(s)}

                      disabled={!canInvite || sending === s.studentId}

                      className="bg-gradient-primary shadow-glow disabled:opacity-50 disabled:shadow-none"

                    >

                      <Send className="mr-1.5 h-4 w-4" />

                      {sending === s.studentId

                        ? "Sending…"

                        : canInvite

                          ? "Send invitation"

                          : "Unavailable"}

                    </Button>

                  </div>

                </div>

              </Card>

            );

          })}

        </div>

      )}

    </StudentCourseSubpageShell>

  );

}

