const profiles = [
  {
    name: "Olukayode",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    accent: "from-orange-500 to-red-500",
    ring: "ring-orange-400/70",
  },
  {
    name: "MBO",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    accent: "from-yellow-400 to-amber-500",
    ring: "ring-yellow-300/70",
  },
  {
    name: "Macie",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    accent: "from-sky-400 to-blue-600",
    ring: "ring-sky-300/70",
  },
  {
    name: "Kids",
    avatar: "https://randomuser.me/api/portraits/lego/2.jpg",
    accent: "from-pink-500 via-orange-400 to-indigo-500",
    ring: "ring-pink-300/70",
  },
];

const utilityActions = [
  { name: "Add Profile", icon: "+" },
  { name: "Manage Profiles", icon: "✎" },
];

function ProfileTile({
  name,
  avatar,
  accent,
  ring,
}: {
  name: string;
  avatar: string;
  accent: string;
  ring: string;
}) {
  return (
    <button
      type="button"
      className="group flex flex-col items-center gap-3 text-center transition-transform duration-300 hover:scale-105"
    >
      <div
        className={`relative flex h-22 w-22 md:h-24 md:w-24 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br ${accent} shadow-2xl ring-2 ${ring}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt={name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/10 opacity-80" />
      </div>
      <span className="text-sm font-medium text-white/90 group-hover:text-white md:text-base">{name}</span>
    </button>
  );
}

function UtilityAction({ name, icon }: { name: string; icon: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
    >
      <span className="text-base">{icon}</span>
      <span>{name}</span>
    </button>
  );
}

export default function ProfileLabKora7Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <div className="grid h-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 opacity-30">
          {[1, 2, 3, 4, 5, 6].map((poster) => (
            <div
              key={poster}
              className="bg-cover bg-center"
              style={{ backgroundImage: `url('/remotion-posters/poster-${poster}.jpg')` }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/60 to-black/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(253,126,20,0.18),transparent_38%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 md:px-10 lg:px-16">
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/wanzami-logo.png" alt="Wanzami" className="h-10 w-10 rounded-xl object-cover" />
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-white/50">Wanzami</div>
              <div className="text-sm text-white/80">Website profile preview</div>
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/65 backdrop-blur-sm">
            Test route
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <section className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-black/35 px-6 py-8 shadow-2xl backdrop-blur-md md:px-10 md:py-12">
            <div className="text-center">
              <div className="mb-4 inline-flex items-center rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] text-orange-400">
                Web-first concept preview
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
                Who&apos;s watching?
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
                A cleaner Wanzami website profile picker concept. This is a safe preview route before we connect anything to the real profile flow.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4 lg:gap-x-10 lg:gap-y-10">
              {profiles.map((profile) => (
                <ProfileTile key={profile.name} {...profile} />
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {utilityActions.map((action) => (
                <UtilityAction key={action.name} {...action} />
              ))}
            </div>

            <div className="mt-12 flex flex-col items-center justify-center gap-3 md:flex-row">
              <button
                type="button"
                className="rounded-full bg-[#fd7e14] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fd7e14]/20 transition hover:bg-[#e86f0f]"
              >
                Use this direction
              </button>
              <button
                type="button"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                Refine layout
              </button>
            </div>

            <div className="mt-8 text-center text-xs text-white/40">
              Preview only · route: /profile-lab-kora7
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
