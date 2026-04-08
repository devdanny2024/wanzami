const profiles = [
  { name: "Olukayode", variant: "o", bg: "linear-gradient(135deg, #ff8a1f 0%, #ef4444 52%, #ec4899 100%)" },
  { name: "MBO", variant: "female", bg: "linear-gradient(135deg, #facc15 0%, #f59e0b 55%, #fb923c 100%)" },
  { name: "Macie!", variant: "soft", bg: "linear-gradient(135deg, #38bdf8 0%, #06b6d4 50%, #2563eb 100%)" },
  { name: "Kids", variant: "kids", bg: "linear-gradient(135deg, #d946ef 0%, #fb923c 48%, #6366f1 100%)" },
  { name: "Add", variant: "add", bg: "linear-gradient(135deg, rgba(255,255,255,.18) 0%, rgba(255,255,255,.08) 100%)" },
  { name: "Edit", variant: "edit", bg: "linear-gradient(135deg, rgba(255,255,255,.18) 0%, rgba(255,255,255,.08) 100%)" },
] as const;

function AvatarGlyph({ variant }: { variant: (typeof profiles)[number]["variant"] }) {
  if (variant === "add") return <span className="glyph glyph-add">+</span>;
  if (variant === "edit") return <span className="glyph glyph-edit">✎</span>;
  if (variant === "kids") {
    return (
      <div className="kids-pill-wrap">
        <div className="kids-pill">KIDS</div>
      </div>
    );
  }

  return (
    <div className="avatar-shape">
      <div className="avatar-head" />
      <div className="avatar-body" />
      {variant === "o" ? <div className="avatar-letter">O</div> : null}
      {variant === "female" ? (
        <>
          <div className="avatar-hair-cap" />
          <div className="avatar-hair-fringe" />
        </>
      ) : null}
      {variant === "soft" ? (
        <>
          <div className="avatar-eye avatar-eye-left" />
          <div className="avatar-eye avatar-eye-right" />
          <div className="avatar-smile" />
        </>
      ) : null}
    </div>
  );
}

function ProfileTile({
  name,
  variant,
  bg,
}: {
  name: string;
  variant: (typeof profiles)[number]["variant"];
  bg: string;
}) {
  return (
    <button type="button" className="tileButton">
      <div className="tileCard" style={{ background: bg }}>
        <div className="tileShade" />
        <div className="tileInner">
          <AvatarGlyph variant={variant} />
        </div>
      </div>
      <span className="tileLabel">{name}</span>
    </button>
  );
}

