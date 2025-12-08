export function Loader({ size = 16, color = "#fd7e14" }: { size?: number; color?: string }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-[3px]"
      style={{
        width: size,
        height: size,
        borderStyle: "solid",
        borderColor: "rgba(255,255,255,0.15)",
        borderTopColor: color,
      }}
      aria-hidden="true"
    />
  );
}



