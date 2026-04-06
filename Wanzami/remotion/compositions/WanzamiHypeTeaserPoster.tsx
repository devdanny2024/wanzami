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

type PosterHypeProps = {
  opener: string;
  closer: string;
  accentColor: string;
};

const ORANGE = '#fd7e14';
const ORANGE_LIGHT = '#ff9f4d';

const posters = (posterMeta as Array<{title: string; file: string}>).map((p) => ({
  title: p.title,
  file: p.file.replace(/^\//, ''),
}));

const PosterBackdrop: React.FC<{frame: number}> = ({frame}) => {
  return (
    <AbsoluteFill
      style={{
        background:
          'linear-gradient(135deg, #fff2e3 0%, #ffd9b8 45%, #ffc89a 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -40,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          opacity: 0.33,
          transform: `translateY(${interpolate(frame, [0, 479], [18, -22])}px)`,
        }}
      >
        {Array.from({length: 9}).map((_, i) => {
          const p = posters[i % posters.length];
          return (
            <div
              key={`${p.file}-${i}`}
              style={{
                borderRadius: 14,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.65)',
              }}
            >
              <Img src={staticFile(p.file)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </div>
          );
        })}
      </div>
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(255,243,230,0.42) 0%, rgba(255,218,184,0.5) 45%, rgba(16,12,8,0.64) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

const SceneOne: React.FC<{opener: string; accent: string}> = ({opener, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 120}});
  return (
    <AbsoluteFill>
      <PosterBackdrop frame={frame} />
      <div style={{position: 'absolute', top: 72, left: 56, display: 'flex', alignItems: 'center', gap: 14}}>
        <Img src={staticFile('wanzami-logo.png')} style={{width: 62, height: 62, borderRadius: 12}} />
        <div style={{fontSize: 44, fontWeight: 900, color: '#1b120a'}}>WANZAMI</div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 56,
          right: 56,
          top: 410,
          fontSize: 92,
          lineHeight: 0.95,
          textTransform: 'uppercase',
          fontWeight: 900,
          color: '#fff',
          textShadow: '0 18px 30px rgba(0,0,0,0.45)',
          transform: `translateY(${(1 - pop) * 65}px)`,
          opacity: pop,
        }}
      >
        {opener}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 56,
          right: 56,
          bottom: 170,
          fontSize: 30,
          color: '#f6f8fb',
          fontWeight: 700,
          borderLeft: `7px solid ${accent}`,
          paddingLeft: 14,
          textShadow: '0 8px 18px rgba(0,0,0,0.32)',
        }}
      >
        Not just streaming. A whole new African entertainment vibe.
      </div>
    </AbsoluteFill>
  );
};

const SceneTwo: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = Math.floor(frame / 16) % posters.length;
  return (
    <AbsoluteFill>
      <PosterBackdrop frame={frame + 50} />
      <div style={{position: 'absolute', top: 84, left: 52, right: 52, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16}}>
        {posters.slice(0, 4).map((p, i) => {
          const local = (frame + i * 5) % 80;
          const zoom = interpolate(local, [0, 40, 79], [1.02, 1.12, 1.03]);
          return (
            <div key={p.file} style={{position: 'relative', height: 360, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 35px rgba(0,0,0,0.35)'}}>
              <Img src={staticFile(p.file)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`}} />
              <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)'}} />
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 52, right: 52, bottom: 120, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(20,13,8,0.66)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 16, padding: '14px 18px'}}>
        <div style={{fontSize: 34, fontWeight: 900, color: '#fff'}}>{posters[idx].title.toUpperCase()}</div>
        <div style={{fontSize: 22, fontWeight: 900, color: ORANGE, border: `2px solid ${ORANGE}`, borderRadius: 999, padding: '8px 14px'}}>WATCH</div>
      </div>
    </AbsoluteFill>
  );
};

const SceneThree: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = ['ORIGINALS', 'LIVE EVENTS', 'TOP MOVIES', 'BINGE SERIES'];
  return (
    <AbsoluteFill>
      <PosterBackdrop frame={frame + 120} />
      <div style={{position: 'absolute', top: 180, left: 56, right: 56, fontSize: 68, fontWeight: 900, color: '#fff', textShadow: '0 14px 22px rgba(0,0,0,0.4)'}}>
        THIS IS WHY THEY ASKING.
      </div>
      <div style={{position: 'absolute', left: 56, right: 56, top: 340, display: 'flex', flexDirection: 'column', gap: 16}}>
        {rows.map((r, i) => {
          const local = Math.max(frame - i * 8, 0);
          const y = interpolate(local, [0, 14], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const o = interpolate(local, [0, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <div key={r} style={{transform: `translateY(${y}px)`, opacity: o, backgroundColor: 'rgba(18,12,8,0.68)', border: '1px solid rgba(255,255,255,0.22)', borderLeft: `7px solid ${ORANGE}`, borderRadius: 14, padding: '16px 18px', fontSize: 40, color: '#fff', fontWeight: 900}}>
              {r}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const SceneFour: React.FC<{closer: string}> = ({closer}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 95}});
  return (
    <AbsoluteFill>
      <PosterBackdrop frame={frame + 220} />
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,245,235,0.1) 0%, rgba(8,6,5,0.82) 100%)'}} />
      <div style={{position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center', color: '#fff', fontWeight: 800, letterSpacing: '0.18em', fontSize: 30}}>WHAT IS WANZAMI?</div>
      <div style={{position: 'absolute', top: 300, left: 72, right: 72, textAlign: 'center', color: '#fff', fontWeight: 900, fontSize: 96, lineHeight: 0.95, transform: `scale(${0.92 + pop * 0.08})`}}>{closer}</div>
      <div style={{position: 'absolute', bottom: 240, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_LIGHT})`, color: '#111', borderRadius: 999, padding: '18px 28px', fontSize: 36, fontWeight: 900}}>
          <Img src={staticFile('wanzami-logo.png')} style={{width: 42, height: 42, borderRadius: 10}} />
          WANZAMI.TV
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const WanzamiHypeTeaserPoster: React.FC<PosterHypeProps> = ({opener, closer, accentColor}) => {
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, system-ui, sans-serif', color: '#fff'}}>
      <Audio src={staticFile('wanzami-surround.wav')} volume={0.35} />
      <Sequence from={0} durationInFrames={95}>
        <SceneOne opener={opener} accent={accentColor || ORANGE} />
      </Sequence>
      <Sequence from={95} durationInFrames={130}>
        <SceneTwo />
      </Sequence>
      <Sequence from={225} durationInFrames={115}>
        <SceneThree />
      </Sequence>
      <Sequence from={340} durationInFrames={140}>
        <SceneFour closer={closer} />
      </Sequence>
    </AbsoluteFill>
  );
};
