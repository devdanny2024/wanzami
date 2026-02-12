import test from "node:test";
import assert from "node:assert/strict";
import { canPublishLiveEvent, pickPlayablePlaybackUrl } from "./livePlayback.js";

test("pickPlayablePlaybackUrl prefers active source playback url", () => {
  const playbackUrl = pickPlayablePlaybackUrl({
    playbackUrl: "https://event.example/master.m3u8",
    sources: [
      { isActiveOutput: false, playbackUrl: "https://source-a.example/master.m3u8" },
      { isActiveOutput: true, playbackUrl: "https://source-b.example/master.m3u8" },
    ],
  });

  assert.equal(playbackUrl, "https://source-b.example/master.m3u8");
});

test("pickPlayablePlaybackUrl falls back to event playback when active source is missing url", () => {
  const playbackUrl = pickPlayablePlaybackUrl({
    playbackUrl: "https://event.example/master.m3u8",
    sources: [{ isActiveOutput: true, playbackUrl: null }],
  });

  assert.equal(playbackUrl, "https://event.example/master.m3u8");
});

test("canPublishLiveEvent blocks publish when neither event nor sources have playback url", () => {
  assert.equal(
    canPublishLiveEvent({
      playbackUrl: null,
      sources: [{ isActiveOutput: true, playbackUrl: null }],
    }),
    false
  );
});
