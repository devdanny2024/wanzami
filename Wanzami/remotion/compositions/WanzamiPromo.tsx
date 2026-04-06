import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export type WanzamiPromoProps = {
  prompt: string;
  cta: string;
  vibe: 'cinematic' | 'energetic' | 'minimal';
  accentColor: string;
};

const BRAND = {
  bg: '#0b0b0c',
  panel: '#141414',
  accent: '#fd7e14',
  accentLight: '#ff9f4d',
  text: '#ffffff',
  muted: '#b9bcc2',
};

const sceneFrameRanges = [
  { start: 0, end: 74 },
  { start: 75, end: 149 },
  { start: 150, end: 224 },
  { start: 225, end: 299 },
];

const inScene = (frame: number, start: number, end: number) => frame >= start && frame <= end;

const sceneOpacity = (frame: number, start: number, end: number) => {
  const fadeIn = interpolate(frame, [start, start + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [end - 8, end], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return Math.min(fadeIn, fadeOut);
};

const Headline: React.FC<{ title: string; subtitle?: string; frame: number; start: number; end: number }> = ({
  title,
  subtitle,
  frame,
  start,
  end,
}) => {
  const opacity = sceneOpacity(frame, start, end);

  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        bottom: 250,
        opacity,
      }}
    >
      <div
        style={{
          color: BRAND.text,
          fontSize: 82,
          lineHeight: 1,
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          marginBottom: 22,
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div
          style={{
            color: BRAND.muted,
            fontSize: 36,
            lineHeight: 1.25,
            maxWidth: 920,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
};

export const WanzamiPromo: React.FC<WanzamiPromoProps> = ({prompt, cta, vibe, accentColor}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pulse = spring({
    frame,
    fps,
    config: {damping: 120},
  });

  const activeAccent = accentColor || BRAND.accent;

  const ambientX = interpolate(frame, [0, 299], [-40, 30]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(145deg, ${BRAND.bg} 0%, #101114 55%, ${BRAND.bg} 100%)`,
        color: BRAND.text,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 20% 15%, rgba(253,126,20,0.22), rgba(0,0,0,0) 45%), radial-gradient(ellipse at 85% 90%, rgba(255,159,77,0.14), rgba(0,0,0,0) 50%)',
          transform: `translateX(${ambientX}px) scale(${1 + pulse * 0.01})`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 85,
          left: 70,
          right: 70,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <Img src={staticFile('wanzami-logo.png')} style={{width: 62, height: 62, borderRadius: 12}} />
          <div style={{fontSize: 48, fontWeight: 800, letterSpacing: '0.03em'}}>WANZAMI</div>
        </div>
        <div
          style={{
            fontSize: 24,
            padding: '12px 18px',
            borderRadius: 999,
            border: `2px solid ${activeAccent}`,
            color: activeAccent,
            fontWeight: 700,
            backgroundColor: 'rgba(0,0,0,0.25)',
          }}
        >
          AFRICAN STREAMING
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.45) 62%, rgba(0,0,0,0.84) 100%)',
        }}
      />

      {inScene(frame, sceneFrameRanges[0].start, sceneFrameRanges[0].end) ? (
        <Headline
          title={prompt}
          subtitle="Movies. Series. Live events. One home for African entertainment."
          frame={frame}
          start={sceneFrameRanges[0].start}
          end={sceneFrameRanges[0].end}
        />
      ) : null}

      {inScene(frame, sceneFrameRanges[1].start, sceneFrameRanges[1].end) ? (
        <div
          style={{
            position: 'absolute',
            left: 70,
            right: 70,
            bottom: 235,
            opacity: sceneOpacity(frame, sceneFrameRanges[1].start, sceneFrameRanges[1].end),
          }}
        >
          <div style={{fontSize: 66, fontWeight: 850, marginBottom: 26, textTransform: 'uppercase'}}>Built from the Wanzami catalogue</div>
          <div style={{display: 'flex', gap: 16, flexWrap: 'wrap'}}>
            {['Blockbuster Movies', 'Binge-worthy Series', 'Wanzami Originals', 'Live & Upcoming Streams'].map((item) => (
              <div
                key={item}
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  padding: '14px 22px',
                  borderRadius: 999,
                  border: `2px solid ${activeAccent}`,
                  color: BRAND.text,
                  backgroundColor: 'rgba(253,126,20,0.14)',
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {inScene(frame, sceneFrameRanges[2].start, sceneFrameRanges[2].end) ? (
        <div
          style={{
            position: 'absolute',
            left: 70,
            right: 70,
            bottom: 225,
            opacity: sceneOpacity(frame, sceneFrameRanges[2].start, sceneFrameRanges[2].end),
          }}
        >
          <div style={{fontSize: 64, fontWeight: 850, marginBottom: 28, textTransform: 'uppercase'}}>Personalized for every viewer</div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18}}>
            {[
              'Continue Watching, right where you paused',
              'Because You Watched recommendations',
              'For You picks tailored to your taste',
              'Clean cinematic UI in Wanzami orange + deep black',
            ].map((item) => (
              <div
                key={item}
                style={{
                  backgroundColor: BRAND.panel,
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderLeft: `6px solid ${activeAccent}`,
                  borderRadius: 18,
                  padding: '18px 20px',
                  fontSize: 28,
                  lineHeight: 1.22,
                  color: '#f1f4f9',
                  fontWeight: 600,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {inScene(frame, sceneFrameRanges[3].start, sceneFrameRanges[3].end) ? (
        <div
          style={{
            position: 'absolute',
            left: 70,
            right: 70,
            bottom: 220,
            opacity: sceneOpacity(frame, sceneFrameRanges[3].start, sceneFrameRanges[3].end),
          }}
        >
          <div style={{fontSize: 74, fontWeight: 900, lineHeight: 1.02, marginBottom: 20, textTransform: 'uppercase'}}>
            Your next obsession starts on Wanzami.
          </div>
          <div style={{fontSize: 34, color: '#d7dce3', marginBottom: 34}}>
            Stream premium African stories, exclusives, and live moments.
          </div>
          <div
            style={{
              display: 'inline-block',
              background: `linear-gradient(135deg, ${BRAND.accent} 0%, ${BRAND.accentLight} 100%)`,
              color: '#101114',
              fontSize: 36,
              fontWeight: 900,
              borderRadius: 22,
              padding: '22px 32px',
            }}
          >
            {cta}
          </div>
        </div>
      ) : null}

      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 70,
          right: 70,
          display: 'flex',
          gap: 10,
        }}
      >
        {sceneFrameRanges.map((scene, idx) => {
          const active = inScene(frame, scene.start, scene.end);
          return (
            <div
              key={idx}
              style={{
                flex: 1,
                height: 8,
                borderRadius: 99,
                backgroundColor: active ? activeAccent : 'rgba(255,255,255,0.28)',
              }}
            />
          );
        })}
      </div>

      {vibe === 'energetic' ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            mixBlendMode: 'screen',
            background:
              'radial-gradient(circle at 70% 30%, rgba(253,126,20,0.16), rgba(0,0,0,0) 38%), radial-gradient(circle at 30% 80%, rgba(255,159,77,0.12), rgba(0,0,0,0) 42%)',
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
