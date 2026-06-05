import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/** Association profile chrome without sidebar — matches owner workspace styling. */
export function AssociationPublicProfileShell({ children }: Props) {
  return (
    <div
      className="association-workspace min-h-screen"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "auto",
          padding: "24px 20px 32px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
