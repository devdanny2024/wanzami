export type PlaybackSource = {
  playbackUrl?: string | null;
  isActiveOutput?: boolean | null;
};

export type PlaybackEvent = {
  playbackUrl?: string | null;
  sources?: PlaybackSource[] | null;
};

export const pickPlayablePlaybackUrl = (event: PlaybackEvent): string | null => {
  const sources = Array.isArray(event.sources) ? event.sources : [];
  const activeSource = sources.find((source) => source?.isActiveOutput);
  const activeSourceUrl = activeSource?.playbackUrl?.trim();
  if (activeSourceUrl) return activeSourceUrl;

  const eventUrl = event.playbackUrl?.trim();
  if (eventUrl) return eventUrl;

  const fallbackSource = sources.find((source) => source?.playbackUrl?.trim());
  return fallbackSource?.playbackUrl?.trim() ?? null;
};

export const canPublishLiveEvent = (event: PlaybackEvent): boolean => Boolean(pickPlayablePlaybackUrl(event));
