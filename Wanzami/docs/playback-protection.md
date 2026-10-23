# Playback protection

## The honest limit
A website cannot technically stop screen recording. Software that records the screen sees whatever
the browser draws. Only **hardware/OS-backed DRM** (Widevine, FairPlay, PlayReady) makes recorders
capture a black picture, because the browser hands the decrypted frames straight to a protected
output path. Even DRM cannot stop a phone filming a screen. So protection is layered.

## Layer 1 and 2 (this change): traceability and deterrence
- **Forensic watermark** (`PlaybackWatermark.tsx`): a faint tag with the viewer's account ID, profile
  and the minute (`ID 40298 / P12 / 21 OCT 14:05`) drifts across the picture, plus a fainter second tag
  opposite it. A leaked recording identifies the account it came from.
- **Tamper guard**: if the mark is hidden, deleted or made transparent it is put back at once; three
  attempts inside a minute pause playback ("Playback paused", reload to continue). It is built with
  plain DOM nodes inside one React-owned host so deleting it can never crash the page.
- **Player hardening**: no right-click menu, no drag, no picture-in-picture, no remote playback, no
  native download control, text selection off.
- Logic and tests: `src/lib/playbackProtection.ts`, `npm run test:protection`.

Not changed (on purpose): the backend media proxy. Its 1-hour tokens are tied to the file, not the
viewer; tying them to a viewer or IP would break people on mobile networks. Link sharing is better
solved by Layer 3.

## Layer 3: encrypted video
Two different things get called "our own DRM":

| | Own encryption + key service | Licensed DRM (Widevine / FairPlay / PlayReady) |
|---|---|---|
| What it does | Encrypts the stream (HLS AES-128 or ClearKey). The player gets a short-lived key only after the server checks the viewer owns the title. | Same, but the key stays in a protected module of the browser/OS. |
| Stops download tools and shared links | Yes | Yes |
| Blacks out screen recording | **No** (the key and frames are visible to the page) | **Yes** on most browsers (strongest in Safari and Edge) |
| Can we build it in-house | Yes: key endpoint + `-hls_key_info_file` in the ffmpeg worker, a few days | No. The protected module belongs to Google/Apple/Microsoft; access is by licence, usually through a DRM provider (PallyCon, EZDRM, BuyDRM, Axinom, DRMtoday) |
| Needs | Re-process the 7 titles | Provider account, fMP4/CMAF repackaging, re-process titles, FairPlay needs Apple approval |

Suggested order: build the in-house key service first (cheap, removes casual downloading and link
sharing, and every piece is reused by licensed DRM later), then add a licensed provider for the
black-screen protection.

## Mobile app
After the current App Store review: Android `FLAG_SECURE`, iOS screen-capture detection
(`UIScreen.isCaptured`) to blank the video while recording.
