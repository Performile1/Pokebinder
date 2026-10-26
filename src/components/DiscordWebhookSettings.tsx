import React, { useState } from 'react';
import { X, Send, CheckCircle2, AlertCircle, ExternalLink, Bell, Sparkles } from 'lucide-react';
import { DiscordWebhookConfig, ArbitrageEconomics, PokemonCard } from '../types';

interface DiscordWebhookSettingsProps {
  config: DiscordWebhookConfig;
  onSaveConfig: (config: DiscordWebhookConfig) => void;
  onClose: () => void;
  sampleCard?: PokemonCard;
  sampleEconomics?: ArbitrageEconomics;
}

export const DiscordWebhookSettings: React.FC<DiscordWebhookSettingsProps> = ({
  config,
  onSaveConfig,
  onClose,
  sampleCard,
  sampleEconomics,
}) => {
  const [url, setUrl] = useState(config.url);
  const [minRoi, setMinRoi] = useState(config.minRoiThreshold || 20);
  const [autoSend, setAutoSend] = useState(config.autoSend);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const card = sampleCard || {
    id: 'base1-4',
    name: 'Charizard',
    setNumber: '4/102',
    setName: 'Base Set',
    series: 'Base',
    releaseYear: 1999,
    rarity: 'Rare Holo',
    foilType: 'Holo',
    imageUrl: 'https://images.pokemontcg.io/base1/4_hires.png',
    typicalTraderaSEK: 1850,
    typicalEbayUSD: 360,
    isHighValue: true,
  };

  const econ = sampleEconomics || {
    midMarketFxRate: 9.93,
    effectiveFxRate: 9.63,
    costOfGoodsSek: 1850,
    grossRevenueUsd: 360,
    grossRevenueSek: 3575,
    ebayFeeUsd: 47.70,
    ebayFeeSek: 474,
    fxSpreadSek: 107,
    internationalShippingUsd: 15,
    internationalShippingSek: 149,
    totalFeesSek: 730,
    netRevenueUsd: 297.30,
    netRevenueSek: 2863,
    netProfitSek: 1013,
    netProfitUsd: 102.01,
    roiPercentage: 54.76,
    isProfitable: true,
    isHighArbitrage: true,
  };

  const handleSave = () => {
    onSaveConfig({
      url: url.trim(),
      enabled: Boolean(url.trim()),
      minRoiThreshold: minRoi,
      autoSend,
    });
    onClose();
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/discord-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: url.trim(),
          cardName: card.name,
          setNumber: card.setNumber,
          economics: econ,
          imageUrl: card.imageUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setTestResult({
          success: true,
          message: data.simulated
            ? 'Simulation preview succeeded! Enter a live Discord Webhook URL to deliver directly to your channel.'
            : 'Alert sent successfully to your Discord channel with interactive buy buttons!',
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to dispatch Discord webhook.',
        });
      }
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Network error testing webhook',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header - Pokémon Red Accent */}
        <div className="flex items-center justify-between p-4 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Discord Arbitrage Alerts
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold shadow-xs">
                  Link Buttons Enabled
                </span>
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Instant smartphone push notifications with 1-click &quot;Buy on Tradera&quot; &amp; &quot;Check eBay&quot; links
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
          {/* Settings Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Discord Channel Webhook URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
              />
              <p className="mt-1 text-[11px] text-zinc-400">
                Created in Discord Server Settings &gt; Integrations &gt; Webhooks &gt; New Webhook.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Minimum Net ROI Threshold
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={minRoi}
                    onChange={(e) => setMinRoi(Number(e.target.value))}
                    className="w-24 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-sm font-mono text-white text-center focus:outline-none focus:border-red-500"
                  />
                  <span className="text-sm font-bold text-red-400">% Net Margin</span>
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSend}
                    onChange={(e) => setAutoSend(e.target.checked)}
                    className="rounded accent-red-600 w-4 h-4"
                  />
                  <span className="text-xs font-medium text-zinc-200">
                    Auto-dispatch when card scans &gt; {minRoi}% ROI
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
              )}
              <div className="leading-relaxed">{testResult.message}</div>
            </div>
          )}

          {/* Live Realistic Discord Embed Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Discord Client Message Preview
              </span>
              <span className="text-[11px] font-mono text-red-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Discord Action Row (Type 2 Buttons)
              </span>
            </div>

            {/* Mock Discord UI Frame */}
            <div className="rounded-xl bg-[#313338] p-4 text-[#dbdee1] border border-[#232428] font-sans shadow-inner">
              {/* Bot Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-bold text-xs text-white shadow-xs">
                  PA
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-semibold text-white">PokéArb Scanner</span>
                  <span className="text-[10px] bg-[#5865f2] text-white px-1 rounded font-bold">BOT</span>
                  <span className="text-[11px] text-[#949ba4]">Today at 9:46 AM</span>
                </div>
              </div>

              {/* Rich Embed Box */}
              <div className="ml-10 border-l-4 border-red-600 rounded-r-lg bg-[#2b2d31] p-3 max-w-lg">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white hover:underline cursor-pointer">
                      🚨 Arbitrage Alert: {card.name} ({card.setNumber})
                    </h4>
                    <p className="text-xs text-[#b5bac1] mt-0.5">
                      A card with &gt; 20% net margin has been scanned.
                    </p>
                  </div>
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-16 h-22 object-cover rounded shadow"
                  />
                </div>

                {/* Embed Fields Grid */}
                <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                  <div>
                    <div className="text-[11px] uppercase font-bold text-[#b5bac1]">Tradera (Buy)</div>
                    <div className="text-white font-medium">{econ.costOfGoodsSek} SEK</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-bold text-[#b5bac1]">eBay (Sell)</div>
                    <div className="text-white font-medium">{econ.grossRevenueSek} SEK (${econ.grossRevenueUsd})</div>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-[#35373c]">
                    <div className="text-[11px] uppercase font-bold text-[#b5bac1]">Net Profit (After Fees/Shipping)</div>
                    <div className="text-[#57f287] font-bold text-sm">+{econ.netProfitSek} SEK (~${econ.netProfitUsd})</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-bold text-[#b5bac1]">Net ROI</div>
                    <div className="text-[#57f287] font-bold">+{econ.roiPercentage}%</div>
                  </div>
                </div>

                <div className="text-[10px] text-[#949ba4] mt-3 pt-2 border-t border-[#35373c] flex items-center justify-between">
                  <span>PokéArb Scanner</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Discord Interactive Action Row Buttons */}
              <div className="ml-10 mt-2 flex flex-wrap gap-2">
                <a
                  href={`https://www.tradera.com/search?q=${encodeURIComponent(card.name + ' ' + card.setNumber)}&itemStatus=Active`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded bg-[#4e5058] hover:bg-[#6d6f78] text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <span>🛒</span> Buy on Tradera <ExternalLink className="w-3 h-3 text-slate-300 ml-0.5" />
                </a>

                <a
                  href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent('Pokemon ' + card.name + ' ' + card.setNumber + ' -PSA -CGC -BGS')}&LH_Sold=1&LH_Complete=1`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded bg-[#4e5058] hover:bg-[#6d6f78] text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <span>📈</span> Check eBay Comps <ExternalLink className="w-3 h-3 text-slate-300 ml-0.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={handleSendTest}
            disabled={isSendingTest}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition"
          >
            <Send className="w-3.5 h-3.5 text-red-400" />
            {isSendingTest ? 'Sending...' : 'Test Alert Delivery'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition shadow-lg shadow-red-600/30"
            >
              Save Webhook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
