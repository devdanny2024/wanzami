const profiles = [
  {
    name: "Olukayode",
    avatar: "/wanzami-logo.png",
    accent: "from-orange-500 to-red-500",
    ring: "ring-orange-400/70",
  },
  {
    name: "MBO",
    emoji: "🙂",
    accent: "from-yellow-400 to-amber-500",
    ring: "ring-yellow-300/70",
  },
  {
    name: "Macie!",
    emoji: "☺️",
    accent: "from-sky-400 to-blue-600",
    ring: "ring-sky-300/70",
  },
  {
    name: "Kids",
    label: "KIDS",
    accent: "from-pink-500 via-orange-400 to-indigo-500",
    ring: "ring-pink-300/70",
  },
  {
    name: "Add",
    icon: "+",
    accent: "from-white/10 to-white/5",
    ring: "ring-white/20",
  },
  {
    name: "Edit",
    icon: "✎",
    accent: "from-white/10 to-white/5",
    ring: "ring-white/20",
  },
];

function ProfileTile({
  name,
  emoji,
  icon,
  label,
  avatar,
  accent,
  ring,
}: {
  name: string;
  emoji?: string;
  icon?: string;
  label?: string;
  avatar?: string;
  accent: string;
  ring: string;
}) {
  return (
    <button
      type="button"
      className="group flex flex-col items-center gap-3 text-center transition-transform duration-300 hover:scale-105"
    >
      <div
        className={`relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br ${accent} shadow-2xl ring-2 ${ring}`}
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={name} className="h-full w-full object-cover" />
        ) : label ? (
          <span className="text-xl font-black tracking-wide text-white drop-shadow-lg">{label}</span>
        ) : (
          <span className="text-4xl text-white drop-shadow-lg">{emoji ?? icon}</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/10 opacity-80" />
      </div>
      <span className="text-base font-medium text-white/95 group-hover:text-white">{name}</span>
    </button>
  );
}

export default function ProfileLabKora7Page() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="relative mx-auto min-h-screen max-w-md overflow-hidden bg-black shadow-2xl">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/remotion-posters/poster-4.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-[#1a0f0f]/95" />
        <div className="absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-[#221513] via-[#1d1311]/92 to-transparent" />
        <div className="absolute inset-x-0 bottom-[34%] h-40 rounded-t-[100%] bg-[#2b1d1a]/90 blur-[2px]" />

        <div className="relative z-10 flex min-h-screen flex-col px-5 pt-4 pb-8">
          <div className="flex items-center justify-between text-sm text-white/95">
            <div className="font-medium tracking-wide">12:52</div>
            <div className="flex items-center gap-3 text-base">
              <span>⋮</span>
              <span>⌁</span>
              <span>▱</span>
            </div>
          </div>

          <div className="flex-1" />

          <div className="pb-7 text-center">
            <div className="mb-3 inline-flex items-center rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[11px] tracking-[0.25em] text-white/75 backdrop-blur-sm">
              TEST PROFILE PREVIEW
            </div>
            <h1 className="mx-auto max-w-[260px] text-5xl font-black uppercase leading-[0.95] tracking-tight text-white drop-shadow-2xl">
              Traffick
            </h1>
            <p className="mt-8 text-lg text-white/85">Choose Your Profile</p>
          </div>

          <div className="rounded-[2rem] border border-white/8 bg-black/20 px-5 pt-6 pb-10 backdrop-blur-md">
            <div className="grid grid-cols-3 gap-y-6 gap-x-4">
              {profiles.map((profile) => (
                <ProfileTile key={profile.name} {...profile} />
              ))}
            </div>

            <div className="mt-8 text-center text-xs text-white/45">
              Preview route only · not wired to live profile switching yet
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
