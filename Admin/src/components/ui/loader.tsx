export function Loader({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-white/50 border-t-transparent"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

