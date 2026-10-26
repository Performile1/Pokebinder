import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, AlertTriangle, Sparkles, Check, Flashlight, Eye } from 'lucide-react';
import { ScanItem } from '../types';

interface TiltTestModalProps {
  item: ScanItem;
  onClose: () => void;
  onConfirmAuthenticity: (verified: boolean) => void;
}

export const TiltTestModal: React.FC<TiltTestModalProps> = ({
  item,
  onClose,
  onConfirmAuthenticity,
}) => {
  const { card } = item;
  if (!card) return null;

  // 3D Card tilt mouse tracking
  const [rotateX, setRotateX] = useState<number>(0);
  const [rotateY, setRotateY] = useState<number>(0);
  const [lightX, setLightX] = useState<number>(50);
  const [lightY, setLightY] = useState<number>(50);
  const [isInspecting, setIsInspecting] = useState<boolean>(true);
  const [inspectionSeconds, setInspectionSeconds] = useState<number>(3);
  const [checklist, setChecklist] = useState({
    rosettePattern: true,
    foilShift: true,
    fontWeight: true,
    blackCore: true,
  });

  const cardContainerRef = useRef<HTMLDivElement | null>(null);

  // 3-second automated tilt inspection sequence
  useEffect(() => {
    let currentSec = 3;
    const interval = setInterval(() => {
      currentSec -= 1;
      setInspectionSeconds(Math.max(0, currentSec));
      if (currentSec <= 0) {
        setIsInspecting(false);
        clearInterval(interval);
      }
    }, 1000);

    // Automated gentle tilt loop during 3-second test
    let step = 0;
    const tiltAnim = setInterval(() => {
      step += 0.08;
      setRotateX(Math.sin(step) * 16);
      setRotateY(Math.cos(step) * 22);
      setLightX(50 + Math.cos(step) * 40);
      setLightY(50 + Math.sin(step) * 40);
    }, 40);

    return () => {
      clearInterval(interval);
      clearInterval(tiltAnim);
    };
  }, []);

  // Interactive mouse move tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardContainerRef.current) return;
    const rect = cardContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotY = ((x - centerX) / centerX) * 24;
    const rotX = -((y - centerY) / centerY) * 24;

    setRotateX(rotX);
    setRotateY(rotY);
    setLightX((x / rect.width) * 100);
    setLightY((y / rect.height) * 100);
  };

  const allPassed = Object.values(checklist).every(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header - Pokémon Red Accent */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 text-red-600 border border-red-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Holographic Tilt &amp; Rosette Authenticity Test
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold shadow-2xs">
                  High-Value Grail (&gt;$100)
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {card.name} &bull; {card.setNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Tilt Studio */}
          <div className="flex flex-col sm:flex-row items-center gap-8 justify-center">
            {/* 3D Tilting Card Container */}
            <div
              ref={cardContainerRef}
              onMouseMove={handleMouseMove}
              className="relative w-56 h-80 rounded-2xl cursor-grab active:cursor-grabbing perspective-1000 flex-shrink-0"
            >
              <div
                className="w-full h-full rounded-2xl relative shadow-xl transition-transform duration-75 border-2 border-slate-300 overflow-hidden bg-slate-900"
                style={{
                  transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Real Card Artwork */}
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-full h-full object-cover"
                />

                {/* Iridescent Holofoil Refraction Glare */}
                <div
                  className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-80 transition-opacity"
                  style={{
                    background: `radial-gradient(circle at ${lightX}% ${lightY}%, rgba(255,255,255,0.85) 0%, rgba(255,180,0,0.4) 25%, rgba(0,255,220,0.3) 50%, transparent 75%)`,
                  }}
                />

                {/* Diagonal Holo Sheen Bands */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
                  style={{
                    background: `linear-gradient(${rotateY * 4}deg, transparent 20%, rgba(255,255,255,0.7) 45%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 55%, transparent 80%)`,
                  }}
                />
              </div>

              {/* Torch indicator */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[11px] font-mono text-slate-500">
                <Flashlight className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                Drag to tilt &amp; reflect
              </div>
            </div>

            {/* Inspection Status & Proxy Risk Warning */}
            <div className="flex-1 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase font-mono text-slate-500">Flashlight Tilt Phase</span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${isInspecting ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>
                    {isInspecting ? `Inspecting... (${inspectionSeconds}s)` : 'Sweep Complete'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {card.proxyRiskNotes || 'Inspect the 45-degree diagonal refraction angle and texture lines. Modern Chinese proxies fail to mimic micro-embossing.'}
                </p>
              </div>

              {/* 4-Point Micro Inspection Checklist */}
              <div className="space-y-2 text-xs">
                <div className="text-[11px] uppercase font-mono tracking-wider text-slate-500 mb-1">
                  Authenticity Verification Checklist
                </div>

                <label className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300 transition">
                  <input
                    type="checkbox"
                    checked={checklist.rosettePattern}
                    onChange={(e) => setChecklist({ ...checklist, rosettePattern: e.target.checked })}
                    className="rounded accent-red-600 w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Hexagonal Rosette Pattern</div>
                    <div className="text-[11px] text-slate-500">Lithograph dot grid intact (no inkjet bleeding)</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300 transition">
                  <input
                    type="checkbox"
                    checked={checklist.foilShift}
                    onChange={(e) => setChecklist({ ...checklist, foilShift: e.target.checked })}
                    className="rounded accent-red-600 w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-slate-900">45&deg; Diagonal Foil Refraction</div>
                    <div className="text-[11px] text-slate-500">Hologram reflects directionally, not a flat mirror</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300 transition">
                  <input
                    type="checkbox"
                    checked={checklist.fontWeight}
                    onChange={(e) => setChecklist({ ...checklist, fontWeight: e.target.checked })}
                    className="rounded accent-red-600 w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Typography &amp; HP Weight</div>
                    <div className="text-[11px] text-slate-500">Sharp vector font kerning matching vintage dies</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300 transition">
                  <input
                    type="checkbox"
                    checked={checklist.blackCore}
                    onChange={(e) => setChecklist({ ...checklist, blackCore: e.target.checked })}
                    className="rounded accent-red-600 w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Black Core Layer (Light Test)</div>
                    <div className="text-[11px] text-slate-500">Card sandwich blocks direct smartphone light-bleed</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              onConfirmAuthenticity(false);
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-red-600 border border-red-200 font-semibold text-xs flex items-center gap-1.5 transition"
          >
            <AlertTriangle className="w-4 h-4" />
            Flag as Suspected Proxy
          </button>

          <button
            onClick={() => {
              onConfirmAuthenticity(true);
              onClose();
            }}
            disabled={!allPassed}
            className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
              allPassed
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Verified Authentic (+Add to Inventory)
          </button>
        </div>
      </div>
    </div>
  );
};
