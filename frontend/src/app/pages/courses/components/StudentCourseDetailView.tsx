import { useCallback, useEffect, useMemo, useState } from "react";

import { useSearchParams } from "react-router-dom";

import {

  AlertCircle,

  Calendar,

  CheckCircle2,

  MapPin,

  Users,

} from "lucide-react";



import api, { parseApiErrorMessage } from "../../../../api/axiosInstance";

import { markChatScopeRead } from "../../../../api/notificationsApi";

import {

  getCourseById,

  getCourseStudents,

  type CourseDetails,

} from "../../../../api/studentCoursesApi";

import { Badge } from "../../../components/ui/badge";

import { Card } from "../../../components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";

import { CourseHubBackLink } from "./courseHub/CourseHubBackLink";

import { CourseHubChatPanel } from "./courseHub/CourseHubChatPanel";

import { CourseHubEmptyState } from "./courseHub/CourseHubEmptyState";

import { CourseHubPageHeader } from "./courseHub/CourseHubPageHeader";

import { CourseHubProjectCard } from "./courseHub/CourseHubProjectCard";

import { CourseHubRosterCard } from "./courseHub/CourseHubRosterCard";

import {

  asText,

  formatEnrolledSemester,

  formatSectionDisplayName,

  formatSectionSchedule,

  getAuthUserIdFromMe,
  getSectionRoom,
  normalizeChatMessage,
  normalizeCourseProject,
  type ChatMessage,

  type CourseBundle,

  type CourseProject,

  type CourseProjectRaw,

  type CourseTab,

} from "./studentCourseHelpers";



