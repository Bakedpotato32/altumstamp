import React from 'react';

export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#f8fafc]">
      <div className="absolute -top-[12%] -left-[10%] w-[380px] h-[380px] rounded-full bg-blue-200/45 blur-3xl animate-light-blob-1" />
      <div className="absolute top-[35%] -right-[15%] w-[360px] h-[360px] rounded-full bg-rose-200/35 blur-3xl animate-light-blob-2" />
      <div className="absolute -bottom-[10%] left-[15%] w-[420px] h-[420px] rounded-full bg-emerald-100/50 blur-3xl" />
    </div>
  );
}
