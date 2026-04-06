import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import posterMeta from '../../public/remotion-posters/posters.json';

type PulseProps = {
  hook: string;
  cta: string;
  accentColor: string;
};

const posters = (posterMeta as Array<{title: string; file: string}>).map((p) => ({
  title: p.title,
  file: p.file.replace(/^\//, ''),
}));

const BG = '#080b14';
const ORANGE = '#fd7e14';
const CYAN = '#2dd4ff';

const BrandTop: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: 54,
      left: 54,
      right: 54,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 50,
    }}
  >
    <div style={{display: 'flex', gap: 14, alignItems: 'center'}}>
      <Img src={staticFile('wanzami-logo.png')} style={{width: 56, height: 56, borderRadius: 12}} />
      <div style={{fontSize: 38, color: '#fff', fontWeight: 900, letterSpacing: '0.04em'}}>WANZAMI</div>
    </div>
    <div
      style={{
        fontSize: 18,
        color: '#d6e4ff',
        padding: '10px 14px',
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.28)',
        backgroundColor: 'rgba(8,11,20,0.45)',
        backdropFilter: 'blur(6px)',
      }}
    >
      AFRICAN ENTERTAINMENT
    </div>
  </div>
);

const Opening: React.FC<{hook: string; accent: string}> = ({hook, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 110}});

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at 20% 20%, rgba(45,212,255,0.18), rgba(8,11,20,0) 40%), radial-gradient(circle at 80% 75%, rgba(253,126,20,0.22), rgba(8,11,20,0) 45%), linear-gradient(145deg, #0b1021 0%, #090d1a 52%, #070a14 100%)',
      }}
    >
      <BrandTop />

      <div
        style={{
          position: 'absolute',
          top: 300,
          left: 70,
          right: 70,
          textAlign: 'center',
          transform: `translateY(${(1 - pop) * 70}px)`,
          opacity: pop,
        }}
      >
        <div style={{fontSize: 104, fontWeight: 900, color: '#fff', lineHeight: 0.95, textTransform: 'uppercase', letterSpacing: '-0.03em'}}>
          {hook}
        </div>
        <div style={{marginTop: 24, fontSize: 30, color: '#d3deef', fontWeight: 600}}>
          Movies. Series. Originals. Live events.
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 160,
          right: 160,
          bottom: 240,
          height: 6,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.2)',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, frame * 2.4)}%`,
            height: '100%',
            borderRadius: 999,
            background: `linear-gradient(90deg, ${CYAN} 0%, ${accent} 100%)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const PosterRun: React.FC = () => {
  const frame = useCurrentFrame();
  const center = Math.floor(frame / 22) % posters.length;

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 10%, rgba(45,212,255,0.12), rgba(8,11,20,0) 40%), radial-gradient(circle at 80% 90%, rgba(253,126,20,0.16), rgba(8,11,20,0) 36%)',
        }}
      />
      <BrandTop />

      <div style={{position: 'absolute', inset: '180px 40px 260px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {posters.map((p, i) => {
          const distance = i - center;
          const abs = Math.abs(distance);
          const x = distance * 190;
          const scale = abs === 0 ? 1 : abs === 1 ? 0.84 : 0.66;
          const opacity = abs > 2 ? 0 : abs === 2 ? 0.4 : abs === 1 ? 0.75 : 1;
          const rotate = distance * -7;
          const y = abs === 0 ? -8 : abs === 1 ? 20 : 48;

          return (
            <div
              key={p.file}
              style={{
                position: 'absolute',
                width: 280,
                height: 420,
                borderRadius: 20,
                overflow: 'hidden',
                border: abs === 0 ? `3px solid ${ORANGE}` : '1px solid rgba(255,255,255,0.22)',
                transform: `translateX(${x}px) translateY(${y}px) scale(${scale}) rotate(${rotate}deg)`,
                opacity,
                boxShadow: abs === 0 ? '0 28px 50px rgba(0,0,0,0.55)' : '0 18px 30px rgba(0,0,0,0.4)',
              }}
            >
              <Img src={staticFile(p.file)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.86) 100%)',
                }}
              />
              <div style={{position: 'absolute', left: 14, right: 14, bottom: 12, color: '#fff', fontSize: 24, fontWeight: 800, lineHeight: 1.1}}>
                {p.title}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{position: 'absolute', left: 50, right: 50, bottom: 110, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
        {['LIVE NOW', 'NEW MOVIES', 'SERIES DROP', 'ORIGINALS'].map((chip, i) => (
          <div
            key={chip}
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.25)',
              backgroundColor: i % 2 === 0 ? 'rgba(45,212,255,0.16)' : 'rgba(253,126,20,0.18)',
              color: '#f1f7ff',
              fontSize: 21,
              fontWeight: 800,
              textAlign: 'center',
            }}
          >
            {chip}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Finale: React.FC<{cta: string; accent: string}> = ({cta, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 95}});
  const glow = interpolate(frame, [0, 70, 120], [0.2, 0.7, 0.25]);

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at 50% 40%, rgba(45,212,255,0.15), rgba(8,11,20,0) 40%), linear-gradient(155deg, #0b1022 0%, #070b16 100%)',
      }}
    >
      <BrandTop />

      <div
        style={{
          position: 'absolute',
          left: 70,
          right: 70,
          top: 420,
          textAlign: 'center',
          transform: `scale(${0.9 + pop * 0.1})`,
        }}
      >
        <div style={{fontSize: 86, color: '#fff', fontWeight: 900, lineHeight: 0.95, textTransform: 'uppercase'}}>This is Wanzami.</div>
        <div style={{marginTop: 20, fontSize: 30, color: '#d4dff0'}}>The platform everyone keeps asking about.</div>
      </div>

      <div style={{position: 'absolute', bottom: 250, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 14,
            padding: '20px 30px',
            borderRadius: 999,
            background: `linear-gradient(135deg, ${accent} 0%, #ff9f4d 100%)`,
            boxShadow: `0 0 44px rgba(253,126,20,${glow})`,
            color: '#101218',
            fontSize: 34,
            fontWeight: 900,
          }}
        >
          <Img src={staticFile('wanzami-logo.png')} style={{width: 44, height: 44, borderRadius: 10}} />
          {cta}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const WanzamiPulseTrailer: React.FC<PulseProps> = ({hook, cta, accentColor}) => {
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, system-ui, sans-serif', color: '#fff'}}>
      <Audio src={staticFile('wanzami-surround.wav')} volume={0.4} />
      <Sequence from={0} durationInFrames={130}>
        <Opening hook={hook} accent={accentColor || ORANGE} />
      </Sequence>
      <Sequence from={130} durationInFrames={220}>
        <PosterRun />
      </Sequence>
      <Sequence from={350} durationInFrames={130}>
        <Finale cta={cta} accent={accentColor || ORANGE} />
      </Sequence>
    </AbsoluteFill>
  );
};
