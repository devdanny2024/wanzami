import { useDevice } from "../context/DeviceContext";

export function LoadingSkeleton() {
  const { isTv, isPortrait } = useDevice();

  return (
    <div className="animate-pulse">
      {/* Hero Skeleton */}
      <div className={`bg-white/5 ${isTv ? "h-[900px]" : isPortrait ? "h-[600px]" : "h-[700px]"}`}></div>

      {/* Rails Skeleton */}
      <div className={`${isTv ? "px-20 py-16 -mt-32" : isPortrait ? "px-6 py-12 -mt-24" : "px-12 py-16 -mt-28"}`}>
        <div className="space-y-12">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-8 w-64 bg-white/5 rounded mb-6"></div>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div
                    key={j}
                    className={`
                      ${isTv ? "w-[380px] h-[214px]" : isPortrait ? "w-[280px] h-[158px]" : "w-[320px] h-[180px]"}
                      bg-white/5 rounded-lg
                    `}
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  message 
}: { 
  icon: any; 
  title: string; 
  message: string;
}) {
  const { isTv } = useDevice();

  return (
    <div className="flex flex-col items-center justify-center py-32">
      <Icon className={`${isTv ? "w-24 h-24" : "w-20 h-20"} text-white/20 mb-8`} />
      <h3 className={`text-white font-semibold mb-3 ${isTv ? "text-4xl" : "text-2xl"}`}>
        {title}
      </h3>
      <p className={`text-white/60 ${isTv ? "text-2xl" : "text-lg"}`}>
        {message}
      </p>
    </div>
  );
}

export function OfflineState() {
  const { isTv } = useDevice();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0A0A0F]">
      <div className={`${isTv ? "w-32 h-32" : "w-24 h-24"} mb-8`}>
        <svg viewBox="0 0 100 100" className="text-white/20">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="4" />
          <line x1="30" y1="70" x2="70" y2="30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className={`text-white font-bold mb-4 ${isTv ? "text-5xl" : "text-3xl"}`}>
        No Internet Connection
      </h2>
      <p className={`text-white/60 mb-8 ${isTv ? "text-2xl" : "text-xl"}`}>
        Please check your connection and try again
      </p>
      <button className={`
        bg-[#E63946] hover:bg-[#D62839] text-white rounded-xl
        font-semibold transition-colors
        ${isTv ? "px-12 py-5 text-2xl" : "px-8 py-3.5 text-lg"}
      `}>
        Retry
      </button>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  const { isTv } = useDevice();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0A0A0F]">
      <div className={`${isTv ? "w-32 h-32" : "w-24 h-24"} mb-8 text-red-500`}>
        <svg viewBox="0 0 100 100" fill="currentColor">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" />
          <text x="50" y="70" fontSize="60" textAnchor="middle" fontWeight="bold">!</text>
        </svg>
      </div>
      <h2 className={`text-white font-bold mb-4 ${isTv ? "text-5xl" : "text-3xl"}`}>
        Something Went Wrong
      </h2>
      <p className={`text-white/60 mb-8 ${isTv ? "text-2xl" : "text-xl"} max-w-md text-center`}>
        {message || "An unexpected error occurred. Please try again."}
      </p>
      <button className={`
        bg-[#E63946] hover:bg-[#D62839] text-white rounded-xl
        font-semibold transition-colors
        ${isTv ? "px-12 py-5 text-2xl" : "px-8 py-3.5 text-lg"}
      `}>
        Go Home
      </button>
    </div>
  );
}