export function StudentCourseDetailView({

  courseId,

  user,

}: {

  courseId: number;

  user: unknown;

}) {

  const [searchParams, setSearchParams] = useSearchParams();



  const tabFromUrl = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<CourseTab>(

    tabFromUrl === "chat" || tabFromUrl === "projects" ? tabFromUrl : "section",

  );



  const [bundle, setBundle] = useState<CourseBundle | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [allProjects, setAllProjects] = useState<CourseProject[]>([]);



  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [chatLoading, setChatLoading] = useState(false);

  const [chatSending, setChatSending] = useState(false);



  useEffect(() => {

    const tab = searchParams.get("tab");

    if (tab === "chat" || tab === "projects" || tab === "section") {

      setActiveTab(tab);

    }

  }, [searchParams]);



  const handleTabChange = (tab: CourseTab) => {

    setActiveTab(tab);

    setSearchParams(tab === "section" ? {} : { tab }, { replace: true });

  };



  useEffect(() => {

    let cancelled = false;

    const load = async () => {

      setLoading(true);

      setError(null);

      try {

        const [detail, roster, projectsRes] = await Promise.all([

          getCourseById(courseId),

          getCourseStudents(courseId),

          api.get<CourseProjectRaw[]>(`/courses/${courseId}/projects`),

        ]);

        if (cancelled) return;

        setBundle({ detail, roster });

        setAllProjects((projectsRes.data ?? []).map(normalizeCourseProject));

      } catch (err) {

        if (cancelled) return;

        const status = (err as { response?: { status?: number } })?.response?.status;

        if (status === 404) setError("This course is no longer available.");

        else if (status === 403) setError("You do not have permission to view this course.");

        else setError(parseApiErrorMessage(err));

      } finally {

        if (!cancelled) setLoading(false);

      }

    };

    void load();

    return () => {

      cancelled = true;

    };

  }, [courseId]);



  const detail = bundle?.detail;

  const mySectionId = useMemo(() => {

    const raw = detail as CourseDetails & {

      mySectionId?: number;

      MySectionId?: number;

    };

    return raw?.mySectionId ?? raw?.MySectionId ?? null;

  }, [detail]);



  const mySectionNameRaw = useMemo(() => {

    const raw = detail as CourseDetails & {

      mySectionName?: string;

      MySectionName?: string;

    };

    return asText(raw?.mySectionName ?? raw?.MySectionName, "My section");

  }, [detail]);



  const mySectionDisplayName = useMemo(

    () => formatSectionDisplayName(mySectionNameRaw),

    [mySectionNameRaw],

  );



  const mySection = useMemo(() => {

    if (!detail?.sections || mySectionId == null) return null;

    return detail.sections.find((s) => s.id === mySectionId) ?? null;

  }, [detail, mySectionId]);



  const courseStudents = bundle?.roster ?? [];



  const mySectionStudents = useMemo(() => {

    if (!bundle) return [];

    if (mySectionId == null) return courseStudents;

    return courseStudents.filter((student) => {

      const sid = student.sectionId ?? student.SectionId ?? null;

      return sid === mySectionId;

    });

  }, [bundle, mySectionId, courseStudents]);



  const rosterList = mySectionId != null ? mySectionStudents : courseStudents;



  const mySectionProjects = useMemo(() => {

    if (allProjects.length === 0) return [];

    if (mySectionId == null) return allProjects.filter((p) => p.applyToAllSections);

    return allProjects.filter(

      (p) =>

        p.applyToAllSections || p.sections.some((s) => s.sectionId === mySectionId),

    );

  }, [allProjects, mySectionId]);



  const authUserId = useMemo(() => getAuthUserIdFromMe(user), [user]);



  const fetchMessages = useCallback(async (sectionId: number) => {

    setChatLoading(true);

    try {

      const res = await api.get<unknown[]>(`/sections/${sectionId}/chat?limit=100`);

      setMessages((res.data ?? []).map(normalizeChatMessage));

      await markChatScopeRead(`section:${sectionId}`);

    } catch (err) {

      console.error(err);

    } finally {

      setChatLoading(false);

    }

  }, []);



  useEffect(() => {

    if (activeTab === "chat" && mySectionId != null) {

      void fetchMessages(mySectionId);

    }

  }, [activeTab, mySectionId, fetchMessages]);



  const sendMessage = async (text: string) => {

    if (!mySectionId) return;

    setChatSending(true);

    try {

      const res = await api.post(`/sections/${mySectionId}/chat`, { text });

      setMessages((prev) => [...prev, normalizeChatMessage(res.data)]);

    } finally {

      setChatSending(false);

    }

  };



  if (error) {

    return (

      <div>

        <CourseHubBackLink to="/student/courses">Back to courses</CourseHubBackLink>

        <CourseHubEmptyState

          icon={<AlertCircle className="h-6 w-6 text-destructive" />}

          title="Couldn't load course"

          description={error}

        />

      </div>

    );

  }



  if (loading || !detail) {

    return <div className="h-96 animate-pulse rounded-3xl bg-muted/60" />;

  }



  const courseName = asText(detail.name);

  const courseCode = asText(detail.code);

  const semester = formatEnrolledSemester(detail.semester);

  const descriptionParts = [

    semester,

    detail.doctorName?.trim() || "",

  ].filter(Boolean);



  return (

    <div>

      <CourseHubBackLink to="/student/courses">Back to courses</CourseHubBackLink>



      <CourseHubPageHeader

        eyebrow={courseCode}

        title={courseName}

        description={descriptionParts.join(" · ")}

        actions={

          <Badge

            variant="outline"

            className="course-hub-chip border-0"

          >

            {mySectionDisplayName}

          </Badge>

        }

      />



      <Tabs

        value={activeTab}

        onValueChange={(v) => handleTabChange(v as CourseTab)}

        className="space-y-6"

      >

        <TabsList className="grid w-full grid-cols-3 rounded-full bg-muted/60 p-1 sm:w-fit">

          <TabsTrigger value="section" className="rounded-full">

            Section info

          </TabsTrigger>

          <TabsTrigger value="chat" className="rounded-full">

            Section chat

          </TabsTrigger>

          <TabsTrigger value="projects" className="rounded-full">

            Projects

          </TabsTrigger>

        </TabsList>



        <TabsContent value="section" className="space-y-6">

          {mySection ? (

            <Card className="rounded-2xl border-border bg-gradient-soft p-6 shadow-card">

              <h3 className="font-display text-lg font-semibold">

                {formatSectionDisplayName(asText(mySection.name))}

              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">

                <div className="flex items-center gap-2 text-sm">

                  <Calendar className="h-4 w-4 shrink-0 text-primary" />

                  <span className="text-muted-foreground">Schedule:</span>

                  <span className="font-medium text-foreground">

                    {formatSectionSchedule(

                      mySection.days,

                      mySection.timeFrom,

                      mySection.timeTo,

                    )}

                  </span>

                </div>

                <div className="flex items-center gap-2 text-sm">

                  <MapPin className="h-4 w-4 shrink-0 text-primary" />

                  <span className="text-muted-foreground">Room:</span>

                  <span className="font-medium text-foreground">

                    {getSectionRoom(mySection)}

                  </span>

                </div>

              </div>

            </Card>

          ) : (

            <Card className="rounded-2xl border-border bg-muted/30 p-5 text-sm text-muted-foreground">

              You are not assigned to a section yet. Below are all students in this course.

            </Card>

          )}



          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
                {mySectionId != null ? "Classmates in your section" : "Course students"}
              </h3>
              <Badge
                variant="outline"
                className="shrink-0 gap-1.5 border-border bg-background px-2.5 py-0.5 text-xs font-medium"
              >
                <Users className="h-3 w-3" />
                {rosterList.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rosterList.map((student, index) => (
                <CourseHubRosterCard
                  key={String(student.studentId ?? student.StudentId ?? index)}
                  student={student}
                />
              ))}
            </div>
          </div>

        </TabsContent>



        <TabsContent value="chat">

          {mySectionId == null ? (

            <CourseHubEmptyState

              icon={<Users className="h-6 w-6" />}

              title="Section chat unavailable"

              description="You need to be assigned to a section to use chat."

            />

          ) : (

            <CourseHubChatPanel

              meUserId={authUserId}

              messages={messages}

              loading={chatLoading}

              sending={chatSending}

              onSend={sendMessage}

              placeholder={`Message ${mySectionDisplayName}…`}

              emptyTitle="No messages in this section yet"

              emptyDescription="Start the conversation with your classmates."

            />

          )}

        </TabsContent>



        <TabsContent value="projects" className="space-y-4">

          {mySectionProjects.length === 0 ? (

            <CourseHubEmptyState

              icon={<CheckCircle2 className="h-6 w-6" />}

              title="No projects yet"

              description="Your doctor hasn't added projects to this section. Check back later."

            />

          ) : (

            mySectionProjects.map((project) => (

              <CourseHubProjectCard key={project.id} project={project} courseId={courseId} />

            ))

          )}

        </TabsContent>

      </Tabs>

    </div>

  );

}

