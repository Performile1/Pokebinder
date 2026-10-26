import React, { useState } from 'react';
import {
  X,
  Settings,
  ShieldAlert,
  Sliders,
  DollarSign,
  Lock,
  Volume2,
  Camera,
  CheckCircle2,
  Plus,
  Trash2,
  Info,
  Scale,
  Sparkles,
} from 'lucide-react';
import { AppSettings, DiscordWebhookConfig } from '../types';
import { DEFAULT_PROXY_KEYWORDS } from '../utils/filterProxy';

interface SettingsModalProps {
  settings: AppSettings;
  discordConfig: DiscordWebhookConfig;
  onSaveSettings: (settings: AppSettings, discordConfig: DiscordWebhookConfig) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  discordConfig,
  onSaveSettings,
  onClose,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const [localDiscord, setLocalDiscord] = useState<DiscordWebhookConfig>({ ...discordConfig });
  const [newKeyword, setNewKeyword] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'valuation' | 'antifake' | 'api' | 'camera'>('valuation');

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim().toLowerCase();
    if (trimmed && !localSettings.proxyKeywords.includes(trimmed)) {
      setLocalSettings({
        ...localSettings,
        proxyKeywords: [...localSettings.proxyKeywords, trimmed],
      });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setLocalSettings({
      ...localSettings,
      proxyKeywords: localSettings.proxyKeywords.filter((k) => k !== kw),
    });
  };

