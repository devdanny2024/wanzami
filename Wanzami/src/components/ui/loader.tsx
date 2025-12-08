export function Loader({ size = 16, color = "#fd7e14" }: { size?: number; color?: string }) {
  const band = Math.max(3, Math.floor(size / 6));
  const faint = "rgba(255, 138, 31, 0.25)";
  return (
    <>
      <style>{`
        @keyframes loader-ring-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <span
        className="inline-block rounded-full"
        style={{
          width: size,
          height: size,
          borderStyle: "solid",
          borderWidth: band,
          borderColor: faint,
          borderTopColor: color,
          animation: "loader-ring-spin 0.9s linear infinite",
        }}
        aria-hidden="true"
      />
    </>
  );
}



