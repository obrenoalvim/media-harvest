function App() {
  return (
    <div className="min-h-screen bg-[#0a0c12] text-gray-200 overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#252936]/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center glow">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">MediaHarvest</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#install" className="hover:text-white transition-colors">Install</a>
          </div>
          <a
            href="#install"
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            Get Extension
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Chrome & Brave DevTools Extension · Windows, Mac, Linux
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-up" style={{ animationDelay: "0.05s" }}>
            Harvest media from
            <br />
            <span className="text-gradient">any website</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up" style={{ animationDelay: "0.1s" }}>
            A beautiful DevTools panel that captures every image and video from network requests.
            Filter, preview, and download them with a single click.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <a
              href="#install"
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold transition-all hover:scale-105 glow"
            >
              Install for Chrome & Brave
            </a>
            <a
              href="#how"
              className="px-8 py-3.5 rounded-xl border border-[#252936] hover:border-gray-600 text-gray-300 font-semibold transition-colors"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Mockup */}
        <div className="relative max-w-5xl mx-auto mt-16 animate-float">
          <div className="rounded-2xl border border-[#252936] bg-[#11141d] overflow-hidden shadow-2xl">
            {/* Window bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#252936] bg-[#0a0c12]">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <div className="ml-3 flex gap-1 text-xs text-gray-500">
                <span className="px-3 py-1 rounded-t-lg bg-[#11141d] text-gray-300">Network</span>
                <span className="px-3 py-1 rounded-t-lg bg-blue-600 text-white font-medium">MediaHarvest</span>
              </div>
            </div>
            {/* Panel content mockup */}
            <div className="p-4 bg-[#0f1117]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white">MediaHarvest</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-semibold uppercase">Listening</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-3 text-xs">
                    <div className="text-center"><div className="font-bold text-white">42</div><div className="text-[9px] text-gray-500 uppercase">Images</div></div>
                    <div className="text-center"><div className="font-bold text-white">7</div><div className="text-[9px] text-gray-500 uppercase">Videos</div></div>
                    <div className="text-center"><div className="font-bold text-white">18 MB</div><div className="text-[9px] text-gray-500 uppercase">Total</div></div>
                  </div>
                  <div className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download All
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 px-3 py-1.5 rounded-md bg-[#0a0c12] border border-[#252936] text-xs text-gray-500">Filter by URL, domain, or filename...</div>
                <div className="flex gap-0.5 p-0.5 rounded-md bg-[#0a0c12] border border-[#252936]">
                  <span className="px-3 py-1 rounded bg-blue-600 text-white text-xs">All</span>
                  <span className="px-3 py-1 text-gray-500 text-xs">Images</span>
                  <span className="px-3 py-1 text-gray-500 text-xs">Videos</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { type: "image", color: "from-blue-600/30 to-blue-900/20", label: "hero.jpg" },
                  { type: "video", color: "from-red-600/30 to-red-900/20", label: "promo.mp4" },
                  { type: "image", color: "from-cyan-600/30 to-cyan-900/20", label: "banner.webp" },
                  { type: "image", color: "from-emerald-600/30 to-emerald-900/20", label: "logo.svg" },
                  { type: "image", color: "from-purple-600/30 to-purple-900/20", label: "bg.png" },
                  { type: "video", color: "from-red-600/30 to-red-900/20", label: "clip.webm" },
                  { type: "image", color: "from-amber-600/30 to-amber-900/20", label: "photo.jpg" },
                  { type: "image", color: "from-blue-600/30 to-blue-900/20", label: "icon.png" },
                ].map((item, i) => (
                  <div key={i} className="rounded-lg border border-[#252936] bg-[#1a1e2a] overflow-hidden hover:border-blue-500 transition-colors">
                    <div className={`h-20 bg-gradient-to-br ${item.color} flex items-center justify-center relative`}>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase absolute top-1.5 left-1.5 ${item.type === "image" ? "bg-blue-600/70 text-white" : "bg-red-600/70 text-white"}`}>
                        {item.type}
                      </span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-gray-600">
                        {item.type === "image" ? (
                          <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>
                        ) : (
                          <><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></>
                        )}
                      </svg>
                    </div>
                    <div className="px-2 py-1.5 text-[10px] text-gray-400 truncate">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="px-6 py-12 border-y border-[#252936]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: "All", label: "Image & Video formats" },
            { num: "1-Click", label: "Bulk download" },
            { num: "Real-time", label: "Network capture" },
            { num: "0", label: "Data sent to servers" },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-2xl md:text-3xl font-bold text-gradient">{stat.num}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Everything you need to
              <br />
              <span className="text-gradient">grab media fast</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Built directly into DevTools for a seamless developer workflow. Works in Chrome and Brave.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                ),
                title: "Smart Filtering",
                desc: "Search by URL, domain, or filename. Filter by type (images/videos) and minimum file size to find exactly what you need.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                ),
                title: "One-Click Download",
                desc: "Download individual files or grab everything at once with the Download All button. Files are saved with their original names.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                ),
                title: "Instant Preview",
                desc: "Click any captured item to see a full-size preview. Images and videos play right inside the panel before you download.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                ),
                title: "Real-time Capture",
                desc: "Automatically intercepts every network request as you browse. No refresh needed — media appears the moment it loads.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                ),
                title: "Auto-Download Mode",
                desc: "Toggle auto-download to automatically save every image and video as it's captured. Perfect for bulk harvesting sessions.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                ),
                title: "DevTools Native",
                desc: "Lives right inside DevTools as a dedicated panel in Chrome or Brave. Works alongside the Network tab with a familiar, polished interface.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl bg-[#11141d] border border-[#252936] hover:border-blue-500/50 transition-all hover:translate-y-[-4px]"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-6 py-24 bg-[#0d0f16] border-y border-[#252936]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Up and running in <span className="text-gradient">4 steps</span>
            </h2>
            <p className="text-gray-400 text-lg">No configuration needed — just install and go.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { num: "01", title: "Install the extension", desc: "Load the extension folder into your browser's extensions page in developer mode. Works in Chrome and Brave." },
              { num: "02", title: "Open DevTools", desc: "Press F12 or right-click and inspect. Find the MediaHarvest tab in the DevTools panel." },
              { num: "03", title: "Browse any website", desc: "Navigate to any site. As pages load, all images and videos from network requests are captured automatically." },
              { num: "04", title: "Filter & download", desc: "Use the search bar and type filters to find what you want. Click download for individual files or Download All." },
            ].map((step, i) => (
              <div key={i} className="flex gap-5 p-6 rounded-2xl bg-[#11141d] border border-[#252936]">
                <div className="text-3xl font-bold text-gradient flex-shrink-0">{step.num}</div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1.5">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Install */}
      <section id="install" className="px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
            Ready to install
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Get <span className="text-gradient">MediaHarvest</span> now
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Download the extension files and load them into Chrome or Brave. It takes less than a minute.
          </p>

          <div className="rounded-2xl bg-[#11141d] border border-[#252936] p-8 text-left max-w-xl mx-auto">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-blue-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Installation steps
            </h3>
            <ol className="space-y-3 text-sm text-gray-400">
              <li className="flex gap-3">
                <span className="text-blue-400 font-mono text-xs mt-0.5">1.</span>
                <span>Download the extension files from the <code className="px-1.5 py-0.5 rounded bg-[#0a0c12] text-blue-300 text-xs">/public/extension</code> folder in this project.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-mono text-xs mt-0.5">2.</span>
                <span>Open Chrome or Brave and go to <code className="px-1.5 py-0.5 rounded bg-[#0a0c12] text-blue-300 text-xs">chrome://extensions</code> (or <code className="px-1.5 py-0.5 rounded bg-[#0a0c12] text-blue-300 text-xs">brave://extensions</code>)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-mono text-xs mt-0.5">3.</span>
                <span>Enable <strong className="text-white">Developer mode</strong> in the top right corner.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-mono text-xs mt-0.5">4.</span>
                <span>Click <strong className="text-white">Load unpacked</strong> and select the extension folder.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-mono text-xs mt-0.5">5.</span>
                <span>Open DevTools (F12) — the <strong className="text-white">MediaHarvest</strong> tab will be there.</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-[#252936]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <span className="font-bold">MediaHarvest</span>
          </div>
          <p className="text-sm text-gray-500">A Chrome & Brave DevTools extension for capturing and downloading media. Works on Windows, Mac, and Linux.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
