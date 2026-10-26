import React from 'react';
import { Clock, CheckCircle, AlertTriangle, ShieldCheck, Flame, Loader2, Trash2 } from 'lucide-react';
import { ScanItem } from '../types';

interface ScanQueueProps {
  queue: ScanItem[];
  onClearQueue: () => void;
  onSelectItem: (item: ScanItem) => void;
  selectedItemId?: string;
}

export const ScanQueue: React.FC<ScanQueueProps> = ({
  queue,
  onClearQueue,
  onSelectItem,
  selectedItemId,
}) => {
  const pendingCount = queue.filter((q) => q.status === 'queued' || q.status === 'analyzing').length;
  const highArbCount = queue.filter((q) => q.economics?.isHighArbitrage).length;

  return (
    <div className="w-full rounded-2xl bg-white border border-slate-200 p-4 shadow-md flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-red-600" />
          <h3 className="text-sm font-bold text-slate-900 tracking-wide">
            Asynchronous Scan Queue
          </h3>
          {pendingCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-mono font-semibold animate-pulse border border-red-200">
              <Loader2 className="w-3 h-3 animate-spin" />
              {pendingCount} processing
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {highArbCount > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-xs font-mono font-bold shadow-xs">
              <Flame className="w-3 h-3 fill-current text-white" />
              {highArbCount} Arb Hits
            </span>
          )}
          {queue.length > 0 && (
            <button
              onClick={onClearQueue}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition"
              title="Clear Scan History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {queue.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          No cards in queue. Position a Pokémon card in front of the lens or click &quot;Stack Sim&quot; to test auto-capture.
        </div>
      ) : (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
          {queue.map((item) => {
            const isSelected = item.id === selectedItemId;
            const isProcessing = item.status === 'queued' || item.status === 'analyzing';
            const isHighArb = item.economics?.isHighArbitrage;

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className={`flex-shrink-0 w-36 rounded-xl p-2 cursor-pointer transition border relative ${
                  isSelected
                    ? 'bg-slate-50 border-red-600 shadow-md shadow-red-600/10'
                    : isHighArb
                    ? 'bg-red-50/40 border-red-300 hover:border-red-400'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* Thumbnail Image */}
                <div className="relative w-full h-24 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 mb-2">
                  <img
                    src={item.card?.imageUrl || item.thumbnailUrl}
                    alt={item.card?.name || 'Scanned Card'}
                    className="w-full h-full object-cover object-center"
                  />

                  {/* Status Overlay */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-1 backdrop-blur-2xs">
                      <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
                      <span className="text-[10px] font-mono font-bold text-slate-800">
                        {item.status === 'queued' ? 'Queued' : 'Matching'}
                      </span>
                    </div>
                  )}

                  {isHighArb && !isProcessing && (
                    <div className="absolute top-1 right-1 p-1 rounded-md bg-red-600 text-white shadow-xs">
                      <Flame className="w-3 h-3 fill-current text-white" />
                    </div>
                  )}

                  {item.card?.isHighValue && !isProcessing && (
                    <div
                      className="absolute top-1 left-1 p-1 rounded-md bg-white/95 text-red-600 border border-red-300 shadow-xs"
                      title="High-value card: Tilt Test suggested"
                    >
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                  )}

                  {item.isTargetedSetCard && !isProcessing && (
                    <div
                      className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-mono font-bold flex items-center gap-0.5 shadow-xs"
                      title="Targeted set card"
                    >
                      Set Target
                    </div>
                  )}

                  {item.backThumbnailUrl && !isProcessing && (
                    <div
                      className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-900/90 text-white text-[9px] font-mono font-bold shadow-xs"
                      title="Front & Back photos attached"
                    >
                      F+B
                    </div>
                  )}
                </div>

                {/* Card Title & Number */}
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {item.card?.name || 'Identifying...'}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mb-1">
                  <span>{item.card?.setNumber || '---'}</span>
                  <span className="text-[10px] text-slate-400">
                    L:{item.sharpnessScore}
                  </span>
                </div>

                {/* Economic Profit Banner */}
                {item.economics && (
                  <div
                    className={`mt-1 text-center py-1 rounded text-[11px] font-mono font-bold ${
                      item.economics.netProfitSek > 0
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.economics.netProfitSek > 0 ? '+' : ''}
                    {item.economics.netProfitSek} SEK
                    <div className="text-[9px] font-normal opacity-80">
                      ({item.economics.roiPercentage}%)
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
