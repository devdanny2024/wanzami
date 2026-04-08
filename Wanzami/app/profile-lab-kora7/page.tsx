function AvatarGlyph({ variant }: { variant: "o" | "female" | "soft" | "kids" | "add" | "edit" }) {
  if (variant === "add") {
    return <span className="text-[40px] font-light text-white">+</span>;
  }

  if (variant === "edit") {
    return <span className="text-[30px] text-white">✎</span>;
  }

  if (variant === "kids") {
    return (
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="absolute inset-x-3 top-3 h-7 rounded-full bg-white/18 blur-md" />
        <div className="relative rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-black tracking-[0.28em] text-white backdrop-blur-sm">
          KIDS
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute left-1/2 top-[20%] h-[22px] w-[22px] -translate-x-1/2 rounded-full bg-white/90 shadow-md md:h-[24px] md:w-[24px]" />
      <div className="absolute left-1/2 top-[44%] h-[30px] w-[44px] -translate-x-1/2 rounded-t-[22px] rounded-b-[14px] bg-white/85 shadow-md md:h-[34px] md:w-[48px]" />
      {variant === "o" && (
        <div className="absolute inset-0 flex items-center justify-center pt-1 text-[24px] font-black text-black/70">O</div>
      )}
      {variant === "female" && (
        <>
          <div className="absolute left-1/2 top-[16%] h-[28px] w-[28px] -translate-x-1/2 rounded-full bg-black/18" />
          <div className="absolute left-1/2 top-[17%] h-[11px] w-[32px] -translate-x-1/2 rounded-full bg-black/22" />
        </>
      )}
      {variant === "soft" && (
        <>
          <div className="absolute left-[31%] top-[32%] h-[3px] w-[3px] rounded-full bg-black/45" />
          <div className="absolute right-[31%] top-[32%] h-[3px] w-[3px] rounded-full bg-black/45" />
          <div className="absolute left-1/2 top-[39%] h-[8px] w-[16px] -translate-x-1/2 rounded-b-full border-b-2 border-black/35" />
        </>
      )}
    </div>
  );
}

const profiles = [
  {
    name: "Olukayode",
    style: "from-orange-500 via-red-500 to-pink-500",
    variant: "o" as const,
  },
  {
    name: "MBO",
    style: "from-yellow-400 via-amber-500 to-orange-500",
    variant: "female" as const,
  },
  {
    name: "Macie!",
    style: "from-sky-400 via-cyan-500 to-blue-600",
    variant: "soft" as const,
  },
  {
    name: "Kids",
    style: "from-fuchsia-500 via-orange-400 to-indigo-500",
    variant: "kids" as const,
  },
  {
    name: "Add",
    style: "from-white/12 to-white/5",
    variant: "add" as const,
  },
  {
    name: "Edit",
    style: "from-white/12 to-white/5",
    variant: "edit" as const,
  },
];

function ProfileTile({
  name,
  style,
  variant,
}: {
  name: string;
  style: string;
  variant: "o" | "female" | "soft" | "kids" | "add" | "edit";
}) {
  return (
    <button
      type="button"
      className="group flex flex-col items-center gap-2 text-center transition-transform duration-300 hover:scale-105"
    >
      <div
        className={`relative flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-[24px] bg-gradient-to-br ${style} shadow-xl ring-1 ring-white/10 transition duration-300 group-hover:ring-white/25 md:h-[86px] md:w-[86px]`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10" />
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <AvatarGlyph variant={variant} />
        </div>
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/95" />
        <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-[#140d0d] via-[#171010]/97 to-transparent" />
        <div className="absolute inset-x-[-18%] bottom-[22%] h-[205px] rounded-t-[100%] bg-[#211515] opacity-98 blur-[1px]" />
        <div className="absolute inset-x-[10%] bottom-[22.4%] h-[1px] bg-white/8" />
        <div className="absolute inset-x-[22%] bottom-[23.7%] h-[24px] rounded-full bg-white/4 blur-xl" />

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

          <div className="pb-6 text-center">
            <div className="mb-2 text-[11px] uppercase tracking-[0.34em] text-white/50">Wanzami</div>
            <h1 className="mx-auto max-w-[220px] text-5xl font-black uppercase leading-[0.9] tracking-tight text-white drop-shadow-2xl md:max-w-[280px] md:text-6xl">
              Traffick
            </h1>
            <p className="mt-5 text-lg text-white/85 md:text-xl">Choose Your Profile</p>
          </div>

          <div className="px-2 pb-2">
            <div className="grid grid-cols-3 gap-x-4 gap-y-6 md:gap-x-6 md:gap-y-7">
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
