import { BookOpen, Sparkles } from "lucide-react";



import type { EnrolledCourse } from "../../../../api/studentCoursesApi";

import { getCourseId } from "../../../../utils/normalize";

import { Badge } from "../../../components/ui/badge";

import { CourseHubEmptyState } from "./courseHub/CourseHubEmptyState";

import { CourseHubEnrolledCard } from "./courseHub/CourseHubEnrolledCard";

import { CourseHubPageHeader } from "./courseHub/CourseHubPageHeader";



export function StudentCoursesHubView({

  courses,

  loading,

  error,

}: {

  courses: EnrolledCourse[];

  loading: boolean;

  error: string | null;

}) {

  return (

    <div>

      <CourseHubPageHeader

        eyebrow="My learning"

        title="My Courses"

        description="All the courses you're enrolled in this semester. Open a course to see your section, projects, and chats."

        actions={

          !loading ? (

            <Badge className="course-hub-chip border-0 px-3 py-1.5">

              <Sparkles className="h-3.5 w-3.5" />

              {courses.length} enrolled

            </Badge>

          ) : null

        }

      />



      {error ? (

        <p className="text-sm font-medium text-destructive">{error}</p>

      ) : null}



      {loading ? (

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {[...Array(3)].map((_, i) => (

            <div key={i} className="h-56 animate-pulse rounded-2xl bg-muted/60" />

          ))}

        </div>

      ) : courses.length === 0 ? (

        <CourseHubEmptyState

          icon={<BookOpen className="h-6 w-6" />}

          title="You're not enrolled in any courses yet"

          description="Once your doctor adds you to a section, your courses will appear here."

        />

      ) : (

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {courses.map((course) => {

            const cid = getCourseId(course);

            if (cid == null) return null;

            return <CourseHubEnrolledCard key={cid} course={course} courseId={cid} />;

          })}

        </div>

      )}

    </div>

  );

}

