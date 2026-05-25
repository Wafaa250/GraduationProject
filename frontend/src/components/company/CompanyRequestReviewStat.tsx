type Props = {
  label: string;
  value: string;
};

export function CompanyRequestReviewStat({ label, value }: Props) {
  return (
    <div className="cw-request-review-stat">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-medium mt-0.5 text-sm">{value}</div>
    </div>
  );
}
