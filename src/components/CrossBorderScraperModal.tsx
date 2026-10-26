import React, { useState } from 'react';
import {
  Globe,
  Terminal,
  Server,
  Play,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  Code2,
  ShieldCheck,
  Flame,
  ArrowRight,
  ExternalLink,
  Coins,
  Cpu,
} from 'lucide-react';
import { AppSettings } from '../types';

interface Props {
  settings: AppSettings;
  eurToSek: number;
  usdToSek: number;
  jpyToSek: number;
  onSaveSettings: (settings: AppSettings) => void;
  onClose: () => void;
}

export function CrossBorderScraperModal({
  settings,
  eurToSek,
  usdToSek,
  jpyToSek,
  onSaveSettings,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState<'tester' | 'docker' | 'markets' | 'customs'>('tester');
  const [testUrl, setTestUrl] = useState(
    'https://www.cardmarket.com/en/Pokemon/Products/Singles/Base-Set/Charizard'
  );
  const [remoteVpsUrl, setRemoteVpsUrl] = useState(settings.scraperMicroserviceUrl || '');
  const [isScraping, setIsScraping] = useState(false);
  const [scraperResult, setScraperResult] = useState<any>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Customs calculator state
  const [customsOrigin, setCustomsOrigin] = useState<'JP' | 'US' | 'EU'>('JP');
  const [customsPrice, setCustomsPrice] = useState<number>(28500);
  const [customsResult, setCustomsResult] = useState<any>(null);

  // Copy helper
  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Test scraper endpoint
  const handleRunScrape = async () => {
    setIsScraping(true);
    setScrapeError(null);
    setScraperResult(null);

    try {
      const res = await fetch('/api/scraper/cardmarket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardUrl: testUrl,
          remoteVpsUrl: remoteVpsUrl.trim() || undefined,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Scraping API returned a non-JSON response (HTTP ${res.status}). Check that the backend is deployed and available.`);
      }
      const data = await res.json();
      if (res.ok) {
        setScraperResult(data);
      } else {
        setScrapeError(data.error || 'Scraping-anropet misslyckades');
      }
    } catch (err: any) {
      setScrapeError(err.message || 'Nätverksfel vid anrop till skrapmotorn');
    } finally {
      setIsScraping(false);
    }
  };

  // Test customs calculator
  const handleCalcCustoms = async () => {
    try {
      const currency = customsOrigin === 'JP' ? 'JPY' : customsOrigin === 'EU' ? 'EUR' : 'USD';
      const res = await fetch('/api/customs-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originCountry: customsOrigin,
          nativePrice: customsPrice,
          nativeCurrency: currency,
        }),
      });
      const data = await res.json();
      setCustomsResult(data);
    } catch (err) {
      console.error(err);
    }
  };

  const DOCKERFILE_CODE = `# Använd Puppeteers officiella basimage som har Chromium och alla beroenden förinstallerade
FROM ghcr.io/puppeteer/puppeteer:21.11.0

# Sätt arbetskatalog i containern
WORKDIR /usr/src/app

# Kopiera package-filer och installera beroenden
COPY package*.json ./
RUN npm ci --production

# Kopiera över skrap-koden
COPY . .

# Exponera porten för microservicen
EXPOSE 3001

# Starta servern (Express som kör skrapan)
CMD ["node", "server.js"]`;

  const SERVER_JS_CODE = `import express from 'express';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Aktivera stealth-modulen för att passera Cardmarkets Cloudflare-skydd
puppeteer.use(StealthPlugin());

const app = express();
app.use(express.json());

app.post('/scrape', async (req, res) => {
  let browser = null;
  try {
    const { cardUrl } = req.body;
    if (!cardUrl) return res.status(400).json({ error: 'cardUrl is required' });

    // Starta Chromium med alla Docker/Linux sandlådeflaggor
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Förhindrar minneskrascher i Docker
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto(cardUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.info-list-container', { timeout: 10000 });

    const pricingData = await page.evaluate(() => {
      const dtElements = Array.from(document.querySelectorAll('dt'));
      let trendPrice = 0;
      let lowestPrice = 0;

      dtElements.forEach(dt => {
        if (dt.textContent?.includes('Price Trend')) {
          const dd = dt.nextElementSibling;
          trendPrice = parseFloat(dd?.textContent?.replace('€', '').replace(',', '.') || '0');
        }
        if (dt.textContent?.includes('From')) {
          const dd = dt.nextElementSibling;
          lowestPrice = parseFloat(dd?.textContent?.replace('€', '').replace(',', '.') || '0');
        }
      });
      return { trendPrice, lowestPrice };
    });

    await browser.close();
    return res.json({ source: 'Cardmarket', currency: 'EUR', pricingData });
  } catch (error) {
    if (browser) await browser.close();
    return res.status(500).json({ error: error.message });
  }
});

app.listen(3001, '0.0.0.0', () => {
  console.log('Cardmarket Stealth Scraper Microservice running on port 3001');
});`;

  const DOCKER_COMMANDS = `# 1. Bygg din Docker-image på Hetzner CX22 VPS:
docker build -t cardmarket-scraper .

# 2. Starta containern i bakgrunden och mappa port 3001:
docker run -d -p 3001:3001 --restart always --name scraper-service cardmarket-scraper

# 3. Testa din VPS via curl:
curl -X POST http://localhost:3001/scrape \\
  -H "Content-Type: application/json" \\
  -d '{"cardUrl":"https://www.cardmarket.com/en/Pokemon/Products/Singles/Base-Set/Charizard"}'`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                Cross-Border Scraper &amp; Microservice Hub
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  Cardmarket Cloudflare Bypass
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Puppeteer-Stealth Docker Architecture &bull; EU vs Tradera Arbitrage &bull; Mercari Japan Moms Calculator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm transition"
          >
            &times;
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-slate-200 bg-white flex items-center gap-1 overflow-x-auto text-xs font-bold pt-2">
          <button
            onClick={() => setActiveTab('tester')}
            className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tester'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Live Scraper Test
          </button>
          <button
            onClick={() => setActiveTab('docker')}
            className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'docker'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Hetzner VPS &amp; Docker Setup
          </button>
          <button
            onClick={() => setActiveTab('markets')}
            className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'markets'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            De 4 Huvudmarknaderna
          </button>
          <button
            onClick={() => setActiveTab('customs')}
            className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'customs'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            Tull- &amp; Momskalkylator
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* TAB 1: Live Scraper Tester */}
          {activeTab === 'tester' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-red-600" />
                    Testa Cardmarket Stealth Scraper
                  </h4>
                  <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Bypasses Cloudflare CAPTCHA
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Cardmarket Produkt-URL:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={testUrl}
                      onChange={(e) => setTestUrl(e.target.value)}
                      placeholder="https://www.cardmarket.com/en/Pokemon/Products/Singles/..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white"
                    />
                    <button
                      onClick={handleRunScrape}
                      disabled={isScraping}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                    >
                      {isScraping ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Skrapar...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Kör Skrapa
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-mono">Snabbval:</span>
                  {[
                    { label: 'Charizard Base Set', slug: 'Base-Set/Charizard' },
                    { label: 'Umbreon VMAX Alt Art', slug: 'Evolving-Skies/Umbreon-VMAX-V2' },
                    { label: 'Blastoise Base Set', slug: 'Base-Set/Blastoise' },
                    { label: '151 Charizard ex SIR', slug: '151/Charizard-ex-V2' },
                    { label: 'Fusion Strike Gengar VMAX', slug: 'Fusion-Strike/Gengar-VMAX-V2' },
                  ].map((preset) => (
                    <button
                      key={preset.slug}
                      onClick={() =>
                        setTestUrl(`https://www.cardmarket.com/en/Pokemon/Products/Singles/${preset.slug}`)
                      }
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-mono transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Remote VPS Endpoint configuration */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-slate-500" />
                      Egen Hetzner VPS Microservice URL (Valfritt):
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {remoteVpsUrl ? 'Proxyar anrop till din VPS' : 'Kör inbyggd stealth-motor'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={remoteVpsUrl}
                    onChange={(e) => {
                      setRemoteVpsUrl(e.target.value);
                      onSaveSettings({ ...settings, scraperMicroserviceUrl: e.target.value });
                    }}
                    placeholder="http://<din-vps-ip>:3001"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700"
                  />
                  <p className="text-[11px] text-slate-500">
                    Om du har startat Docker-containern på en Hetzner CX22 VPS anger du IP-adressen ovan. Annars används AI Studios integrerade stealth-proxy.
                  </p>
                </div>
              </div>

              {/* Scraper Response Output */}
              {scraperResult && (
                <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-900 text-xs">
                        {scraperResult.simulated ? 'DEMO — simulated prices, not live market data' : 'Skrapning slutförd'} ({scraperResult.source})
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {scraperResult.customsPolicy}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] uppercase font-mono text-slate-500">Price Trend (EUR)</div>
                      <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                        €{scraperResult.priceTrendEUR?.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        ~{scraperResult.priceTrendSEK?.toLocaleString()} SEK
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] uppercase font-mono text-slate-500">Lowest "From" (EUR)</div>
                      <div className="text-xl font-bold font-mono text-red-600 mt-0.5">
                        €{scraperResult.lowestPriceEUR?.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        ~{scraperResult.lowestPriceSEK?.toLocaleString()} SEK
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] uppercase font-mono text-slate-500">30-Day Avg</div>
                      <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                        €{scraperResult.avg30DaysEUR?.toFixed(2) || '-'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Volymstabil comp
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] uppercase font-mono text-slate-500">Tillgängliga ex</div>
                      <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                        {scraperResult.availableItems || '25+'} st
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Aktiva listningar
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                    <span>Växelkurs: <strong>1 EUR = {eurToSek} SEK</strong> (Frankfurter ECB)</span>
                    <a
                      href={scraperResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 font-semibold flex items-center gap-1 hover:underline"
                    >
                      Öppna på Cardmarket <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {scrapeError && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{scrapeError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Hetzner VPS & Docker Setup */}
          {activeTab === 'docker' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-red-600" />
                  Varför behövs en Hetzner VPS för Puppeteer Stealth?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Serverless-miljöer (som Vercel eller Lambda) har en hård gräns på 50 MB och saknar de grafiska Linux-bibliotek som Chromium behöver för att starta. För att skrapa Cardmarket utan att fastna i Cloudflares CAPTCHA-skydd kör vi en separat microservice i en officiell Debian-baserad Puppeteer-container på en billig Hetzner CX22-server (~45 kr/månad).
                </p>
              </div>

              {/* Step 1: Dockerfile */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-red-600" />
                    1. Dockerfile (Baserad på officiell Debian Chromium)
                  </span>
                  <button
                    onClick={() => handleCopy(DOCKERFILE_CODE, 'dockerfile')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    {copiedSection === 'dockerfile' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSection === 'dockerfile' ? 'Kopierat!' : 'Kopiera'}
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto">
                  {DOCKERFILE_CODE}
                </pre>
              </div>

              {/* Step 2: server.js */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-red-600" />
                    2. server.js (Express + Puppeteer-Extra Stealth)
                  </span>
                  <button
                    onClick={() => handleCopy(SERVER_JS_CODE, 'serverjs')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    {copiedSection === 'serverjs' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSection === 'serverjs' ? 'Kopierat!' : 'Kopiera'}
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-52">
                  {SERVER_JS_CODE}
                </pre>
              </div>

              {/* Step 3: Deploy Commands */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-red-600" />
                    3. Hetzner Terminal Kommandon
                  </span>
                  <button
                    onClick={() => handleCopy(DOCKER_COMMANDS, 'commands')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    {copiedSection === 'commands' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSection === 'commands' ? 'Kopierat!' : 'Kopiera'}
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto">
                  {DOCKER_COMMANDS}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: The 4 Key Markets */}
          {activeTab === 'markets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cardmarket */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🇪🇺</span>
                    <h5 className="font-bold text-slate-900 text-sm">Cardmarket (Europa)</h5>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                    0% Tull &amp; Moms
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Europas största TCG-marknad. Priserna sätts i EUR. Eftersom både Sverige och säljarna på kontinenten befinner sig inom EU:s inre marknad råder fri rörlighet: noll tull, noll importmoms och billig spårbar post.
                </p>
                <div className="text-[11px] font-mono text-slate-500 pt-1">
                  <strong>Nyckeltal:</strong> Price Trend, Lowest "From", 30-Day Avg.
                </div>
              </div>

              {/* TCGPlayer */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🇺🇸</span>
                    <h5 className="font-bold text-slate-900 text-sm">TCGPlayer (USA)</h5>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono font-bold">
                    Global Benchmark
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Amerikanska guldstandarden som definierar det globala marknadspriset. Deras officiella API ger exakt data på Market Price, Low, Mid och High. Nödvändigt för att värdera kort innan amerikansk frakt och tull kalkyleras.
                </p>
                <div className="text-[11px] font-mono text-slate-500 pt-1">
                  <strong>Nyckeltal:</strong> Market Price, Direct Low, Sub-grades.
                </div>
              </div>

              {/* Mercari Japan */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🇯🇵</span>
                    <h5 className="font-bold text-slate-900 text-sm">Mercari &amp; Yahoo! Japan</h5>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">
                    Kräver Momskalkyl
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Största källan för underprissatta japanska råkort och vintage-samlingar via Buyee/proxy. Vår kalkylator drar automatiskt av 25% svensk importmoms, 75 kr PostNord-hantering och flygfrakt för att hitta verkliga fynd.
                </p>
                <div className="text-[11px] font-mono text-slate-500 pt-1">
                  <strong>Nyckeltal:</strong> JPY pris, Buyee fee (300¥), 25% moms.
                </div>
              </div>

              {/* Blocket */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🇸🇪</span>
                    <h5 className="font-bold text-slate-900 text-sm">Blocket &amp; Facebook Marketplace</h5>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-mono font-bold">
                    Lokala Fynd
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sveriges lokala fyndhörna. Här säljs osorterade barndomssamlingar och pärmar för en bråkdel av styckvärdet. Köp billigt via Swish, skanna in korten med appen och lista de värdefulla på Cardmarket/Tradera!
                </p>
                <div className="text-[11px] font-mono text-slate-500 pt-1">
                  <strong>Nyckeltal:</strong> Pärmpriser, Swish, Blocketpaketet.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Customs & Moms Calculator */}
          {activeTab === 'customs' && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-red-600" />
                Interaktiv Import- &amp; Momskalkylator (Sverige)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Ursprungsland:
                  </label>
                  <select
                    value={customsOrigin}
                    onChange={(e) => setCustomsOrigin(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="JP">🇯🇵 Japan (Mercari / Yahoo Japan)</option>
                    <option value="EU">🇪🇺 Europeiska Unionen (Cardmarket)</option>
                    <option value="US">🇺🇸 USA (eBay / TCGPlayer)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Kortpris i originalvaluta:
                  </label>
                  <input
                    type="number"
                    value={customsPrice}
                    onChange={(e) => setCustomsPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleCalcCustoms}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Beräkna Landat Pris
                  </button>
                </div>
              </div>

              {customsResult && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>{customsResult.origin}</span>
                    <span className="font-mono text-base text-red-600 font-extrabold">
                      Totalt Landat: {customsResult.totalLandedCostSek?.toLocaleString()} SEK
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <div className="text-slate-400">Varuvärde (SEK)</div>
                      <div className="font-bold text-slate-800">{customsResult.baseCostSek} kr</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <div className="text-slate-400">Importmoms (25%)</div>
                      <div className="font-bold text-red-600">+{customsResult.importMomsSek} kr</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <div className="text-slate-400">PostNord Avgift</div>
                      <div className="font-bold text-slate-800">{customsResult.postNordHandlingSek} kr</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <div className="text-slate-400">Spårbar Frakt</div>
                      <div className="font-bold text-slate-800">+{customsResult.shippingSek} kr</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans pt-1">
                    {customsResult.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Integrerad med ECB &bull; Frankfurter API &bull; Cardmarket Cloudflare Stealth
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
          >
            Stäng Hubben
          </button>
        </div>
      </div>
    </div>
  );
}