  const handleSave = () => {
    onSaveSettings(localSettings, localDiscord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header - Bright Pokémon Red */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-600 via-red-500 to-rose-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs text-white">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                System &amp; Valuation Settings
              </h3>
              <p className="text-xs text-red-100 font-mono">
                Cross-Border Arbitrage, Anti-Fake IQR Filter &bull; API Architecture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('valuation')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'valuation'
                ? 'border-red-600 text-red-600 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Valuation &amp; Bids
          </button>
          <button
            onClick={() => setActiveTab('antifake')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'antifake'
                ? 'border-red-600 text-red-600 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Proxy &amp; IQR Shield
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'api'
                ? 'border-red-600 text-red-600 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            API &amp; Security
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'camera'
                ? 'border-red-600 text-red-600 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Scanner Controls
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs">
          {/* TAB 1: Valuation & Leading Bids vs Sold For */}
          {activeTab === 'valuation' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  Acquisition Valuation Basis (Tradera)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setLocalSettings({ ...localSettings, valuationBasis: 'sold_for' })}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col gap-1 ${
                      localSettings.valuationBasis === 'sold_for'
                        ? 'border-red-600 bg-red-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        Sold For (Slutpris)
                      </span>
                      {localSettings.valuationBasis === 'sold_for' && (
                        <CheckCircle2 className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Prices based on completed, ended sales. Conservative and proven market data.
                    </p>
                  </div>

                  <div
                    onClick={() => setLocalSettings({ ...localSettings, valuationBasis: 'leading_bid' })}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col gap-1 ${
                      localSettings.valuationBasis === 'leading_bid'
                        ? 'border-red-600 bg-red-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        Leading Bid (Auction Sniping)
                      </span>
                      {localSettings.valuationBasis === 'leading_bid' && (
                        <CheckCircle2 className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Calculates margins against active high bids to spot undervalued lots before auction close.
                    </p>
                  </div>
                </div>
              </div>

              {/* Target Grading Class */}
              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 mb-1.5">
                  Target Valuation Category
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'raw', label: 'Raw NM / Ungraded (Default)' },
                    { id: 'psa10', label: 'PSA 10 Gem Mint Slabs' },
                    { id: 'psa9', label: 'PSA 9 Mint Slabs' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() =>
                        setLocalSettings({ ...localSettings, targetSlabType: cat.id as any })
                      }
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                        localSettings.targetSlabType === cat.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Financial Constants */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="block text-[11px] text-slate-500 uppercase font-mono">
                    eBay Category Fee
                  </label>
                  <div className="flex items-center gap-1 mt-1 font-mono font-bold text-slate-800 text-sm">
                    <input
                      type="number"
                      step="0.01"
                      value={localSettings.ebayFeeRate * 100}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          ebayFeeRate: Number(e.target.value) / 100,
                        })
                      }
                      className="w-16 px-1.5 py-0.5 rounded border border-slate-300 bg-white"
                    />
                    <span>%</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="block text-[11px] text-slate-500 uppercase font-mono">
                    Hidden FX Spread
                  </label>
                  <div className="flex items-center gap-1 mt-1 font-mono font-bold text-slate-800 text-sm">
                    <input
                      type="number"
                      step="0.1"
                      value={localSettings.fxSpreadPercent}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          fxSpreadPercent: Number(e.target.value),
                        })
                      }
                      className="w-16 px-1.5 py-0.5 rounded border border-slate-300 bg-white"
                    />
                    <span>%</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="block text-[11px] text-slate-500 uppercase font-mono">
                    Tracked Postage
                  </label>
                  <div className="flex items-center gap-1 mt-1 font-mono font-bold text-slate-800 text-sm">
                    <span>$</span>
                    <input
                      type="number"
                      value={localSettings.intShippingUsd}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          intShippingUsd: Number(e.target.value),
                        })
                      }
                      className="w-16 px-1.5 py-0.5 rounded border border-slate-300 bg-white"
                    />
                    <span>USD</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="block text-[11px] text-slate-500 uppercase font-mono">
                    Cardmarket EU Fee
                  </label>
                  <div className="flex items-center gap-1 mt-1 font-mono font-bold text-slate-800 text-sm">
                    <input
                      type="number"
                      step="0.01"
                      value={(localSettings.cardmarketFeeRate || 0.05) * 100}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          cardmarketFeeRate: Number(e.target.value) / 100,
                        })
                      }
                      className="w-16 px-1.5 py-0.5 rounded border border-slate-300 bg-white"
                    />
                    <span>% (0% tull)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Anti-Fake Keyword Blacklist & Statistical IQR */}
          {activeTab === 'antifake' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-slate-700 leading-relaxed text-xs">
                <span className="font-bold text-red-700 flex items-center gap-1 mb-1">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Two-Pronged Defense Against Fake &amp; Proxy Sales
                </span>
                Prevents $15 proxy cards from polluting real market averages via title regex filtering and mathematical Interquartile Range (IQR) lower-bound outlier trimming.
              </div>

              {/* IQR Sensitivity Slider */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold text-slate-800">
                    IQR Math Outlier Strictness
                  </span>
                  <span className="font-mono font-bold text-red-600">
                    Floor: Q1 - {localSettings.iqrMultiplier} &times; IQR
                  </span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.8"
                  step="0.1"
                  value={localSettings.iqrMultiplier}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      iqrMultiplier: Number(e.target.value),
                    })
                  }
                  className="w-full accent-red-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>Aggressive (0.6x - rejects more fakes)</span>
                  <span>Standard (1.0x)</span>
                  <span>Permissive (1.8x)</span>
                </div>
              </div>

              {/* Keyword Blacklist */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 mb-1.5">
                  Blacklisted Proxy Keywords (Regex)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                    placeholder="Add fake identifier (e.g. foil-replica, proxy)..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={handleAddKeyword}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 max-h-36 overflow-y-auto">
                  {localSettings.proxyKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-mono text-slate-700 shadow-2xs"
                    >
                      {kw}
                      <button
                        onClick={() => handleRemoveKeyword(kw)}
                        className="text-slate-400 hover:text-red-500 ml-0.5"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: API & Security Architecture (Addresses user's API code question) */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Lock className="w-4 h-4 text-red-600" />
                  Do We Need to Add API Codes in the UI?
                </div>
                <p className="text-slate-600 leading-relaxed text-xs">
                  <strong>No manual API key entry is required in this frontend.</strong> In accordance with full-stack security best practices, all external API keys (Gemini Multimodal Vision, eBay Developers REST, Tradera, CompSniper) are maintained <strong>securely on the server</strong> via environment variables (<code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">.env</code>).
                </p>
                <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs space-y-2">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Server-Side Proxy Architecture
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                    <li><code className="font-mono">/api/recognize</code>: Multimodal card art &amp; set number extraction</li>
                    <li><code className="font-mono">/api/fx</code>: Live mid-market exchange rates directly from ECB via Frankfurter</li>
                    <li><code className="font-mono">/api/arbitrage</code>: Mathematically computes net profit after fees and conversion</li>
                    <li><code className="font-mono">/api/discord-webhook</code>: Secure relay for push notifications</li>
                  </ul>
                </div>
              </div>

              {/* Discord Webhook field */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Discord Push Webhook URL
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={localDiscord.autoSend}
                      onChange={(e) =>
                        setLocalDiscord({ ...localDiscord, autoSend: e.target.checked })
                      }
                      className="rounded accent-red-600"
                    />
                    Auto-fire on &gt;{localDiscord.minRoiThreshold}% ROI
                  </label>
                </div>
                <input
                  type="url"
                  value={localDiscord.url}
                  onChange={(e) =>
                    setLocalDiscord({
                      ...localDiscord,
                      url: e.target.value,
                      enabled: Boolean(e.target.value.trim()),
                    })
                  }
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono bg-white text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          )}

          {/* TAB 4: Camera & Auto-Snap Controls */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-bold text-slate-800 text-xs">
                      Default Auto-Snap On
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Viewfinder will continuously scan stacks hands-free on launch.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.autoSnapEnabled}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, autoSnapEnabled: e.target.checked })
                    }
                    className="rounded accent-red-600 w-4 h-4"
                  />
                </label>

                <div className="pt-2 border-t border-slate-200">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-bold text-slate-800 text-xs">
                        Audio Shutter &amp; Chimes
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Plays mechanical double-click on snap and alert arpeggio on &gt;20% margin.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.soundEnabled}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, soundEnabled: e.target.checked })
                      }
                      className="rounded accent-red-600 w-4 h-4"
                    />
                  </label>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800">
                    Laplacian Focus Blur Gate
                  </span>
                  <span className="font-mono font-bold text-red-600">
                    {localSettings.blurThreshold}
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="160"
                  value={localSettings.blurThreshold}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      blurThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full accent-red-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>Fast/Permissive (40)</span>
                  <span>Strict (160)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={() => {
              setLocalSettings({
                ...localSettings,
                proxyKeywords: DEFAULT_PROXY_KEYWORDS,
                iqrMultiplier: 1.0,
              });
            }}
            className="text-slate-500 hover:text-slate-800 text-xs underline"
          >
            Reset Defaults
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/20 transition"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
