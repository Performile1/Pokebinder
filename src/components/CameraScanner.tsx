import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  Zap,
  Volume2,
  VolumeX,
  Sliders,
  Layers,
  Upload,
  AlertCircle,
  CheckCircle2,
  Pause,
  Play,
  SwitchCamera,
  Search,
  Target,
  X,
  RotateCcw,
  Award,
} from 'lucide-react';
import { PokemonCard } from '../types';
import { analyzeCardBoundary, FrameAnalysisResult } from '../utils/vision';
import { soundEffects } from '../utils/audio';
import { TargetCardSearchModal } from './TargetCardSearchModal';
import { getCardRarityData } from '../data/rarityPopulationIndex';

interface CameraScannerProps {
  onCapture: (
    imageDataUrl: string,
    sharpness: number,
    targetCard?: PokemonCard | null,
    photoSide?: 'front' | 'back'
  ) => void;
  queueCount: number;
  onOpenSampleStack: () => void;
  currentlyTargetedCard?: PokemonCard | null;
  onSetTargetCard?: (card: PokemonCard | null) => void;
  onOpenSearchModal?: () => void;
  initialAutoSnap?: boolean;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onCapture,
  queueCount,
  onOpenSampleStack,
  currentlyTargetedCard = null,
  onSetTargetCard,
  onOpenSearchModal,
  initialAutoSnap = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const streamActiveRef = useRef<boolean>(false);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Auto-Snap state (Off from start; push button to start)
  const [autoSnapActive, setAutoSnapActive] = useState<boolean>(initialAutoSnap);

  // Camera selection states (Front vs Rear / Device enumeration)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [blurThreshold, setBlurThreshold] = useState<number>(75);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [flashActive, setFlashActive] = useState<boolean>(false);

  // Targeted Card Multi-Photo state (Front vs Back)
  const [photoSide, setPhotoSide] = useState<'front' | 'back'>('front');
  const [internalSearchOpen, setInternalSearchOpen] = useState<boolean>(false);
  const [lastSnappedInfo, setLastSnappedInfo] = useState<{
    cardName: string;
    side: 'front' | 'back';
    timestamp: number;
  } | null>(null);

  // Live frame analysis states
  const [analysis, setAnalysis] = useState<FrameAnalysisResult>({
    isCardDetected: false,
    sharpnessScore: 0,
    isSharp: false,
    aspectRatioMatch: true,
    centeringRatio: { leftRight: [50, 50], topBottom: [50, 50] },
    alignmentConfidence: 0,
    readyToAutoSnap: false,
  });

  // Track consecutive stable frames to prevent accidental triggers
  const stableFramesCount = useRef<number>(0);
  const lastSnapTime = useRef<number>(0);

