import { Progress } from "@/components/ui/progress";

type ProjectProgressProps = {
  value: number;
};

export function ProjectProgress({ value }: ProjectProgressProps) {
  const clamped = Math.max(0, Math.min(value, 100));

  return (
    <div className="mt-4 space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Progress</span>
        <span className="font-semibold text-foreground">{clamped}%</span>
      </div>
      <Progress value={clamped} className="h-1.5 bg-secondary" />
    </div>
  );
}