export default function ProfileLabKora7Page() {
  return (
    <main className="pageShell">
      <div className="phoneFrame">
        <div className="posterBg" />
        <div className="posterOverlay" />
        <div className="bottomFade" />
        <div className="stageCurve" />
        <div className="stageLine" />
        <div className="stageGlow" />

        <div className="content">
          <div className="statusBar">
            <span>16:40</span>
            <div className="statusIcons">
              <span>◔</span>
              <span>◡</span>
              <span>▱</span>
            </div>
          </div>

          <div className="spacer" />

          <section className="titleBlock">
            <div className="brandText">Wanzami</div>
            <h1 className="titleText">Traffick</h1>
            <p className="subtitleText">Choose Your Profile</p>
          </section>

          <section className="gridWrap">
            <div className="profileGrid">
              {profiles.map((profile) => (
                <ProfileTile key={profile.name} {...profile} />
              ))}
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .pageShell {
          min-height: 100vh;
          background: #000;
          color: #fff;
        }

        .phoneFrame {
          position: relative;
          min-height: 100vh;
          max-width: 430px;
          margin: 0 auto;
          overflow: hidden;
          background: #000;
        }

        .posterBg,
        .posterOverlay,
        .bottomFade,
        .stageCurve,
        .stageLine,
        .stageGlow {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .posterBg {
          background-image: url('/remotion-posters/poster-4.jpg');
          background-size: cover;
          background-position: center;
          filter: saturate(0.96);
        }

        .posterOverlay {
          background:
            linear-gradient(to bottom, rgba(0,0,0,.18) 0%, rgba(0,0,0,.34) 44%, rgba(0,0,0,.92) 100%),
            radial-gradient(circle at top, rgba(253,126,20,.12), transparent 34%);
        }

        .bottomFade {
          inset: auto 0 0 0;
          height: 60%;
          background: linear-gradient(to top, rgba(17,10,10,.98) 0%, rgba(20,12,12,.94) 45%, rgba(0,0,0,0) 100%);
        }

        .stageCurve {
          left: -16%;
          right: -16%;
          top: auto;
          bottom: 20%;
          height: 205px;
          background: #201414;
          border-top-left-radius: 100% 100%;
          border-top-right-radius: 100% 100%;
          opacity: 0.98;
          filter: blur(1px);
        }

        .stageLine {
          inset: auto 10% 21.2% 10%;
          height: 1px;
          background: rgba(255,255,255,.08);
        }

        .stageGlow {
          inset: auto 24% 22.8% 24%;
          height: 24px;
          background: rgba(255,255,255,.05);
          filter: blur(14px);
          border-radius: 999px;
        }

        .content {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 16px 20px 28px;
        }

        .statusBar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          color: rgba(255,255,255,.92);
        }

        .statusIcons {
          display: flex;
          gap: 8px;
          font-size: 14px;
          color: rgba(255,255,255,.8);
        }

        .spacer {
          flex: 1;
        }

        .titleBlock {
          text-align: center;
          padding-bottom: 22px;
        }

        .brandText {
          margin-bottom: 8px;
          font-size: 11px;
          letter-spacing: 0.34em;
          text-transform: uppercase;
          color: rgba(255,255,255,.52);
        }

        .titleText {
          margin: 0 auto;
          max-width: 230px;
          font-size: 60px;
          line-height: 0.9;
          font-weight: 900;
          letter-spacing: -0.04em;
          text-transform: uppercase;
          text-shadow: 0 10px 28px rgba(0,0,0,.45);
        }

        .subtitleText {
          margin-top: 18px;
          font-size: 18px;
          color: rgba(255,255,255,.88);
        }

        .gridWrap {
          padding: 0 8px 2px;
        }

        .profileGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          column-gap: 16px;
          row-gap: 24px;
        }

        .tileButton {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: 0;
          color: inherit;
          cursor: pointer;
          padding: 0;
          transition: transform .22s ease;
        }

        .tileButton:hover {
          transform: scale(1.05);
        }

        .tileCard {
          position: relative;
          width: 76px;
          height: 76px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 12px 22px rgba(0,0,0,.28);
          border: 1px solid rgba(255,255,255,.1);
        }

        .tileShade {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,.30), transparent 58%, rgba(255,255,255,.1));
        }

        .tileInner {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tileLabel {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,.92);
        }

        .avatar-shape {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .avatar-head {
          position: absolute;
          left: 50%;
          top: 20%;
          width: 22px;
          height: 22px;
          transform: translateX(-50%);
          border-radius: 999px;
          background: rgba(255,255,255,.92);
          box-shadow: 0 2px 10px rgba(0,0,0,.15);
        }

        .avatar-body {
          position: absolute;
          left: 50%;
          top: 45%;
          width: 44px;
          height: 30px;
          transform: translateX(-50%);
          border-radius: 20px 20px 14px 14px;
          background: rgba(255,255,255,.88);
          box-shadow: 0 2px 10px rgba(0,0,0,.12);
        }

        .avatar-letter {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-top: 4px;
          font-size: 24px;
          font-weight: 900;
          color: rgba(0,0,0,.68);
        }

        .avatar-hair-cap {
          position: absolute;
          left: 50%;
          top: 16%;
          width: 28px;
          height: 28px;
          transform: translateX(-50%);
          border-radius: 999px;
          background: rgba(0,0,0,.18);
        }

        .avatar-hair-fringe {
          position: absolute;
          left: 50%;
          top: 17%;
          width: 32px;
          height: 11px;
          transform: translateX(-50%);
          border-radius: 999px;
          background: rgba(0,0,0,.22);
        }

        .avatar-eye {
          position: absolute;
          top: 32%;
          width: 3px;
          height: 3px;
          border-radius: 999px;
          background: rgba(0,0,0,.48);
        }

        .avatar-eye-left { left: 31%; }
        .avatar-eye-right { right: 31%; }

        .avatar-smile {
          position: absolute;
          left: 50%;
          top: 39%;
          width: 16px;
          height: 8px;
          transform: translateX(-50%);
          border-bottom: 2px solid rgba(0,0,0,.34);
          border-radius: 0 0 999px 999px;
        }

        .kids-pill-wrap {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kids-pill-wrap::before {
          content: '';
          position: absolute;
          left: 12px;
          right: 12px;
          top: 12px;
          height: 28px;
          border-radius: 999px;
          background: rgba(255,255,255,.16);
          filter: blur(10px);
        }

        .kids-pill {
          position: relative;
          z-index: 1;
          border: 1px solid rgba(255,255,255,.22);
          background: rgba(255,255,255,.1);
          color: #fff;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .28em;
          backdrop-filter: blur(6px);
        }

        .glyph {
          position: relative;
          z-index: 1;
          color: #fff;
        }

        .glyph-add {
          font-size: 40px;
          font-weight: 300;
        }

        .glyph-edit {
          font-size: 30px;
        }

        @media (min-width: 768px) {
          .phoneFrame {
            max-width: 480px;
          }

          .content {
            padding-left: 28px;
            padding-right: 28px;
          }

          .titleText {
            max-width: 280px;
            font-size: 68px;
          }

          .subtitleText {
            font-size: 20px;
          }

          .profileGrid {
            column-gap: 22px;
            row-gap: 28px;
          }

          .tileCard {
            width: 86px;
            height: 86px;
          }

          .tileLabel {
            font-size: 14px;
          }
        }
      `}</style>
    </main>
  );
}
