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

type HypeProps = {
  opener: string;
  closer: string;
  accentColor: string;
};

const BG = '#0b0b0c';
const ORANGE = '#fd7e14';
const ORANGE_LIGHT = '#ff9f4d';

const posters = (posterMeta as Array<{title: string; file: string}>).map((p) => ({
  title: p.title,
  file: p.file.replace(/^\//, ''),
}));

const titleCase = (text: string) => text.toUpperCase();

const ColdOpen: React.FC<{opener: string; accent: string}> = ({opener, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 120}});
  const flicker = frame % 7 === 0 ? 0.85 : 1;

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(253,126,20,0.35), rgba(0,0,0,0) 35%), radial-gradient(circle at 85% 80%, rgba(255,159,77,0.2), rgba(0,0,0,0) 38%)',
          transform: `scale(${1 + pop * 0.02})`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 86,
          left: 68,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          opacity: flicker,
        }}
      >
        <Img src={staticFile('wanzami-logo.png')} style={{width: 72, height: 72, borderRadius: 12}} />
        <div style={{fontSize: 48, fontWeight: 900, letterSpacing: '0.03em'}}>WANZAMI</div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 68,
          right: 68,
          top: 430,
          fontSize: 92,
          lineHeight: 0.95,
          textTransform: 'uppercase',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          color: '#fff',
          transform: `translateY(${(1 - pop) * 70}px)`,
          opacity: pop,
        }}
      >
        {titleCase(opener)}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 68,
          right: 68,
          bottom: 170,
          fontSize: 30,
          color: '#cfd3db',
          fontWeight: 600,
          borderLeft: `6px solid ${accent}`,
          paddingLeft: 16,
        }}
      >
        African stories. Originals. Live moments. One destination.
      </div>
    </AbsoluteFill>
  );
};

const PosterMontage: React.FC = () => {
  const frame = useCurrentFrame();
  const index = Math.floor(frame / 18) % posters.length;

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
          padding: '140px 42px 180px',
        }}
      >
        {posters.slice(0, 4).map((p, i) => {
          const local = (frame + i * 4) % 90;
          const zoom = interpolate(local, [0, 45, 89], [1.06, 1.14, 1.06]);
          const y = interpolate(local, [0, 89], [8, -8]);
          return (
            <div
              key={`${p.file}-${i}`}
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 18,
                border: '1px solid rgba(255,255,255,0.14)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.48)',
              }}
            >
              <Img
                src={staticFile(p.file)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: `translateY(${y}px) scale(${zoom})`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.86) 100%)',
                }}
              />
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 74,
          left: 42,
          right: 42,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{fontSize: 28, color: ORANGE, fontWeight: 800, letterSpacing: '0.18em'}}>NOW TRENDING</div>
        <div style={{fontSize: 24, color: '#c8ccd2', fontWeight: 700}}>00:{String(frame).padStart(2, '0')}</div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 42,
          right: 42,
          bottom: 88,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(9,10,12,0.75)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 16,
          padding: '16px 18px',
          backdropFilter: 'blur(6px)',
        }}
      >
        <div style={{fontSize: 34, fontWeight: 900, color: '#fff'}}>{titleCase(posters[index].title)}</div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: ORANGE,
            border: `2px solid ${ORANGE}`,
            borderRadius: 999,
            padding: '8px 14px',
          }}
        >
          PLAY
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FeaturesBlast: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = [
    'BLOCKBUSTER MOVIES',
    'BINGE-WORTHY SERIES',
    'WANZAMI ORIGINALS',
    'LIVE EVENTS + REPLAYS',
  ];

  return (
    <AbsoluteFill style={{backgroundColor: '#0d0d10'}}>
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(145deg, rgba(253,126,20,0.17), rgba(0,0,0,0) 38%), linear-gradient(300deg, rgba(255,159,77,0.1), rgba(0,0,0,0) 35%)',
        }}
      />
      <div style={{position: 'absolute', top: 100, left: 60, fontSize: 64, fontWeight: 900}}>WHY PEOPLE STAY WATCHING</div>

      <div style={{position: 'absolute', left: 60, right: 60, top: 280, display: 'flex', flexDirection: 'column', gap: 18}}>
        {rows.map((row, i) => {
          const delay = i * 10;
          const local = Math.max(frame - delay, 0);
          const rise = interpolate(local, [0, 18], [40, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const opacity = interpolate(local, [0, 14], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div
              key={row}
              style={{
                transform: `translateY(${rise}px)`,
                opacity,
                backgroundColor: 'rgba(17,18,22,0.92)',
                borderRadius: 16,
                borderLeft: `8px solid ${ORANGE}`,
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '18px 22px',
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: '0.01em',
              }}
            >
              {row}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const FinalPunch: React.FC<{closer: string; accent: string}> = ({closer, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 90}});

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 50%, rgba(253,126,20,0.22), ${BG} 55%)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 180,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 30,
          color: '#bcc2ca',
          letterSpacing: '0.2em',
          fontWeight: 700,
        }}
      >
        PEOPLE ARE ASKING...
      </div>

      <div
        style={{
          position: 'absolute',
          top: 260,
          left: 70,
          right: 70,
          textAlign: 'center',
          fontSize: 98,
          lineHeight: 0.95,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          transform: `scale(${0.9 + pop * 0.1})`,
        }}
      >
        {titleCase(closer)}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 680,
          left: 110,
          right: 110,
          height: 4,
          backgroundColor: 'rgba(255,255,255,0.24)',
        }}
      >
        <div style={{width: `${Math.min(100, frame * 2)}%`, height: '100%', backgroundColor: accent}} />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 260,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 16,
            padding: '18px 28px',
            borderRadius: 999,
            background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_LIGHT})`,
            color: '#111',
            fontWeight: 900,
            fontSize: 36,
          }}
        >
          <Img src={staticFile('wanzami-logo.png')} style={{width: 44, height: 44, borderRadius: 10}} />
          WANZAMI.TV
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 130,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: '#d3d7dd',
          fontSize: 30,
          fontWeight: 700,
        }}
      >
        Stream premium African entertainment now.
      </div>
    </AbsoluteFill>
  );
};

export const WanzamiHypeTeaser: React.FC<HypeProps> = ({opener, closer, accentColor}) => {
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: 'Inter, system-ui, sans-serif', color: '#fff'}}>
      <Audio src={staticFile('wanzami-surround.wav')} volume={0.35} />
      <Sequence from={0} durationInFrames={95}>
        <ColdOpen opener={opener} accent={accentColor || ORANGE} />
      </Sequence>
      <Sequence from={95} durationInFrames={140}>
        <PosterMontage />
      </Sequence>
      <Sequence from={235} durationInFrames={115}>
        <FeaturesBlast />
      </Sequence>
      <Sequence from={350} durationInFrames={130}>
        <FinalPunch closer={closer} accent={accentColor || ORANGE} />
      </Sequence>
    </AbsoluteFill>
  );
};
