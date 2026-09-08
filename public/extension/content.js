// Scans the page for inline base64 image data URIs — <img src="data:...">
// and CSS background-image data URIs. These never hit the network, so
// MediaHarvest's devtools.network listener can never see them; this is
// the only way to catch them, reported to the panel via runtime messages.
(function () {
  "use strict";

  if (window.__mediaHarvestContentInjected) return;
  window.__mediaHarvestContentInjected = true;

  var seen = Object.create(null);

  function report(url) {
    if (!url || seen[url]) return;
    var mimeMatch = /^data:([^;,]+)?/.exec(url);
    var mime = (mimeMatch && mimeMatch[1]) || "";
    if (mime.indexOf("image/") !== 0) return;
    seen[url] = true;

    var comma = url.indexOf(",");
    var size = comma >= 0 ? Math.floor((url.length - comma - 1) * 0.75) : 0;

    try {
      chrome.runtime.sendMessage({ action: "dataImage", url: url, mime: mime, size: size });
    } catch (e) {
      // extension context invalidated (e.g. reloaded) — ignore
    }
  }

  function scan(root) {
    var imgs = root.querySelectorAll("img[src^='data:']");
    for (var i = 0; i < imgs.length; i++) {
      report(imgs[i].currentSrc || imgs[i].src);
    }

    var withStyle = root.querySelectorAll("[style*='data:image']");
    for (var j = 0; j < withStyle.length; j++) {
      var bg = getComputedStyle(withStyle[j]).backgroundImage;
      var match = /url\((['"]?)(data:[^'")]+)\1\)/.exec(bg);
      if (match) report(match[2]);
    }
  }

  scan(document);

  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      if (m.type === "attributes" && m.target.tagName === "IMG") {
        report(m.target.currentSrc || m.target.src);
      } else if (m.addedNodes && m.addedNodes.length) {
        for (var n = 0; n < m.addedNodes.length; n++) {
          var node = m.addedNodes[n];
          if (node.nodeType !== 1) continue;
          if (node.tagName === "IMG") report(node.currentSrc || node.src);
          if (node.querySelectorAll) scan(node);
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src", "style"]
  });
})();
