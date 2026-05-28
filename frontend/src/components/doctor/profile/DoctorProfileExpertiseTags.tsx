import { DoctorProfileSection } from "./DoctorProfileSection";

type DoctorProfileExpertiseTagsProps = {
  technicalSkills: string[];
  researchSkills: string[];
};

function TagList({ tags }: { tags: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li key={tag}>
          <span className="inline-flex rounded-md border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium text-foreground">
            {tag}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function DoctorProfileExpertiseTags({
  technicalSkills,
  researchSkills,
}: DoctorProfileExpertiseTagsProps) {
  const hasTechnical = technicalSkills.length > 0;
  const hasResearch = researchSkills.length > 0;

  return (
    <DoctorProfileSection
      title="Expertise & Research Interests"
      description="Skills and research areas relevant to student supervision"
    >
      {!hasTechnical && !hasResearch ? (
        <p className="text-sm italic text-muted-foreground">
          No expertise tags added yet. Add technical and research skills when editing your profile.
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Technical expertise
            </h3>
            {hasTechnical ? (
              <TagList tags={technicalSkills} />
            ) : (
              <p className="text-sm italic text-muted-foreground">Not provided</p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Research interests
            </h3>
            {hasResearch ? (
              <TagList tags={researchSkills} />
            ) : (
              <p className="text-sm italic text-muted-foreground">Not provided</p>
            )}
          </div>
        </div>
      )}
    </DoctorProfileSection>
  );
}