  // Enumerate cameras on mobile / desktop
  useEffect(() => {
    async function enumerate() {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableDevices(videoInputs);
      } catch (err) {
        console.warn('Could not enumerate video devices:', err);
      }
    }
    enumerate();
  }, [streamActive]);

  // Initialize camera stream with facingMode or specific deviceId
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? {
              deviceId: { exact: selectedDeviceId },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            }
          : {
              facingMode: { ideal: facingMode },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
      }
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      setCameraError(
        'Camera access not available or permission denied. You can switch camera, upload card photos, or use the Rapid Test Stack generator.'
      );
      setStreamActive(false);
    }
  }, [facingMode, selectedDeviceId]);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  // Toggle between Rear (environment) and Front (user) camera
  const handleSwitchCamera = () => {
    setSelectedDeviceId(null); // Clear specific device ID
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Switch to specific camera device (if phone has ultra-wide/macro/telephoto)
  const handleSelectDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
  };

  // Execute snapshot
  const triggerSnap = useCallback(
    (customSharpness?: number) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      // Audio & Visual flash feedback
      if (soundEnabled) {
        soundEffects.playShutter();
      }
      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 140);

      const sharpness = customSharpness ?? analysis.sharpnessScore;
      onCapture(dataUrl, sharpness, currentlyTargetedCard, photoSide);

      if (currentlyTargetedCard) {
        setLastSnappedInfo({
          cardName: currentlyTargetedCard.name,
          side: photoSide,
          timestamp: Date.now(),
        });
      }

      // Reset frame stability counter
      stableFramesCount.current = 0;
      lastSnapTime.current = Date.now();
    },
    [analysis.sharpnessScore, onCapture, soundEnabled, currentlyTargetedCard, photoSide]
  );

  // Real-time frame loop for blur and aspect ratio analysis
  useEffect(() => {
    let animId: number;

    const loop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        if (vw > 0 && vh > 0) {
          canvas.width = vw;
          canvas.height = vh;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.drawImage(video, 0, 0, vw, vh);

            // Bounding box for 63x88mm ratio (approx 63/88 = 0.716)
            const targetAspect = 63 / 88;
            const targetH = Math.min(vh * 0.75, 480);
            const targetW = targetH * targetAspect;
            const boxX = Math.round((vw - targetW) / 2);
            const boxY = Math.round((vh - targetH) / 2);

            const result = analyzeCardBoundary(
              ctx,
              Math.max(0, boxX),
              Math.max(0, boxY),
              Math.min(vw, Math.round(targetW)),
              Math.min(vh, Math.round(targetH)),
              blurThreshold
            );

            setAnalysis(result);

            // Auto-Snap Engine Quality Gate
            const now = Date.now();
            const cooldownPassed = now - lastSnapTime.current > 1800;

            if (autoSnapActive && result.readyToAutoSnap && cooldownPassed) {
              stableFramesCount.current += 1;
              if (stableFramesCount.current >= 4) {
                if (soundEnabled) soundEffects.playFocusLock();
                triggerSnap(result.sharpnessScore);
              }
            } else {
              stableFramesCount.current = Math.max(0, stableFramesCount.current - 1);
            }
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [autoSnapActive, blurThreshold, soundEnabled, triggerSnap]);

  // Handle manual file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        if (soundEnabled) soundEffects.playShutter();
        onCapture(base64, 185, currentlyTargetedCard, photoSide);
        if (currentlyTargetedCard) {
          setLastSnappedInfo({
            cardName: currentlyTargetedCard.name,
            side: photoSide,
            timestamp: Date.now(),
          });
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleOpenSearch = () => {
    if (onOpenSearchModal) {
      onOpenSearchModal();
    } else {
      setInternalSearchOpen(true);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-md flex flex-col items-center">
      {/* Top HUD Bar - Bright styling */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-transparent backdrop-blur-xs">
        <div className="flex items-center gap-2">
          {/* Auto-Snap Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold transition shadow-xs ${
              autoSnapActive
                ? 'bg-red-600 text-white'
                : 'bg-white/90 border border-slate-300 text-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                autoSnapActive ? 'bg-white animate-pulse' : 'bg-slate-400'
              }`}
            />
            {autoSnapActive ? 'AUTO-SNAP ON' : 'SNAP PAUSED'}
          </div>

          <div className="px-2.5 py-1 rounded-full bg-white/90 border border-slate-200 text-xs font-mono text-slate-800 shadow-xs">
            Queue: <span className="font-bold text-red-600">{queueCount}</span>
          </div>
        </div>

        {/* Top Controls: Target Card Search, Switch Camera, Pause/Resume, Sound, Settings */}
        <div className="flex items-center gap-1.5">
          {/* Search Card & Set Number Button */}
          <button
            onClick={handleOpenSearch}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
              currentlyTargetedCard
                ? 'bg-red-600 hover:bg-red-700 text-white border-red-500 shadow-md shadow-red-600/30'
                : 'bg-white/90 hover:bg-white text-slate-700 border-slate-200 hover:text-red-600'
            }`}
            title="Search by card name, number or set to lock target"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">
              {currentlyTargetedCard ? `Target: #${currentlyTargetedCard.setNumber}` : 'Search Card'}
            </span>
          </button>

          {/* Switch Camera Button (Rear / Front / Lenses) */}
          <button
            onClick={handleSwitchCamera}
            className="p-2 rounded-xl bg-white/90 hover:bg-white border border-slate-200 text-slate-700 hover:text-red-600 transition flex items-center gap-1 shadow-xs cursor-pointer"
            title={`Switch Camera (Currently: ${facingMode === 'environment' ? 'Rear / Back' : 'Front / Selfie'})`}
          >
            <SwitchCamera className="w-4 h-4 text-red-600" />
            <span className="text-[10px] font-mono font-bold uppercase hidden sm:inline">
              {facingMode === 'environment' ? 'Rear' : 'Front'}
            </span>
          </button>

          {/* Dedicated Start Auto-Snap / Stop Auto-Snap Button */}
          <button
            onClick={() => setAutoSnapActive(!autoSnapActive)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold font-mono flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
              autoSnapActive
                ? 'bg-red-600 hover:bg-red-700 text-white border-red-500 shadow-md shadow-red-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40'
            }`}
            title={autoSnapActive ? 'Stop Auto-Snapping' : 'Push button to start hands-free Auto-Snap'}
          >
            {autoSnapActive ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Stop Auto-Snap</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Auto-Snap</span>
              </>
            )}
          </button>

          {/* Sound Mute/Unmute */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-white/90 hover:bg-white border border-slate-200 text-slate-700 hover:text-red-600 transition shadow-xs cursor-pointer"
            title={soundEnabled ? 'Mute Shutter Audio' : 'Enable Shutter Audio'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Quality Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl border transition shadow-xs cursor-pointer ${
              showSettings
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white/90 hover:bg-white border-slate-200 text-slate-700 hover:text-red-600'
            }`}
            title="Quality Gate Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Refresh Stream */}
          <button
            onClick={startCamera}
            className="p-2 rounded-xl bg-white/90 hover:bg-white border border-slate-200 text-slate-700 hover:text-red-600 transition shadow-xs cursor-pointer"
            title="Refresh Camera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Drawer */}
      {showSettings && (
        <div className="absolute top-14 left-3 right-3 z-40 p-4 rounded-xl bg-white/95 border border-slate-200 shadow-xl backdrop-blur-md text-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Auto-Snap Focus Quality Gate
            </span>
            <span className="text-xs font-mono text-red-600 font-bold">
              Laplacian Variance: {blurThreshold}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-slate-500">Permissive (40)</span>
            <input
              type="range"
              min="40"
              max="160"
              value={blurThreshold}
              onChange={(e) => setBlurThreshold(Number(e.target.value))}
              className="w-full accent-red-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <span className="text-xs text-slate-500">Strict (160)</span>
          </div>

          {availableDevices.length > 1 && (
            <div className="mb-3 pt-2 border-t border-slate-200">
              <label className="block text-[11px] uppercase font-mono text-slate-600 mb-1">
                Choose Camera Device:
              </label>
              <select
                value={selectedDeviceId || ''}
                onChange={(e) => handleSelectDevice(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-red-500 font-mono"
              >
                <option value="">Default ({facingMode === 'environment' ? 'Rear' : 'Front'})</option>
                {availableDevices.map((dev, i) => (
                  <option key={dev.deviceId || i} value={dev.deviceId}>
                    {dev.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={autoSnapActive}
                onChange={(e) => setAutoSnapActive(e.target.checked)}
                className="rounded accent-red-600 w-4 h-4 cursor-pointer"
              />
              Enable Hands-Free Continuous Auto-Snap
            </label>
            <span className="text-[11px] text-slate-500">1.8s auto-reset delay</span>
          </div>
        </div>
      )}

      {/* Main Viewfinder Area */}
      <div className="relative w-full h-[440px] sm:h-[500px] flex items-center justify-center overflow-hidden bg-black">
        {/* HTML5 Video Feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Hidden processing canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Shutter Flash Animation */}
        <div
          className={`absolute inset-0 bg-white transition-opacity pointer-events-none z-20 ${
            flashActive ? 'opacity-90 duration-75' : 'opacity-0 duration-200'
          }`}
        />

        {/* Pinned Target Card HUD Overlay */}
        {currentlyTargetedCard && (
          <div className="absolute top-14 left-3 right-3 z-25 p-2.5 rounded-xl bg-white/95 border border-red-200 shadow-lg backdrop-blur-md flex items-center justify-between gap-3 text-slate-800 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={currentlyTargetedCard.imageUrl}
                alt={currentlyTargetedCard.name}
                className="w-8 h-11 object-contain rounded border border-slate-200 bg-slate-50 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                    Target Locked
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {currentlyTargetedCard.name}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold shrink-0">
                    #{currentlyTargetedCard.setNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600 mt-0.5 truncate">
                  <span>Tradera: ~{currentlyTargetedCard.typicalTraderaSoldSEK} SEK</span>
                  <span>•</span>
                  <span>eBay: ${currentlyTargetedCard.typicalEbayUSD}</span>
                  <span>•</span>
                  <span className="text-slate-500">{currentlyTargetedCard.setName}</span>
                </div>
                {(() => {
                  const r = getCardRarityData(currentlyTargetedCard);
                  return (
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-amber-800 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200/80 mt-1 truncate">
                      <Award className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Sällsynthet: <strong>{r.scarcityScore}/100</strong> ({r.rarityTier}) • Dra-chans: {r.pullRateDisplay.split(' (')[0]} • PSA 10: {r.psa10Count.toLocaleString()} st</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Side toggle & Change card buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-[10px] font-mono font-bold">
                <button
                  onClick={() => setPhotoSide('front')}
                  className={`px-2 py-0.5 rounded transition cursor-pointer ${
                    photoSide === 'front'
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Photographing Front of card"
                >
                  Front
                </button>
                <button
                  onClick={() => setPhotoSide('back')}
                  className={`px-2 py-0.5 rounded transition cursor-pointer ${
                    photoSide === 'back'
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Photographing Back of card"
                >
                  Back
                </button>
              </div>

              <button
                onClick={handleOpenSearch}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                title="Search & switch to another card in your set"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              {onSetTargetCard && (
                <button
                  onClick={() => onSetTargetCard(null)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition cursor-pointer"
                  title="Clear target card (return to free-scanning)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Temporary Snapshot Confirmation Banner */}
        {lastSnappedInfo && (
          <div className="absolute top-28 left-3 right-3 z-30 p-2.5 rounded-xl bg-slate-900/95 border border-slate-700 text-white shadow-xl flex items-center justify-between backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Captured <strong>{lastSnappedInfo.cardName}</strong> ({lastSnappedInfo.side.toUpperCase()})!
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {lastSnappedInfo.side === 'front' ? (
                <button
                  onClick={() => {
                    setPhotoSide('back');
                    setLastSnappedInfo(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Snap Back Side</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setPhotoSide('front');
                    handleOpenSearch();
                    setLastSnappedInfo(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                >
                  <Search className="w-3 h-3" />
                  <span>Search Next Card</span>
                </button>
              )}
              <button
                onClick={() => setLastSnappedInfo(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 63x88mm Pokémon Card Target Guide Boundary */}
        <div className="relative z-10 w-[240px] h-[335px] sm:w-[270px] sm:h-[377px] pointer-events-none transition-all duration-200">
          {/* Target Boundary Outer Box with Dynamic State Color */}
          <div
            className={`w-full h-full rounded-[14px] border-2 transition-all duration-150 relative ${
              analysis.readyToAutoSnap && autoSnapActive
                ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.6)] bg-emerald-500/10'
                : !autoSnapActive
                ? 'border-zinc-500/80 shadow-[0_0_15px_rgba(113,113,122,0.2)] bg-zinc-900/10'
                : analysis.isCardDetected && !analysis.isSharp
                ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] bg-red-500/10'
                : 'border-red-500/90 shadow-[0_0_20px_rgba(220,38,38,0.3)]'
            }`}
          >
            {/* Corner Alignment Ticks */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-red-500 rounded-tl" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-red-500 rounded-tr" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br" />

            {/* Micro Crosshairs */}
            <div className="absolute inset-0 flex items-center justify-center opacity-40">
              <div className="w-8 h-0.5 bg-white" />
              <div className="h-8 w-0.5 bg-white -ml-4" />
            </div>

            {/* Bottom 15% ROI Set Number Bracket Indicator */}
            <div className="absolute bottom-2 left-2 right-2 h-7 border border-dashed border-zinc-400/80 rounded flex items-center justify-between px-2 bg-zinc-950/60 backdrop-blur-xs">
              <span className="text-[9px] font-mono tracking-tighter text-red-400 uppercase font-bold">
                {currentlyTargetedCard
                  ? `TARGET: #${currentlyTargetedCard.setNumber} (${photoSide.toUpperCase()})`
                  : 'ROI: Set # & Era'}
              </span>
              <span className="text-[9px] font-mono text-zinc-300">63x88mm</span>
            </div>

            {/* Live Focus State Banner Inside Frame */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-center">
              {!autoSnapActive ? (
                <button
                  type="button"
                  onClick={() => setAutoSnapActive(true)}
                  className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/95 hover:bg-slate-800 border-2 border-emerald-400 text-white text-xs font-mono font-bold transition cursor-pointer shadow-lg active:scale-95"
                  title="Push button to start hands-free auto-snap"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                  <span>AUTO-SNAP IS OFF &bull; PUSH TO START</span>
                </button>
              ) : analysis.readyToAutoSnap ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs font-mono font-bold animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  SHARP &amp; LOCKED &bull; AUTO-SNAPPING
                </div>
              ) : analysis.isCardDetected && !analysis.isSharp ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/90 border border-red-500 text-red-300 text-xs font-mono font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  BLUR DETECTED (HOLD STEADY)
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950/80 border border-zinc-700 text-zinc-300 text-xs font-mono">
                  {currentlyTargetedCard
                    ? `ALIGN PHYSICAL ${currentlyTargetedCard.name.toUpperCase()}`
                    : 'ALIGN CARD IN BOX'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Camera Permission / Fallback Overlay */}
        {cameraError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-zinc-950/95 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-3">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Live Camera Standby</h4>
            <p className="text-xs text-zinc-400 max-w-sm mb-4 leading-relaxed">
              {cameraError}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={handleSwitchCamera}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs flex items-center gap-2 border border-zinc-700 transition cursor-pointer"
              >
                <SwitchCamera className="w-4 h-4 text-red-400" />
                Flip Camera ({facingMode === 'environment' ? 'Try Front' : 'Try Rear'})
              </button>
              <button
                onClick={handleOpenSearch}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition cursor-pointer"
              >
                <Search className="w-4 h-4" />
                Search &amp; Target Card First
              </button>
              <button
                onClick={onOpenSampleStack}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs flex items-center gap-2 border border-zinc-700 transition cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                Load Rapid Test Stack
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs flex items-center gap-2 border border-zinc-700 transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Upload Photo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Live Telemetry & Control Bar */}
      <div className="w-full p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 z-10">
        {/* Real-Time Laplacian Variance Meter */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
              Laplacian Sharpness
            </span>
            <div className="flex items-center gap-2">
              <div className="w-28 sm:w-36 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-150 ${
                    analysis.isSharp ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (analysis.sharpnessScore / (blurThreshold * 1.5)) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-slate-800">
                {analysis.sharpnessScore}{' '}
                <span className="text-[10px] text-slate-400 font-normal">/ {blurThreshold}</span>
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Centering Caliper Gauge */}
          <div className="hidden md:flex flex-col">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
              Centering Caliper
            </span>
            <span className="text-xs font-mono text-slate-700">
              L/R {analysis.centeringRatio.leftRight[0]}:{analysis.centeringRatio.leftRight[1]} • T/B{' '}
              {analysis.centeringRatio.topBottom[0]}:{analysis.centeringRatio.topBottom[1]}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {/* Search & Target Card Button */}
          <button
            onClick={handleOpenSearch}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer ${
              currentlyTargetedCard
                ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="Search card name, number or set to lock target before taking photos"
          >
            <Target className="w-3.5 h-3.5 text-red-600" />
            <span>{currentlyTargetedCard ? 'Change Target Card' : 'Search & Target Card'}</span>
          </button>

          {/* Mobile Switch Camera Button */}
          <button
            onClick={handleSwitchCamera}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            title="Switch front/rear camera"
          >
            <SwitchCamera className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden xs:inline">Flip Cam</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            title="Upload photo from phone or computer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            Upload
          </button>

          <button
            onClick={onOpenSampleStack}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            title="Inject simulated Pokémon card batch"
          >
            <Layers className="w-3.5 h-3.5 text-red-600" />
            Stack Sim
          </button>

          {/* Start / Stop Auto-Snap Toggle */}
          <button
            onClick={() => setAutoSnapActive(!autoSnapActive)}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
              autoSnapActive
                ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40 animate-pulse'
            }`}
            title={autoSnapActive ? 'Stop hands-free auto-snap' : 'Push button to start hands-free Auto-Snap'}
          >
            {autoSnapActive ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current text-red-400" />
                <span>Stop Auto-Snap</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-white" />
                <span>Start Auto-Snap</span>
              </>
            )}
          </button>

          {/* Manual Snap Trigger */}
          <button
            onClick={() => triggerSnap()}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-red-600/30 transition cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Snap {photoSide === 'back' ? 'Back' : 'Now'}</span>
          </button>
        </div>
      </div>

      {/* Internal Search Modal fallback */}
      <TargetCardSearchModal
        isOpen={internalSearchOpen}
        onClose={() => setInternalSearchOpen(false)}
        onSelectTargetCard={(card) => {
          if (onSetTargetCard) onSetTargetCard(card);
          setInternalSearchOpen(false);
          setPhotoSide('front');
        }}
        currentlyTargetedCard={currentlyTargetedCard}
      />
    </div>
  );
};
