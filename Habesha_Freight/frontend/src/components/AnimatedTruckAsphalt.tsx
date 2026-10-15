import { useState } from 'react';

export default function AnimatedTruckAsphalt() {
  const [speed, setSpeed] = useState<'normal' | 'fast' | 'turbo'>('normal');

  const speedDuration = speed === 'turbo' ? '4s' : speed === 'fast' ? '7s' : '12s';
  const roadDuration = speed === 'turbo' ? '0.3s' : speed === 'fast' ? '0.6s' : '1s';

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl border border-amber-500/30 bg-slate-950 font-sans my-6">
      {/* Sky & Distant Mountain Horizon Silhouette */}
      <div className="relative h-44 sm:h-52 bg-gradient-to-b from-[#071426] via-[#0b1f33] to-[#112840] overflow-hidden">
        {/* Stars / Night sky dots */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
        
        {/* Moon / Glow in background */}
        <div className="absolute top-4 right-12 w-20 h-20 rounded-full bg-amber-200/20 blur-xl pointer-events-none" />
        <div className="absolute top-6 right-16 w-10 h-10 rounded-full bg-amber-100/40 shadow-[0_0_30px_rgba(251,191,36,0.5)] pointer-events-none" />

        {/* Passing Distant Mountains / Horizon Line */}
        <div className="absolute bottom-0 inset-x-0 h-16 opacity-30 flex items-end justify-around">
          <svg className="w-full h-full fill-slate-800" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,120 L150,40 L300,100 L450,20 L600,90 L750,30 L900,110 L1050,50 L1200,120 Z" />
          </svg>
        </div>

        {/* Highway Overpass / Telegraph Poles passing in background */}
        <div 
          className="absolute bottom-6 inset-x-0 h-12 flex gap-32 animate-[scrollPoles_8s_linear_infinite]"
          style={{ animationDuration: speed === 'turbo' ? '2.5s' : speed === 'fast' ? '5s' : '8s' }}
        >
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex flex-col items-center opacity-40 shrink-0">
              <div className="w-1 h-12 bg-slate-600" />
              <div className="w-6 h-0.5 bg-slate-500 -mt-10" />
            </div>
          ))}
        </div>
      </div>

      {/* ASPHALT ROAD AREA */}
      <div className="relative h-36 sm:h-44 bg-[#141b24] border-t-4 border-amber-600/60 overflow-hidden shadow-inner flex flex-col justify-between py-3">
        {/* Asphalt Texture overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px] opacity-5 pointer-events-none" />

        {/* Top White Shoulder Line */}
        <div className="relative w-full h-1 bg-white/70" />

        {/* Continuous Dashed Center Yellow Line scrolling left */}
        <div className="relative w-full h-3 my-auto overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 w-[200%] flex gap-12 animate-[scrollRoad_1s_linear_infinite]"
            style={{ animationDuration: roadDuration }}
          >
            {[...Array(35)].map((_, i) => (
              <div key={i} className="w-16 h-full bg-amber-400 rounded-sm shadow-[0_0_8px_rgba(251,191,36,0.6)] shrink-0" />
            ))}
          </div>
        </div>

        {/* Bottom White Shoulder Line */}
        <div className="relative w-full h-1 bg-white/70" />

        {/* Dynamic Speed & Controls Overlay Badge */}
        <div className="absolute top-2 left-4 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-1.5 rounded-full text-xs text-slate-200 shadow-lg">
          <span className="font-bold text-amber-400 flex items-center gap-1">
            ⚡ Express Freight Highway
          </span>
          <span className="text-slate-500">|</span>
          <button 
            onClick={() => setSpeed('normal')} 
            className={`px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${speed === 'normal' ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-800'}`}
          >
            Cruising
          </button>
          <button 
            onClick={() => setSpeed('fast')} 
            className={`px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${speed === 'fast' ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-800'}`}
          >
            75 km/h
          </button>
          <button 
            onClick={() => setSpeed('turbo')} 
            className={`px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${speed === 'turbo' ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-800'}`}
          >
            110 km/h
          </button>
        </div>

        {/* LARGE SMOOTH TRUCK ANIMATION */}
        <div 
          className="absolute bottom-3 left-0 w-[420px] sm:w-[540px] z-10 animate-[driveTruck_12s_linear_infinite]"
          style={{ animationDuration: speedDuration }}
        >
          {/* Truck Body & Trailer Assembly */}
          <div className="relative flex items-end drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)] animate-[truckBounce_0.6s_ease-in-out_infinite_alternate]">
            
            {/* --- CARGO TRAILER --- */}
            <div className="relative w-[300px] sm:w-[380px] h-[100px] sm:h-[120px] bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 rounded-l-lg border-2 border-slate-400 flex flex-col justify-between p-3 shadow-2xl overflow-hidden">
              {/* Metallic Container Corrugated Vertical Lines */}
              <div className="absolute inset-0 flex justify-between opacity-15 pointer-events-none">
                {[...Array(24)].map((_, i) => (
                  <div key={i} className="w-1 h-full bg-slate-900" />
                ))}
              </div>

              {/* Gold Accent Stripe across Container */}
              <div className="absolute top-4 inset-x-0 h-4 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 shadow-md" />

              {/* Branding / Logo on Container */}
              <div className="relative z-10 my-auto flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-[#0B1F33] text-amber-400 font-extrabold text-xl flex items-center justify-center border border-amber-400/40 shadow-inner">
                    HF
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black tracking-tight text-[#0B1F33] leading-none uppercase">
                      HABESHA<span className="text-amber-600">FREIGHT</span>
                    </h4>
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-600 tracking-wider uppercase mt-0.5">
                      Nationwide Freight Marketplace
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex flex-col items-end text-[10px] font-bold text-slate-700 bg-amber-400/20 px-2 py-1 rounded border border-amber-400/40">
                  <span>ETHIOPIA HUB</span>
                  <span className="text-amber-700">LIVE GPS #8841</span>
                </div>
              </div>

              {/* Rear Trailer Reflectors */}
              <div className="absolute bottom-2 left-2 flex gap-1">
                <div className="w-2 h-4 bg-red-600 rounded-sm shadow-[0_0_6px_rgba(220,38,38,0.8)]" />
                <div className="w-2 h-4 bg-amber-500 rounded-sm" />
              </div>
            </div>

            {/* --- TRUCK CABIN / TRACTOR --- */}
            <div className="relative w-[110px] sm:w-[140px] h-[90px] sm:h-[110px] bg-gradient-to-b from-[#0B1F33] via-[#071426] to-[#040a14] rounded-r-2xl border-t-2 border-r-2 border-slate-700 flex flex-col justify-between shadow-2xl ml-[-2px]">
              {/* Windshield & Driver Seat */}
              <div className="relative mt-2 mr-3 ml-6 h-10 sm:h-12 bg-gradient-to-tr from-slate-900 via-sky-900/60 to-amber-200/40 rounded-r-xl border border-sky-400/30 overflow-hidden shadow-inner">
                {/* Driver silhouette */}
                <div className="absolute bottom-1 right-3 w-4 h-5 bg-slate-950 rounded-t-full opacity-80" />
                <div className="absolute bottom-5 right-4 w-3 h-3 bg-slate-950 rounded-full opacity-80" />
              </div>

              {/* Front Chrome Grille */}
              <div className="relative mb-2 mr-1 ml-auto w-10 sm:w-12 h-8 bg-gradient-to-r from-slate-700 via-slate-300 to-slate-100 rounded-r-lg border border-slate-400 flex flex-col justify-around p-1 shadow-md">
                <div className="w-full h-1 bg-slate-800 rounded-full" />
                <div className="w-full h-1 bg-slate-800 rounded-full" />
                <div className="w-full h-1 bg-slate-800 rounded-full" />
              </div>

              {/* Headlight LED Lamp & Glowing Light Beam Cone */}
              <div className="absolute bottom-4 -right-2 w-4 h-5 bg-amber-300 rounded-r-full shadow-[0_0_15px_#fbbf24] border border-white" />
              <div className="absolute bottom-0 right-[-140px] sm:right-[-180px] w-[150px] sm:w-[200px] h-12 bg-gradient-to-r from-amber-300/40 via-amber-200/10 to-transparent clip-path-headlight pointer-events-none blur-sm" />

              {/* Exhaust Smoke Effect */}
              <div className="absolute top-[-15px] left-3 w-2.5 h-6 bg-gradient-to-b from-slate-300 to-slate-700 rounded-t shadow">
                <div className="absolute -top-3 left-0 w-4 h-4 bg-slate-300/30 rounded-full animate-[smokePuff_1.2s_ease-out_infinite]" />
              </div>
            </div>

            {/* --- WHEELS ASSEMBLY --- */}
            <div className="absolute bottom-[-14px] left-8 flex gap-3">
              <Wheel speed={speed} />
              <Wheel speed={speed} />
            </div>
            <div className="absolute bottom-[-14px] left-36 sm:left-48 flex gap-3">
              <Wheel speed={speed} />
              <Wheel speed={speed} />
            </div>
            <div className="absolute bottom-[-14px] right-4 flex gap-3">
              <Wheel speed={speed} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Wheel({ speed }: { speed: string }) {
  const spinDuration = speed === 'turbo' ? '0.2s' : speed === 'fast' ? '0.4s' : '0.7s';
  return (
    <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900 border-2 border-slate-700 shadow-lg flex items-center justify-center">
      {/* Tire tread */}
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-800" />
      {/* Rotating Rim */}
      <div 
        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-slate-400 via-slate-100 to-slate-500 border border-slate-600 flex items-center justify-center animate-[spinWheel_0.7s_linear_infinite]"
        style={{ animationDuration: spinDuration }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
        <div className="absolute w-full h-0.5 bg-slate-800 opacity-60" />
        <div className="absolute h-full w-0.5 bg-slate-800 opacity-60" />
      </div>
    </div>
  );
}
