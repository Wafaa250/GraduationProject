import { AvatarGradient } from "./Avatar";

type Props = {
  names: string[];
  size?: number;
  max?: number;
};

export function AvatarStack({ names, size = 28, max = 5 }: Props) {
  const visible = names.filter(Boolean).slice(0, max);
  if (visible.length === 0) return null;

  return (
    <div className="dd-avatar-stack" style={{ height: size }}>
      {visible.map((name, i) => (
        <AvatarGradient
          key={`${name}-${i}`}
          name={name}
          size={size}
          border
          style={{
            marginLeft: i === 0 ? 0 : -(size * 0.28),
            zIndex: visible.length - i,
            position: "relative",
          }}
        />
      ))}
    </div>
  );
}

export { AvatarGradient as AvatarInitial } from "./Avatar";
