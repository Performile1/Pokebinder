import React from 'react';
import { X, Award, CheckCircle, Crosshair, Sparkles, Scale, Info } from 'lucide-react';
import { ScanItem } from '../types';

interface ConditionScreeningModalProps {
  item: ScanItem;
  onClose: () => void;
  onUpdateCondition?: (updatedItem: ScanItem) => void;
}

export const ConditionScreeningModal: React.FC<ConditionScreeningModalProps> = ({
  item,
  onClose,
}) => {
  const { card, condition } = item;
  if (!card) return null;

  const centering = condition?.centering || {
    leftRightRatio: [52, 48],
    topBottomRatio: [51, 49],
    frontCenteringGrade: 'PSA 10 (<= 55/45)',
  };

  const lr = centering.leftRightRatio;
  const tb = centering.topBottomRatio;

  // Grade estimated multipliers
  const rawPriceUsd = card.typicalEbayUSD;
  const psa9EstUsd = Math.round(rawPriceUsd * 2.2);
  const psa10EstUsd = Math.round(rawPriceUsd * 6.5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header - Pokémon Red Accent */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 text-red-600 border border-red-200">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Condition Pre-Screening &amp; Sub-Grades
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {card.name} &bull; {card.setNumber} ({card.setName})
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Card Preview with Digital Caliper Overlays */}
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <div className="relative w-52 h-72 rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-50 flex-shrink-0 group">
              <img
                src={card.imageUrl}
                alt={card.name}
                className="w-full h-full object-cover"
              />

              {/* Digital Caliper Overlay Lines */}
              <div className="absolute inset-x-0 top-[8%] h-0.5 bg-red-500/80 dashed" />
              <div className="absolute inset-x-0 bottom-[8%] h-0.5 bg-red-500/80 dashed" />
              <div className="absolute inset-y-0 left-[7%] w-0.5 bg-red-500/80 dashed" />
              <div className="absolute inset-y-0 right-[7%] w-0.5 bg-red-500/80 dashed" />

              {/* Caliper Badges */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-white/95 border border-red-500 text-[9px] font-mono text-red-600 font-bold shadow-xs">
                TB: {tb[0]}:{tb[1]}
              </div>
              <div className="absolute left-1 top-1/2 -translate-y-1/2 px-1 py-0.5 rounded bg-white/95 border border-red-500 text-[9px] font-mono text-red-600 font-bold shadow-xs">
                L {lr[0]}%
              </div>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 px-1 py-0.5 rounded bg-white/95 border border-red-500 text-[9px] font-mono text-red-600 font-bold shadow-xs">
                R {lr[1]}%
              </div>
            </div>

            {/* Sub-Grade Summary */}
            <div className="flex-1 space-y-4 w-full">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase font-mono text-slate-500">Centering Evaluation</span>
                  <span className="px-2 py-0.5 rounded-full bg-red-100 border border-red-200 text-red-700 text-xs font-mono font-bold">
                    {centering.frontCenteringGrade}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>Left / Right Margin Ratio:</span>
                    <span className="font-mono font-bold text-slate-900">{lr[0]}% / {lr[1]}%</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Top / Bottom Margin Ratio:</span>
                    <span className="font-mono font-bold text-slate-900">{tb[0]}% / {tb[1]}%</span>
                  </div>
                  <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5 border-t border-slate-200">
                    <Info className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                    PSA 10 standard requires &le; 55/45 front border centering.
                  </div>
                </div>
              </div>

              {/* Physical Sub-Categories */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase">Corner Whitening</div>
                  <div className="text-slate-800 font-bold mt-0.5">
                    {condition?.cornerWhitening || 'None (Pristine)'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase">Edge Integrity</div>
                  <div className="text-slate-800 font-bold mt-0.5">
                    {condition?.edgeWear || 'Clean Factory Cut'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase">Surface &amp; Holo</div>
                  <div className="text-red-600 font-bold mt-0.5">
                    {condition?.surfaceQuality || 'Flawless Foil'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase">Overall Sub-Grade</div>
                  <div className="text-slate-900 font-bold mt-0.5 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-red-600" />
                    {condition?.estimatedGrade || 'PSA 9-10 Contender'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Graded vs Raw Value Comparison */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-red-600" />
              Condition-Adjusted Value Potential
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                <div className="text-[10px] uppercase font-mono text-slate-500">Raw NM (Baseline)</div>
                <div className="text-base font-bold text-slate-900 mt-1">${rawPriceUsd}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">eBay Comps</div>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                <div className="text-[10px] uppercase font-mono text-slate-700 font-semibold">PSA 9 Mint</div>
                <div className="text-base font-bold text-slate-900 mt-1">${psa9EstUsd}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">+120% Premium</div>
              </div>

              <div className="p-3 rounded-lg bg-red-50 border border-red-200 shadow-xs">
                <div className="text-[10px] uppercase font-mono text-red-700 font-bold">PSA 10 Gem</div>
                <div className="text-base font-bold text-red-600 mt-1">${psa10EstUsd}</div>
                <div className="text-[10px] text-red-500 font-mono mt-0.5">+550% Premium</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition shadow-md shadow-red-600/20"
          >
            Done Pre-Screening
          </button>
        </div>
      </div>
    </div>
  );
};
