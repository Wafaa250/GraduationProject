type Props = {
  label: string;
  value: string;
};

export function CompanyRequestReviewStat({ label, value }: Props) {
  return (
    <div className="cw-review-stat-lux">
      <div className="cw-review-stat-lux-label">{label}</div>
      <div className="cw-review-stat-lux-value">{value}</div>
    </div>
  );
}
