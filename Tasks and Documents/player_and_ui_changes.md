Title: Player and UI Updates - Change Log
Date: 2026-01-15
Author: Olukayode Soliu

Summary
- Removed the support chat bubble from the customer web app layout.
- Improved player behavior on mobile and during seek/rendition changes.
- Updated buffering loader to match brand color.
- Pauses the background short trailer when the full trailer modal opens.

Scope and Files
- Wanzami/app/layout.tsx
  - Removed SupportChatBubble import and render.
- Wanzami/src/components/CustomMediaPlayer.tsx
  - Added mobile landscape lock on playback.
  - Auto-resume playback after seek and rendition switches.
  - Updated buffering spinner color to #fd7e14.
- Wanzami/src/components/MovieDetailPage.tsx
  - Pauses short trailer when full trailer modal is open.
  - Resumes short trailer when modal closes.

Behavior Changes
1) Chat bubble UI
   - Removed from the app shell layout.
   - Placeholder for future reintroduction.

2) Mobile landscape playback
   - On playback start, attempts to lock orientation to landscape on screens <= 900px.
   - Unlocks orientation when the player unmounts.
   - Gracefully ignores browsers that block orientation lock.

3) Seek and rendition changes
   - When seeking (range or skip), playback resumes automatically if it was playing.
   - When changing quality/rendition, playback resumes automatically after source swap.

4) Buffering loader branding
   - Spinner now uses the brand orange (#fd7e14) for the active stroke.

5) Trailer interaction
   - Opening the trailer modal pauses the short trailer background video.
   - Closing the modal resumes the short trailer (best-effort play).

Notes and Logging
- No backend changes in this batch.
- Orientation lock uses the Screen Orientation API; behavior may vary by browser.
- Play resume uses best-effort play() calls; failures are ignored to avoid UI hangs.

Verification Checklist
- Confirm Support chat bubble no longer renders in Wanzami app.
- On mobile, tap Play and confirm it enters landscape.
- Seek forward/back while playing: playback should continue without manual pause/play.
- Change rendition: loader shows orange spinner; playback resumes automatically.
- Open trailer: background short trailer pauses; close trailer: background resumes.
