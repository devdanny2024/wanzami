import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type WanzamiPromoProps = {
  prompt: string;
  cta: string;
  vibe: 'cinematic' | 'energetic' | 'minimal';
  accentColor: string;
};

const vibeBackground = (vibe: WanzamiPromoProps['vibe']) => {
  if (vibe === 'energetic') {
    return 'radial-gradient(circle at 20% 20%, #1d4ed8, #0b1020 65%)';
  }

  if (vibe === 'minimal') {
    return 'linear-gradient(180deg, #0f172a 0%, #020617 100%)';
  }

  return 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #030712 100%)';
};

export const WanzamiPromo: React.FC<WanzamiPromoProps> = ({prompt, cta, vibe, accentColor}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const reveal = spring({
    frame,
    fps,
    config: {
      damping: 200,
    },
  });

  const overlayOpacity = interpolate(frame, [0, 40, 250, 299], [0, 0.35, 0.35, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: vibeBackground(vibe),
        color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif',
        letterSpacing: '-0.01em',
      }}
    >
      <AbsoluteFill
        style={{
          opacity: overlayOpacity,
          background:
            'linear-gradient(180deg, rgba(245,158,11,0.3) 0%, rgba(2,6,23,0.2) 40%, rgba(2,6,23,0.95) 100%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 70,
          right: 70,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{fontSize: 56, fontWeight: 800}}>WANZAMI</div>
        <div
          style={{
            fontSize: 28,
            padding: '14px 22px',
            borderRadius: 999,
            border: `2px solid ${accentColor}`,
            color: accentColor,
            fontWeight: 700,
          }}
        >
          PROMPT VIDEO
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 70,
          right: 70,
          bottom: 250,
          transform: `translateY(${(1 - reveal) * 80}px)`,
          opacity: reveal,
        }}
      >
        <div
          style={{
            fontSize: 74,
            lineHeight: 1.02,
            fontWeight: 900,
            marginBottom: 28,
            textTransform: 'uppercase',
          }}
        >
          {prompt}
        </div>

        <div
          style={{
            fontSize: 38,
            color: '#e2e8f0',
            marginBottom: 40,
            lineHeight: 1.25,
          }}
        >
          African stories. Live experiences. Premium streaming moments.
        </div>

        <div
          style={{
            display: 'inline-block',
            fontSize: 34,
            fontWeight: 800,
            backgroundColor: accentColor,
            color: '#111827',
            borderRadius: 20,
            padding: '20px 30px',
          }}
        >
          {cta}
        </div>
      </div>
    </AbsoluteFill>
  );
};
