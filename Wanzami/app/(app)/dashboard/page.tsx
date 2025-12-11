'use client';

import { Dashboard } from "@/components/Dashboard";

export default function DashboardRoute() {
  return (
    <div className="min-h-screen bg-black">
      <Dashboard onMovieClick={(movie) => {
        const targetId = movie?.backendId ?? movie?.id;
        if (targetId) {
          window.location.href = `/title/${targetId}`;
        }
      }} />
    </div>
  );
}
