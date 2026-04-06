# Wanzami Remotion Setup

This folder adds prompt-based promo video rendering for Wanzami.

## Available composition
- `WanzamiPromo` (1080x1920, 30fps, 10s)

## Commands
```bash
npm run video:studio
npm run video:render
```

`video:render` writes output to:
- `out/wanzami-promo.mp4`

## Prompt-based render examples
### PowerShell
```powershell
npx remotion render remotion/index.ts WanzamiPromo out/wanzami-promo-custom.mp4 --props '{"prompt":"Binge Nollywood originals and live events on Wanzami.","cta":"Download Wanzami today","vibe":"cinematic","accentColor":"#22c55e"}'
```

### Bash
```bash
npx remotion render remotion/index.ts WanzamiPromo out/wanzami-promo-custom.mp4 --props='{"prompt":"Binge Nollywood originals and live events on Wanzami.","cta":"Download Wanzami today","vibe":"cinematic","accentColor":"#22c55e"}'
```

## Props
- `prompt`: Main message displayed as headline
- `cta`: Call-to-action text
- `vibe`: `cinematic | energetic | minimal`
- `accentColor`: Brand accent for CTA and tag
