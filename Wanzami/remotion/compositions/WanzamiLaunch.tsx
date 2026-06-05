import React from 'react';
import {
  AbsoluteFill, Audio, Img, Sequence,
  interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from 'remotion';

// ── Tokens ────────────────────────────────────────────────────────────────────
const OR  = '#fd7e14';
const OR2 = '#ff9f4d';
const BG  = '#04030a';
const W   = '#ffffff';

// ── Poster data (inline to avoid webpack JSON-import issues) ──────────────────
const POSTERS = [
  {title: 'Ruin',                   file: 'remotion-posters/poster-1.jpg'},
  {title: 'Those Focking Nigerians', file: 'remotion-posters/poster-2.jpg'},
  {title: 'Against Creation',        file: 'remotion-posters/poster-3.jpg'},
  {title: 'Traffick',               file: 'remotion-posters/poster-4.jpg'},
  {title: 'Quicksand',              file: 'remotion-posters/poster-5.jpg'},
  {title: 'Sons Of Adams',          file: 'remotion-posters/poster-6.png'},
];

// ── Spring / easing helpers ───────────────────────────────────────────────────
const sp = (f: number, fps: number, delay = 0, d = 85, s = 140) =>
  spring({frame: Math.max(0, f - delay), fps, config: {damping: d, stiffness: s}});

const remap = (f: number, i0: number, i1: number, o0 = 0, o1 = 1) =>
  interpolate(f, [i0, i1], [o0, o1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// ── Liquid glass ──────────────────────────────────────────────────────────────
const G = (x?: React.CSSProperties): React.CSSProperties => ({
  background: 'rgba(255,255,255,0.07)',
  border: '1.5px solid rgba(255,255,255,0.22)',
  backdropFilter: 'blur(28px) saturate(1.8) brightness(1.1)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.8) brightness(1.1)',
  boxShadow: [
    'inset 0 1.5px 0 rgba(255,255,255,0.30)',
    'inset 0 -1px 0 rgba(0,0,0,0.20)',
    '0 24px 64px rgba(0,0,0,0.55)',
    '0 1px 0 rgba(255,255,255,0.06)',
  ].join(', '),
  borderRadius: 28,
  ...x,
});

// ── Animated mesh background ──────────────────────────────────────────────────
const Bg: React.FC<{f: number; mul?: number}> = ({f, mul = 1}) => {
  const t = f / 900;
  const a = 15 + Math.sin(t * Math.PI * 4) * 14;
  const b = 25 + Math.cos(t * Math.PI * 3) * 12;
  const c = 82 + Math.cos(t * Math.PI * 3.5) * 10;
  const d = 68 + Math.sin(t * Math.PI * 2.5) * 14;
  return (
    <AbsoluteFill style={{background: `
      radial-gradient(ellipse 60% 45% at ${a}% ${b}%, rgba(253,126,20,${0.17*mul}) 0%, transparent 62%),
      radial-gradient(ellipse 50% 55% at ${c}% ${d}%, rgba(253,126,20,${0.10*mul}) 0%, transparent 58%),
      radial-gradient(ellipse 90% 70% at 50% 50%, rgba(20,8,4,0.55) 0%, transparent 72%),
      linear-gradient(158deg, #080408 0%, #04030a 52%, #060308 100%)
    `}} />
  );
};

// ── Particles (tiny floating dots) ───────────────────────────────────────────
const PARTICLE_COUNT = 22;
const Particles: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
    {Array.from({length: PARTICLE_COUNT}).map((_, i) => {
      const seed  = i * 137.5;
      const x     = ((seed * 7.3) % 100);
      const speed = 0.015 + (i % 5) * 0.006;
      const y     = ((seed * 3.1 + f * speed * 30) % 110) - 5;
      const size  = 2 + (i % 4);
      const op    = 0.15 + (i % 3) * 0.1;
      return (
        <div key={i} style={{
          position: 'absolute',
          left: `${x}%`, top: `${y}%`,
          width: size, height: size,
          borderRadius: '50%',
          background: OR,
          opacity: op,
          filter: 'blur(0.5px)',
        }} />
      );
    })}
  </AbsoluteFill>
);

// ── Scanline on phone screen ──────────────────────────────────────────────────
const Scanline: React.FC<{f: number; h: number}> = ({f, h}) => {
  const y = (f * 4) % (h + 40) - 20;
  return (
    <div style={{
      position: 'absolute',
      left: 0, right: 0,
      top: y,
      height: 3,
      background: `linear-gradient(90deg, transparent 0%, rgba(253,126,20,0.6) 20%, rgba(253,126,20,0.9) 50%, rgba(253,126,20,0.6) 80%, transparent 100%)`,
      pointerEvents: 'none',
    }} />
  );
};

// ── Phone mockup ──────────────────────────────────────────────────────────────
type PhoneProps = {src: string; scale?: number; scanFrame?: number};
const Phone: React.FC<PhoneProps> = ({src, scale = 1, scanFrame = -1}) => {
  const PW = 310, PH = 630, SW = 284, SH = 598;
  return (
    <div style={{
      width: PW, height: PH,
      transform: `scale(${scale})`,
      transformOrigin: 'top center',
      borderRadius: 46,
      background: 'linear-gradient(145deg, #1c1c20 0%, #0e0e12 60%, #1a1a1e 100%)',
      boxShadow: `0 0 0 1.5px rgba(255,255,255,0.13), 0 50px 100px rgba(0,0,0,0.75), 0 0 80px rgba(253,126,20,0.10)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'visible',
    }}>
      <div style={{width: SW, height: SH, borderRadius: 40, overflow: 'hidden', position: 'relative'}}>
        <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, transparent 45%)', pointerEvents: 'none'}} />
        {scanFrame >= 0 && <Scanline f={scanFrame} h={SH} />}
      </div>
      <div style={{position: 'absolute', top: 15, left: '50%', transform: 'translateX(-50%)', width: 96, height: 26, borderRadius: 999, background: '#0e0e12'}} />
      <div style={{position: 'absolute', right: -4, top: 160, width: 4, height: 60, borderRadius: 2, background: '#2a2a2e'}} />
    </div>
  );
};

// ── Glass stat card ───────────────────────────────────────────────────────────
type StatProps = {icon: string; label: string; sub: string; accent?: string};
const StatCard: React.FC<StatProps & {style?: React.CSSProperties}> = ({icon, label, sub, accent = OR, style}) => (
  <div style={{...G({padding: '18px 22px', borderRadius: 22, minWidth: 180}), ...style}}>
    <div style={{fontSize: 30}}>{icon}</div>
    <div style={{fontSize: 28, fontWeight: 900, color: W, marginTop: 6, lineHeight: 1}}>{label}</div>
    <div style={{fontSize: 16, color: 'rgba(210,225,255,0.65)', marginTop: 4, fontWeight: 500}}>{sub}</div>
    <div style={{marginTop: 10, height: 3, borderRadius: 999, background: `linear-gradient(90deg, ${accent}, transparent)`, width: '70%'}} />
  </div>
);

// ── Zoom-blur transition overlay ──────────────────────────────────────────────
const Trans: React.FC = () => {
  const f = useCurrentFrame();
  const dur = 14;
  const mid = dur / 2;
  const blur = f < mid
    ? remap(f, 0, mid, 0, 22)
    : remap(f, mid, dur, 22, 0);
  const sc = f < mid
    ? 1 + remap(f, 0, mid, 0, 0.08)
    : 1 + remap(f, mid, dur, 0.08, 0);
  const op = f < mid
    ? remap(f, 0, mid, 0, 0.65)
    : remap(f, mid, dur, 0.65, 0);
  return (
    <AbsoluteFill style={{
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      backgroundColor: `rgba(4,3,10,${op})`,
      transform: `scale(${sc})`,
      pointerEvents: 'none',
    }} />
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 1 — Impact Intro  (frames 0–89)
// ═══════════════════════════════════════════════════════════════════════════════
const SceneIntro: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoIn   = sp(f, fps, 10, 65, 110);
  const nameIn   = sp(f, fps, 24, 80, 120);
  const tagIn    = sp(f, fps, 36, 88, 115);
  const glow     = interpolate(f % 55, [0, 27, 55], [0.45, 1, 0.45]);
  const flash    = remap(f, 0, 8, 0.5, 0);

  const rings = [0, 8, 18];

  return (
    <AbsoluteFill>
      <Bg f={f} mul={1.3} />
      <Particles f={f} />

      <AbsoluteFill style={{backgroundColor: `rgba(253,126,20,${flash})`}} />

      {rings.map(offset => {
        const lf = f - offset;
        if (lf < 0) return null;
        const sc = remap(lf, 0, 60, 0.05, 3.5);
        const op = remap(lf, 0, 60, 0.9, 0);
        return (
          <div key={offset} style={{
            position: 'absolute', left: '50%', top: '42%',
            width: 180, height: 180, marginLeft: -90, marginTop: -90,
            borderRadius: '50%',
            border: `2.5px solid ${OR}`,
            transform: `scale(${sc})`,
            opacity: op,
            boxShadow: `0 0 30px 6px rgba(253,126,20,0.35), inset 0 0 30px rgba(253,126,20,0.1)`,
          }} />
        );
      })}

      <div style={{
        position: 'absolute', left: '50%', top: '42%',
        width: 360, height: 360, marginLeft: -180, marginTop: -180,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(253,126,20,${glow * 0.45}) 0%, transparent 70%)`,
      }} />

      <div style={{
        position: 'absolute', left: '50%', top: '38%',
        width: 160, height: 160, marginLeft: -80, marginTop: -80,
        transform: `scale(${logoIn}) rotate(${(1-logoIn)*-25}deg)`,
        filter: `drop-shadow(0 0 40px rgba(253,126,20,${glow}))`,
      }}>
        <Img src={staticFile('wanzami-logo.png')} style={{width: '100%', height: '100%'}} />
      </div>

      <div style={{
        position: 'absolute', left: 0, right: 0, top: '56%',
        textAlign: 'center',
        transform: `translateY(${(1-nameIn)*45}px) scale(${0.85+nameIn*0.15})`,
        opacity: nameIn,
      }}>
        <div style={{
          fontSize: 108, fontWeight: 900, letterSpacing: '0.10em', color: W,
          textShadow: `0 0 70px rgba(253,126,20,0.85), 0 0 140px rgba(253,126,20,0.35), 4px 4px 0 rgba(253,126,20,0.18)`,
        }}>WANZAMI</div>
      </div>

      <div style={{
        position: 'absolute', left: '50%', top: '76%',
        transform: `translateX(-50%) translateY(${(1-tagIn)*30}px)`,
        opacity: tagIn,
        ...G({padding: '12px 28px', borderRadius: 999, whiteSpace: 'nowrap'}),
      }}>
        <div style={{fontSize: 22, fontWeight: 700, color: 'rgba(220,235,255,0.9)', letterSpacing: '0.06em'}}>
          African Stories · Global Stage
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 2 — Dual Phone Showcase  (frames 90–270)
// ═══════════════════════════════════════════════════════════════════════════════
const SceneDualPhone: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();

  const phone1In = sp(f, fps, 0,  72, 120);
  const phone2In = sp(f, fps, 10, 72, 120);
  const card1In  = sp(f, fps, 20, 80, 130);
  const card2In  = sp(f, fps, 30, 80, 130);
  const card3In  = sp(f, fps, 40, 80, 130);
  const card4In  = sp(f, fps, 50, 80, 130);
  const titleIn  = sp(f, fps, 5,  85, 115);

  return (
    <AbsoluteFill>
      <Bg f={f + 90} />
      <Particles f={f} />

      <div style={{
        position: 'absolute', left: 50, right: 50, top: 70,
        textAlign: 'center',
        transform: `translateY(${(1-titleIn)*30}px)`,
        opacity: titleIn,
      }}>
        <div style={{fontSize: 44, fontWeight: 900, color: W, letterSpacing: '0.04em',
          textShadow: `0 0 40px rgba(253,126,20,0.5)`}}>
          Stream Everything. Anywhere.
        </div>
      </div>

      <div style={{
        position: 'absolute', left: '24%', top: '16%',
        transform: `translateX(${(1-phone1In)*-180}px) rotate(${(1-phone1In)*-8}deg)`,
        opacity: phone1In,
        filter: `drop-shadow(0 30px 60px rgba(0,0,0,0.7)) drop-shadow(0 0 40px rgba(253,126,20,0.2))`,
      }}>
        <Phone src="app-screens/screen-home.jpg" scale={1.15} scanFrame={f} />
      </div>

      <div style={{
        position: 'absolute', right: '24%', top: '21%',
        transform: `translateX(${(1-phone2In)*180}px) rotate(${(1-phone2In)*8}deg)`,
        opacity: phone2In,
        filter: `drop-shadow(0 30px 60px rgba(0,0,0,0.7)) drop-shadow(0 0 40px rgba(253,126,20,0.15))`,
      }}>
        <Phone src="app-screens/screen-movies.jpg" scale={1.05} />
      </div>

      <div style={{
        position: 'absolute', left: 40, top: '60%',
        transform: `translateX(${(1-card1In)*-80}px)`,
        opacity: card1In,
      }}>
        <StatCard icon="🎬" label="500+" sub="Titles & counting" />
      </div>

      <div style={{
        position: 'absolute', right: 40, top: '57%',
        transform: `translateX(${(1-card2In)*80}px)`,
        opacity: card2In,
      }}>
        <StatCard icon="⭐" label="Originals" sub="Wanzami Exclusives" accent="#a855f7" />
      </div>

      <div style={{
        position: 'absolute', left: 40, top: '75%',
        transform: `translateX(${(1-card3In)*-80}px)`,
        opacity: card3In,
      }}>
        <StatCard icon="🔴" label="Live" sub="Events in real time" accent="#ef4444" />
      </div>

      <div style={{
        position: 'absolute', right: 40, top: '78%',
        transform: `translateX(${(1-card4In)*80}px)`,
        opacity: card4In,
      }}>
        <StatCard icon="📱" label="Multi-device" sub="Watch on any screen" accent="#2dd4ff" />
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 3 — Content Wall  (frames 270–450)
// ═══════════════════════════════════════════════════════════════════════════════
const SceneContentWall: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();

  const badgeIn  = sp(f, fps, 5, 70, 130);
  const subIn    = sp(f, fps, 18, 82, 120);
  const gridIn   = sp(f, fps, 0, 65, 110);

  const grid = POSTERS.slice(0, 6);

  return (
    <AbsoluteFill>
      <Bg f={f + 270} mul={1.1} />
      <Particles f={f} />

      <div style={{
        position: 'absolute', left: 50, right: 50, top: 60,
        transform: `translateY(${(1-badgeIn)*40}px)`,
        opacity: badgeIn,
      }}>
        <div style={{
          ...G({padding: '16px 30px', borderRadius: 20, display: 'inline-block'}),
          background: `linear-gradient(135deg, rgba(253,126,20,0.22), rgba(255,159,77,0.12))`,
          border: `1.5px solid rgba(253,126,20,0.5)`,
        }}>
          <div style={{fontSize: 34, fontWeight: 900, color: OR, letterSpacing: '0.08em',
            textShadow: `0 0 30px rgba(253,126,20,0.7)`}}>
            🎬 WANZAMI ORIGINALS
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute', left: 50, right: 50, top: 160,
        transform: `translateY(${(1-subIn)*25}px)`,
        opacity: subIn,
      }}>
        <div style={{fontSize: 40, fontWeight: 800, color: W, lineHeight: 1.1,
          textShadow: '0 2px 20px rgba(0,0,0,0.8)'}}>
          Trending in Nigeria.
        </div>
        <div style={{fontSize: 24, color: 'rgba(200,218,255,0.65)', marginTop: 8, fontWeight: 500}}>
          Bold stories. Built for us.
        </div>
      </div>

      <div style={{
        position: 'absolute',
        left: 30, right: 30, top: 280,
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14,
        transform: `scale(${0.88 + gridIn * 0.12})`,
        opacity: gridIn,
      }}>
        {grid.map((p, i) => {
          const cardIn = sp(f, fps, i * 6, 78, 130);
          return (
            <div key={p.file} style={{
              transform: `translateY(${(1-cardIn)*50}px)`,
              opacity: cardIn,
            }}>
              <div style={{
                aspectRatio: '2/3',
                borderRadius: 18,
                overflow: 'hidden',
                border: i === 0 ? `2px solid ${OR}` : '1px solid rgba(255,255,255,0.15)',
                boxShadow: i === 0
                  ? `0 0 30px rgba(253,126,20,0.5), 0 20px 40px rgba(0,0,0,0.6)`
                  : '0 14px 30px rgba(0,0,0,0.5)',
                position: 'relative',
              }}>
                <Img src={staticFile(p.file)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)'}} />
                <div style={{
                  position: 'absolute', left: 8, right: 8, bottom: 8,
                  ...G({padding: '7px 10px', borderRadius: 12}),
                }}>
                  <div style={{fontSize: 15, fontWeight: 700, color: W, lineHeight: 1.2}}>{p.title}</div>
                </div>
                {i === 0 && (
                  <div style={{
                    position: 'absolute', top: 8, left: 8,
                    padding: '4px 10px', borderRadius: 999,
                    background: OR, color: '#000', fontSize: 13, fontWeight: 900,
                  }}>ORIGINAL</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 4 — Feature Showcase  (frames 450–630)
// ═══════════════════════════════════════════════════════════════════════════════
const FEATURES = [
  {icon: '🎬', label: 'Movies & Series', sub: 'From blockbusters to indie gems', color: OR},
  {icon: '🔴', label: 'Live Events',     sub: 'Stream live as it happens',       color: '#ef4444'},
  {icon: '💳', label: 'Pay Per View',    sub: 'No subscription pressure',        color: '#2dd4ff'},
  {icon: '📴', label: 'Download & Watch',sub: 'Watch offline, anywhere',         color: '#a855f7'},
];

const SceneFeatures: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();

  const titleIn = sp(f, fps, 0, 80, 120);
  const phoneIn = sp(f, fps, 8, 70, 110);

  return (
    <AbsoluteFill>
      <Bg f={f + 450} mul={1.2} />
      <Particles f={f} />

      <div style={{
        position: 'absolute', left: 50, right: 50, top: 60,
        transform: `translateY(${(1-titleIn)*35}px)`,
        opacity: titleIn,
      }}>
        <div style={{fontSize: 52, fontWeight: 900, color: W, letterSpacing: '-0.01em',
          textShadow: `0 0 50px rgba(253,126,20,0.6)`}}>
          Everything you need.
        </div>
      </div>

      <div style={{
        position: 'absolute', left: '50%', top: '18%',
        transform: `translateX(-50%) scale(${0.7 + phoneIn * 0.3})`,
        opacity: phoneIn,
        filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.8)) drop-shadow(0 0 60px rgba(253,126,20,0.25))',
      }}>
        <Phone src="app-screens/screen-home.jpg" scale={1.2} scanFrame={f} />
      </div>

      {FEATURES.map((feat, i) => {
        const cardIn = sp(f, fps, 15 + i * 12, 82, 130);
        const isLeft = i % 2 === 0;
        const accentRgb = feat.color === OR ? '253,126,20'
          : feat.color === '#ef4444' ? '239,68,68'
          : feat.color === '#2dd4ff' ? '45,212,255'
          : '168,85,247';
        return (
          <div key={feat.label} style={{
            position: 'absolute',
            left:  isLeft ? 28 : undefined,
            right: isLeft ? undefined : 28,
            top: `${48 + i * 12}%`,
            transform: `translateX(${(1-cardIn) * (isLeft ? -70 : 70)}px)`,
            opacity: cardIn,
          }}>
            <div style={{
              ...G({padding: '14px 18px', borderRadius: 20, width: 190}),
              borderColor: `rgba(${accentRgb},0.35)`,
            }}>
              <div style={{fontSize: 26}}>{feat.icon}</div>
              <div style={{fontSize: 20, fontWeight: 800, color: W, marginTop: 5}}>{feat.label}</div>
              <div style={{fontSize: 14, color: 'rgba(200,220,255,0.6)', marginTop: 3}}>{feat.sub}</div>
              <div style={{marginTop: 8, height: 2.5, borderRadius: 999,
                background: `linear-gradient(90deg, ${feat.color}, transparent)`, width: '65%'}} />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 5 — Finale CTA  (frames 630–900)
// ═══════════════════════════════════════════════════════════════════════════════
const SceneFinale: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoIn  = sp(f, fps, 0,  65, 110);
  const line1In = sp(f, fps, 14, 78, 130);
  const line2In = sp(f, fps, 22, 78, 130);
  const ctaIn   = sp(f, fps, 34, 85, 115);
  const statsIn = sp(f, fps, 45, 82, 118);
  const glow    = interpolate(f % 60, [0, 30, 60], [0.4, 1, 0.4]);

  return (
    <AbsoluteFill>
      <Bg f={f + 630} mul={1.4} />
      <Particles f={f} />

      <div style={{
        position: 'absolute', left: '50%', top: '30%',
        width: 550, height: 550, marginLeft: -275, marginTop: -275,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(253,126,20,${glow * 0.38}) 0%, transparent 68%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', left: '50%', top: '22%',
        width: 130, height: 130, marginLeft: -65, marginTop: -65,
        transform: `scale(${logoIn}) rotate(${(1-logoIn)*360}deg)`,
        filter: `drop-shadow(0 0 50px rgba(253,126,20,${glow}))`,
      }}>
        <Img src={staticFile('wanzami-logo.png')} style={{width: '100%', height: '100%'}} />
      </div>

      <div style={{
        position: 'absolute', left: 40, right: 40, top: '43%',
        textAlign: 'center',
        transform: `translateY(${(1-line1In)*50}px) scale(${0.9+line1In*0.1})`,
        opacity: line1In,
      }}>
        <div style={{
          fontSize: 96, fontWeight: 900, color: W, lineHeight: 0.95, letterSpacing: '-0.02em',
          textShadow: `0 0 80px rgba(253,126,20,0.85), 0 0 160px rgba(253,126,20,0.3), 5px 5px 0 rgba(253,126,20,0.15)`,
        }}>STREAM<br />AFRICA.</div>
      </div>

      <div style={{
        position: 'absolute', left: 40, right: 40, top: '65%',
        textAlign: 'center',
        transform: `translateY(${(1-line2In)*30}px)`,
        opacity: line2In,
      }}>
        <div style={{fontSize: 38, fontWeight: 700, color: 'rgba(210,228,255,0.75)', letterSpacing: '0.08em'}}>
          FEEL THE WORLD.
        </div>
      </div>

      <div style={{
        position: 'absolute', left: 50, right: 50, bottom: 210,
        transform: `translateY(${(1-ctaIn)*60}px)`,
        opacity: ctaIn,
      }}>
        <div style={{
          padding: '28px 0', borderRadius: 999, textAlign: 'center',
          background: `linear-gradient(135deg, ${OR} 0%, ${OR2} 100%)`,
          boxShadow: `0 0 70px rgba(253,126,20,${glow * 0.85}), 0 20px 50px rgba(0,0,0,0.55)`,
          color: '#0d0a06', fontSize: 34, fontWeight: 900, letterSpacing: '0.04em',
        }}>
          DOWNLOAD NOW
        </div>

        <div style={{marginTop: 14, display: 'flex', gap: 14}}>
          {['Google Play', 'App Store'].map(s => (
            <div key={s} style={{flex: 1, textAlign: 'center',
              ...G({padding: '16px 0', borderRadius: 18}),
              fontSize: 22, fontWeight: 700, color: 'rgba(220,235,255,0.9)'}}>
              {s}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 70, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 0,
        transform: `translateY(${(1-statsIn)*25}px)`,
        opacity: statsIn,
      }}>
        {['500+ Titles', 'Wanzami Originals', 'Stream Anywhere'].map((s, i) => (
          <React.Fragment key={s}>
            <div style={{fontSize: 19, color: 'rgba(180,200,230,0.5)', fontWeight: 600, letterSpacing: '0.04em'}}>{s}</div>
            {i < 2 && <div style={{fontSize: 19, color: 'rgba(253,126,20,0.4)', margin: '0 14px'}}>·</div>}
          </React.Fragment>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Root export — 900 frames / 30fps = 30s
// Scene 1:  0–89    (intro)
// Scene 2:  90–269  (dual phone)
// Scene 3:  270–449 (content wall)
// Scene 4:  450–629 (features)
// Scene 5:  630–899 (finale)
// ═══════════════════════════════════════════════════════════════════════════════
export type LaunchProps = {portrait?: boolean};

export const WanzamiLaunch: React.FC<LaunchProps> = () => {
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, system-ui, -apple-system, sans-serif', backgroundColor: BG, color: W}}>
      <Audio src={staticFile('wanzami-surround.wav')} volume={0.85} />

      {/* Drop upbeat.mp3 into public/ to activate second audio track */}
      {/* <Audio src={staticFile('upbeat.mp3')} startFrom={90} volume={0.7} /> */}

      <Sequence from={0} durationInFrames={90}><SceneIntro /></Sequence>

      <Sequence from={76} durationInFrames={14}><Trans /></Sequence>

      <Sequence from={90} durationInFrames={180}><SceneDualPhone /></Sequence>

      <Sequence from={256} durationInFrames={14}><Trans /></Sequence>

      <Sequence from={270} durationInFrames={180}><SceneContentWall /></Sequence>

      <Sequence from={436} durationInFrames={14}><Trans /></Sequence>

      <Sequence from={450} durationInFrames={180}><SceneFeatures /></Sequence>

      <Sequence from={616} durationInFrames={14}><Trans /></Sequence>

      <Sequence from={630} durationInFrames={270}><SceneFinale /></Sequence>
    </AbsoluteFill>
  );
};

export const WanzamiLaunch169: React.FC = () => <WanzamiLaunch />;
