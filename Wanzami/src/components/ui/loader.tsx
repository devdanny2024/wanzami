export function Loader({ size = 16, color = "#fd7e14" }: { size?: number; color?: string }) {
  const borderColor = `${color}40`;
  return (
    <span
      className="inline-block animate-spin rounded-full border-[3px]"
      style={{
        width: size,
        height: size,
        borderColor,
        borderTopColor: color,
      }}
      aria-hidden="true"
    />
  );
}



