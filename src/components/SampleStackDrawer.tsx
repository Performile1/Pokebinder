import React from 'react';
import { X, Layers, Zap, Sparkles, PlusCircle } from 'lucide-react';
import { POKEMON_CARD_DATABASE } from '../data/pokemonCards';
import { PokemonCard } from '../types';

interface SampleStackDrawerProps {
  onClose: () => void;
  onInjectStack: (count: number) => void;
  onInjectSingleCard: (card: PokemonCard) => void;
}

export const SampleStackDrawer: React.FC<SampleStackDrawerProps> = ({
  onClose,
  onInjectStack,
  onInjectSingleCard,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header - Pokémon Red Accent */}
        <div className="flex items-center justify-between p-4 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Rapid Test Stack Generator
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Simulate high-volume continuous camera scanning for batches of 5 to 25 cards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Batch Injections */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 block">
              Continuous Stack Presets
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  onInjectStack(5);
                  onClose();
                }}
                className="p-4 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 hover:border-red-500/50 text-left transition group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white group-hover:text-red-400">
                    Mini Stack (5 Cards)
                  </span>
                  <Zap className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-xs text-zinc-400">
                  Quick test of continuous auto-snap queue &amp; margin calculation.
                </p>
              </button>

              <button
                onClick={() => {
                  onInjectStack(10);
                  onClose();
                }}
                className="p-4 rounded-xl bg-gradient-to-br from-red-600/10 to-zinc-950 hover:from-red-600/20 border border-red-500/40 hover:border-red-500 text-left transition group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white group-hover:text-red-300">
                    Standard Deck (10 Cards)
                  </span>
                  <Sparkles className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-xs text-zinc-400">
                  Includes Base Set Charizard, Moonbreon, and top arbitrage grails.
                </p>
              </button>

              <button
                onClick={() => {
                  onInjectStack(25);
                  onClose();
                }}
                className="p-4 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-500 text-left transition group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white group-hover:text-zinc-200">
                    High Volume (25 Cards)
                  </span>
                  <Layers className="w-4 h-4 text-zinc-400" />
                </div>
                <p className="text-xs text-zinc-400">
                  Stress-tests local queue draining &amp; Discord webhook triggers.
                </p>
              </button>
            </div>
          </div>

          {/* Individual Card Picker */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 block">
              Or Scan Individual Iconic Card
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {POKEMON_CARD_DATABASE.map((card) => (
                <div
                  key={card.id}
                  onClick={() => {
                    onInjectSingleCard(card);
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-red-500/60 cursor-pointer transition flex flex-col group"
                >
                  <div className="w-full h-32 rounded-lg overflow-hidden bg-zinc-900 mb-2 relative">
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {card.isHighValue && (
                      <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-red-600 text-[9px] font-mono text-white font-bold">
                        GRAIL
                      </span>
                    )}
                  </div>
                  <h5 className="text-xs font-bold text-white truncate group-hover:text-red-400">
                    {card.name}
                  </h5>
                  <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono mt-1">
                    <span>{card.setNumber}</span>
                    <span className="text-red-400 font-bold">${card.typicalEbayUSD}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
