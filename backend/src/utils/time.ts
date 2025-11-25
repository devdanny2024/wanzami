const multipliers: Record<string, number> = {
  s: 1000,
  m: 1000 * 60,
  h: 1000 * 60 * 60,
  d: 1000 * 60 * 60 * 24,
};

export const durationToMs = (value: string): number => {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) {
    return Number(value) || 0;
  }
  const [, amount, unit] = match;
  return Number(amount) * (multipliers[unit] ?? 0);
};
