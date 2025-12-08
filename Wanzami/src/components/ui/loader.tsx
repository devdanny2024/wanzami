export function Loader({ size = 16, color = "#fd7e14" }: { size?: number; color?: string }) {
  const band = Math.max(3, Math.floor(size / 6));
  const faint = "rgba(255, 138, 31, 0.25)";
  return (
    <span
      className="inline-block animate-spin rounded-full"
      style={{
        width: size,
        height: size,
        borderStyle: "solid",
        borderWidth: band,
        borderColor: faint,
        borderTopColor: color,
      }}
      aria-hidden="true"
    />
  );
}



