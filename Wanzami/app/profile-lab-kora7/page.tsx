const profiles = [
  {
    name: "Olukayode",
    style: "from-orange-500 via-red-500 to-pink-500",
    content: <span className="text-3xl font-black text-white">O</span>,
  },
  {
    name: "MBO",
    style: "from-yellow-400 via-amber-500 to-orange-500",
    content: <span className="text-3xl">🙂</span>,
  },
  {
    name: "Macie!",
    style: "from-sky-400 via-cyan-500 to-blue-600",
    content: <span className="text-3xl">☺️</span>,
  },
  {
    name: "Kids",
    style: "from-fuchsia-500 via-orange-400 to-indigo-500",
    content: <span className="text-sm font-black tracking-[0.22em] text-white">KIDS</span>,
  },
  {
    name: "Add",
    style: "from-white/12 to-white/5",
    content: <span className="text-4xl font-light text-white">+</span>,
  },
  {
    name: "Edit",
    style: "from-white/12 to-white/5",
    content: <span className="text-3xl text-white">✎</span>,
  },
];

function ProfileTile({
  name,
  style,
  content,
}: {
  name: string;
  style: string;
  content: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="group flex flex-col items-center gap-2 text-center transition-transform duration-300 hover:scale-105"
    >
      <div
        className={`relative flex h-[74px] w-[74px] items-center justify-center overflow-hidden rounded-[22px] bg-gradient-to-br ${style} shadow-xl ring-1 ring-white/10 transition duration-300 group-hover:ring-white/25 md:h-[84px] md:w-[84px]`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10" />
        <div className="relative z-10 flex h-full w-full items-center justify-center">{content}</div>
      </div>
      <span className="text-[13px] font-medium text-white/90 md:text-sm">{name}</span>
    </button>
  );
}

export default function ProfileLabKora7Page() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="relative mx-auto min-h-screen max-w-md overflow-hidden bg-black md:max-w-lg">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/remotion-posters/poster-4.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/40 to-black/95" />
        <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-[#171010] via-[#1a1212]/96 to-transparent" />
        <div className="absolute inset-x-[-14%] bottom-[24%] h-[190px] rounded-t-[100%] bg-[#241717] opacity-95 blur-[2px]" />
        <div className="absolute inset-x-[8%] bottom-[23.5%] h-[1px] bg-white/10" />

        <div className="relative z-10 flex min-h-screen flex-col px-5 pt-4 pb-8 md:px-7">
          <div className="flex items-center justify-between text-[13px] text-white/90">
            <span className="font-medium">16:40</span>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <span>◔</span>
              <span>◡</span>
              <span>▱</span>
            </div>
          </div>

          <div className="flex-1" />

          <div className="pb-8 text-center">
            <div className="mb-2 text-[11px] uppercase tracking-[0.35em] text-white/55">Wanzami</div>
            <h1 className="mx-auto max-w-[220px] text-5xl font-black uppercase leading-[0.92] tracking-tight text-white drop-shadow-2xl md:max-w-[280px] md:text-6xl">
              Traffick
            </h1>
            <p className="mt-8 text-lg text-white/85 md:text-xl">Choose Your Profile</p>
          </div>

          <div className="px-2 pb-3">
            <div className="grid grid-cols-3 gap-y-6 gap-x-4 md:gap-y-7 md:gap-x-6">
              {profiles.map((profile) => (
                <ProfileTile key={profile.name} {...profile} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
