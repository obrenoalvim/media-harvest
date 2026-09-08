(function () {
  "use strict";

  // ===== State =====
  var mediaItems = [];
  var itemsByUrl = Object.create(null); // dedupe: one card per URL
  var dismissedHashes = new Set(); // urls cleared by the user — never re-add these
  var DISMISSED_STORAGE_KEY = "mediaharvest_dismissed";
  var DISMISSED_MAX = 5000; // ponytail: FIFO cap so this can't grow forever across a long session
  var typeFilter = "all";
  var textFilter = "";
  var minSize = 0;
  var autoDownload = false;
  var isListening = false;
  var resyncTimer = null;

  // ===== DOM refs =====
  var grid = document.getElementById("media-grid");
  var emptyState = document.getElementById("empty-state");
  var filterInput = document.getElementById("filter-input");
  var imgCount = document.getElementById("img-count");
  var vidCount = document.getElementById("vid-count");
  var totalSize = document.getElementById("total-size");
  var btnClear = document.getElementById("btn-clear");
  var btnDownloadAll = document.getElementById("btn-download-all");
  var minSizeSelect = document.getElementById("min-size-select");
  var autoDownloadToggle = document.getElementById("auto-download-toggle");
  var statusBadge = document.getElementById("status-badge");
  var previewModal = document.getElementById("preview-modal");
  var modalTitle = document.getElementById("modal-title");
  var modalBody = document.getElementById("modal-body");
  var modalUrl = document.getElementById("modal-url");
  var modalDownload = document.getElementById("modal-download");
  var modalClose = document.getElementById("modal-close");
  var currentPreviewItem = null;

  // ===== Constants =====
  var IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "avif", "apng"];
  var VIDEO_EXTS = ["mp4", "webm", "ogg", "ogv", "mov", "m4v", "mkv", "avi", "m3u8", "ts"];

  // ===== Utilities =====
  function getExtension(url) {
    try {
      var u = new URL(url);
      var path = u.pathname;
      var dot = path.lastIndexOf(".");
      if (dot < 0) return "";
      return path.substring(dot + 1).toLowerCase().split("?")[0];
    } catch (e) {
      return "";
    }
  }

  function getFileName(url) {
    if (url.indexOf("data:") === 0) return "inline_image_" + (mediaItems.length + 1);
    try {
      var u = new URL(url);
      var name = u.pathname.split("/").pop();
      if (!name) name = "media_" + Date.now();
      return decodeURIComponent(name);
    } catch (e) {
      return "media_" + Date.now();
    }
  }

  function getDomain(url) {
    if (url.indexOf("data:") === 0) return "inline (data URI)";
    try {
      return new URL(url).hostname;
    } catch (e) {
      return "";
    }
  }

  // Chrome-specific extension field on HAR entries — a reliable fallback
  // when the response has no usable mime type or file extension (e.g.
  // an API endpoint serving an image from an extensionless URL).
  function getResourceType(request) {
    try {
      return (request._resourceType || "").toLowerCase();
    } catch (e) {
      return "";
    }
  }

  function dataUriMime(url) {
    var m = /^data:([^;,]+)?/.exec(url);
    return (m && m[1]) || "";
  }

  // Short, fixed-size id for a url — used for the dismissed-list so a
  // handful of huge base64 data: URIs don't blow past chrome.storage's quota.
  function hashUrl(url) {
    var h = 0x811c9dc5;
    for (var i = 0; i < url.length; i++) {
      h ^= url.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return h.toString(36);
  }

  function persistDismissed() {
    try {
      if (!chrome.storage || !chrome.storage.local) return;
      var list = Array.from(dismissedHashes).slice(-DISMISSED_MAX);
      var toStore = {};
      toStore[DISMISSED_STORAGE_KEY] = list;
      chrome.storage.local.set(toStore);
    } catch (e) {}
  }

  function estimateDataUriSize(url) {
    var comma = url.indexOf(",");
    return comma >= 0 ? Math.floor((url.length - comma - 1) * 0.75) : 0;
  }

  function formatSize(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    return (bytes / 1073741824).toFixed(2) + " GB";
  }

  function classifyMedia(url, mime, resourceType) {
    var ext = getExtension(url);
    if (mime && mime.indexOf("image/") === 0) return "image";
    if (mime && mime.indexOf("video/") === 0) return "video";
    if (IMAGE_EXTS.indexOf(ext) >= 0) return "image";
    if (VIDEO_EXTS.indexOf(ext) >= 0) return "video";
    if (resourceType === "image") return "image";
    if (resourceType === "media") return "video";
    return null;
  }

  function escapeHtml(s) {
    if (!s) return "";
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function escapeAttr(s) {
    if (!s) return "";
    return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;");
  }

  // ===== Capture (shared by network requests and inline data-URI images) =====
  function registerItem(url, mime, size, resourceType) {
    if (!url) return;
    if (dismissedHashes.has(hashUrl(url))) return; // user cleared this one — stay gone

    var type = classifyMedia(url, mime, resourceType);
    if (!type) return;

    // One card per URL. A later sighting of the same URL (e.g. picked up
    // again by both the live listener and a HAR resync) just tops up the
    // size/mime instead of piling up duplicate cards.
    var existing = itemsByUrl[url];
    if (existing) {
      if (size && !existing.size) existing.size = size;
      if (mime && !existing.mime) existing.mime = mime;
      return;
    }

    var item = {
      id: url + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      url: url,
      type: type,
      mime: mime,
      size: size,
      domain: getDomain(url),
      name: getFileName(url),
      timestamp: Date.now()
    };

    itemsByUrl[url] = item;
    mediaItems.push(item);
    updateCounts();
    renderGrid();

    if (autoDownload) {
      downloadMedia(item);
    }
  }

  // ===== Network interception =====
  function onRequestFinished(request) {
    var url = null;
    try {
      url = request.request.url;
    } catch (e) {
      return;
    }

    // blob: object URLs only resolve inside the page's own JS realm — the
    // extension can't fetch their bytes, so they're out of scope.
    // data: URIs (inline base64 images) ARE kept: Chrome's Network domain
    // does emit a request-finished-style entry for <img src="data:...">
    // loads, and skipping them here was dropping every one of those images.
    if (!url || url.indexOf("blob:") === 0) return;

    var mime = "";
    var size = 0;
    try {
      if (request.response && request.response.content) {
        mime = request.response.content.mimeType || "";
        size = request.response.content.size || 0;
      }
    } catch (e) {
      // some requests may not have response content yet
    }

    // Also check the response headers for content-type if mime is empty
    if (!mime) {
      try {
        if (request.response && request.response.headers) {
          for (var h = 0; h < request.response.headers.length; h++) {
            if (request.response.headers[h].name.toLowerCase() === "content-type") {
              mime = request.response.headers[h].value;
              break;
            }
          }
        }
      } catch (e) {}
    }

    // data: entries often carry no response/content metadata at all — the
    // mime type is right there in the URL prefix, so read it from there.
    if (!mime && url.indexOf("data:") === 0) {
      mime = dataUriMime(url);
      if (!size) size = estimateDataUriSize(url);
    }

    registerItem(url, mime, size, getResourceType(request));
  }

  // Re-pull the DevTools Network panel's HAR log and merge it in. This is
  // the safety net for requests the live onRequestFinished listener drops —
  // a known Chrome quirk (worse on hard reloads) — and for anything that
  // finished while this panel's page hadn't been opened/focused yet, so
  // capture keeps working across reloads and SPA navigations instead of
  // only ever seeing the first batch.
  function resyncFromHAR() {
    try {
      chrome.devtools.network.getHAR(function (harLog) {
        if (harLog && harLog.entries) {
          for (var i = 0; i < harLog.entries.length; i++) {
            onRequestFinished(harLog.entries[i]);
          }
        }
      });
    } catch (e) {}
  }

  function attachNetworkListener() {
    try {
      if (chrome.devtools && chrome.devtools.network) {
        // Listen for requests going forward.
        chrome.devtools.network.onRequestFinished.addListener(onRequestFinished);

        // DevTools only loads this panel's page the first time the user
        // clicks its tab, so requests that already finished (e.g. all the
        // images a page loaded before MediaHarvest was opened) never reach
        // onRequestFinished. Backfill them immediately, then keep
        // resyncing periodically as a safety net (see resyncFromHAR).
        resyncFromHAR();
        resyncTimer = setInterval(resyncFromHAR, 2500);

        isListening = true;
        statusBadge.textContent = "Listening";
        statusBadge.classList.remove("paused");
      } else {
        statusBadge.textContent = "No Network API";
        statusBadge.classList.add("paused");
      }
    } catch (e) {
      statusBadge.textContent = "Error";
      statusBadge.classList.add("paused");
    }
  }

  // ===== Inline data-URI images (never hit the network, so the listener
  // above can never see them — reported by content.js instead) =====
  function attachDataUriListener() {
    if (!chrome.runtime || !chrome.runtime.onMessage) return;
    chrome.runtime.onMessage.addListener(function (message, sender) {
      if (!message || message.action !== "dataImage") return;
      if (!sender.tab || sender.tab.id !== chrome.devtools.inspectedWindow.tabId) return;
      registerItem(message.url, message.mime, message.size, "image");
    });
  }

  // ===== Rendering =====
  function getFilteredItems() {
    return mediaItems.filter(function (item) {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (minSize > 0 && item.size < minSize) return false;
      if (textFilter) {
        var q = textFilter.toLowerCase();
        if (item.url.toLowerCase().indexOf(q) < 0 &&
            item.domain.toLowerCase().indexOf(q) < 0 &&
            item.name.toLowerCase().indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function updateCounts() {
    var imgs = 0, vids = 0, total = 0;
    for (var i = 0; i < mediaItems.length; i++) {
      if (mediaItems[i].type === "image") imgs++;
      else vids++;
      total += mediaItems[i].size || 0;
    }
    imgCount.textContent = imgs;
    vidCount.textContent = vids;
    totalSize.textContent = formatSize(total);
  }

  function createCard(item) {
    var card = document.createElement("div");
    card.className = "media-card";
    card.setAttribute("data-id", item.id);

    // Thumbnail
    var thumb = document.createElement("div");
    thumb.className = "media-thumb";

    var badge = document.createElement("span");
    badge.className = "media-type-badge " + item.type;
    badge.textContent = item.type;
    thumb.appendChild(badge);

    if (item.type === "image") {
      var img = document.createElement("img");
      img.loading = "lazy";
      img.src = item.url;
      img.alt = item.name;
      // Handle load errors without inline handlers (Brave CSP-safe)
      img.addEventListener("error", function () {
        img.style.display = "none";
        if (placeholder) placeholder.style.display = "flex";
      });
      thumb.appendChild(img);

      var placeholder = document.createElement("div");
      placeholder.className = "placeholder";
      placeholder.style.display = "none";
      placeholder.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
      thumb.appendChild(placeholder);
    } else {
      var ph = document.createElement("div");
      ph.className = "placeholder";
      ph.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>';
      thumb.appendChild(ph);
    }

    card.appendChild(thumb);

    // Info
    var info = document.createElement("div");
    info.className = "media-info";

    var nameDiv = document.createElement("div");
    nameDiv.className = "media-name";
    nameDiv.setAttribute("title", item.name);
    nameDiv.textContent = item.name;
    info.appendChild(nameDiv);

    var meta = document.createElement("div");
    meta.className = "media-meta";
    meta.innerHTML =
      '<span></span><span class="dot"></span><span></span>';
    meta.children[0].textContent = item.domain;
    meta.children[2].textContent = formatSize(item.size);
    info.appendChild(meta);

    card.appendChild(info);

    // Actions (hover overlay)
    var actions = document.createElement("div");
    actions.className = "media-actions";

    var btnPreview = document.createElement("button");
    btnPreview.className = "action-btn btn-preview";
    btnPreview.setAttribute("title", "Preview");
    btnPreview.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    actions.appendChild(btnPreview);

    var btnDownload = document.createElement("button");
    btnDownload.className = "action-btn btn-download";
    btnDownload.setAttribute("title", "Download");
    btnDownload.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
    actions.appendChild(btnDownload);

    card.appendChild(actions);

    // Card click — all events via addEventListener, no inline handlers
    card.addEventListener("click", function (e) {
      if (e.target.closest(".btn-download")) {
        e.stopPropagation();
        downloadMedia(item);
      } else if (e.target.closest(".btn-preview")) {
        e.stopPropagation();
        openPreview(item);
      } else {
        openPreview(item);
      }
    });

    return card;
  }

  function renderGrid() {
    var items = getFilteredItems();

    // Clear grid
    while (grid.firstChild) {
      grid.removeChild(grid.firstChild);
    }

    if (items.length === 0) {
      grid.appendChild(emptyState);
      emptyState.style.display = "flex";
      return;
    }

    emptyState.style.display = "none";

    var fragment = document.createDocumentFragment();
    for (var i = 0; i < items.length; i++) {
      fragment.appendChild(createCard(items[i]));
    }
    grid.appendChild(fragment);
  }

  // ===== Preview Modal =====
  function openPreview(item) {
    currentPreviewItem = item;
    modalTitle.textContent = item.name;
    modalUrl.textContent = item.url;

    // Clear previous content
    while (modalBody.firstChild) {
      modalBody.removeChild(modalBody.firstChild);
    }

    if (item.type === "image") {
      var img = document.createElement("img");
      img.src = item.url;
      img.alt = item.name;
      modalBody.appendChild(img);
    } else {
      var video = document.createElement("video");
      video.src = item.url;
      video.controls = true;
      video.autoplay = true;
      modalBody.appendChild(video);
    }

    previewModal.classList.add("active");
  }

  function closePreview() {
    previewModal.classList.remove("active");
    // Stop video playback
    var videos = modalBody.querySelectorAll("video");
    for (var i = 0; i < videos.length; i++) {
      videos[i].pause();
      videos[i].src = "";
    }
    while (modalBody.firstChild) {
      modalBody.removeChild(modalBody.firstChild);
    }
    currentPreviewItem = null;
  }

  // ===== Download =====
  function downloadMedia(item) {
    var filename = item.name || "media_" + Date.now();
    try {
      chrome.runtime.sendMessage(
        {
          action: "download",
          url: item.url,
          filename: filename,
          mime: item.mime || ""
        },
        function (response) {
          if (chrome.runtime.lastError) {
            console.error("[MediaHarvest] sendMessage error:", chrome.runtime.lastError.message);
          }
        }
      );
    } catch (e) {
      console.error("[MediaHarvest] Download failed:", e);
    }
  }

  function downloadIndividually(items) {
    for (var i = 0; i < items.length; i++) {
      (function (item, delay) {
        setTimeout(function () {
          downloadMedia(item);
        }, delay);
      })(items[i], i * 200);
    }
  }

  function uniqueZipName(usedNames, name) {
    name = name || "media_" + Date.now();
    if (!usedNames[name]) {
      usedNames[name] = 1;
      return name;
    }
    var n = ++usedNames[name];
    var dot = name.lastIndexOf(".");
    return dot > 0 ? name.slice(0, dot) + "_" + n + name.slice(dot) : name + "_" + n;
  }

  // One file per click means one confirmation dialog / disk write per item —
  // painful once there are more than a handful. Bundle everything into a
  // single zip instead, so "Download All" is really one download.
  function downloadAllFiltered() {
    var items = getFilteredItems();
    if (!items.length) return;

    if (typeof JSZip === "undefined") {
      downloadIndividually(items); // vendor/jszip.min.js failed to load — fall back
      return;
    }

    var originalLabel = btnDownloadAll.innerHTML;
    btnDownloadAll.disabled = true;
    btnDownloadAll.textContent = "Zipping " + items.length + "...";

    var zip = new JSZip();
    var usedNames = Object.create(null);

    Promise.all(
      items.map(function (item) {
        return fetch(item.url)
          .then(function (res) { return res.blob(); })
          .then(function (blob) {
            zip.file(uniqueZipName(usedNames, item.name), blob);
          })
          .catch(function (e) {
            console.error("[MediaHarvest] zip: failed to fetch", item.url, e);
          });
      })
    )
      .then(function () {
        return zip.generateAsync({ type: "blob" });
      })
      .then(function (zipBlob) {
        var zipUrl = URL.createObjectURL(zipBlob);
        chrome.downloads.download(
          {
            url: zipUrl,
            filename: "mediaharvest_" + Date.now() + ".zip",
            saveAs: false,
            conflictAction: "uniquify"
          },
          function () {
            // give the download a moment to pick up the blob before releasing it
            setTimeout(function () { URL.revokeObjectURL(zipUrl); }, 60000);
          }
        );
      })
      .catch(function (e) {
        console.error("[MediaHarvest] zip build failed, falling back to individual downloads:", e);
        downloadIndividually(items);
      })
      .then(function () {
        btnDownloadAll.disabled = false;
        btnDownloadAll.innerHTML = originalLabel;
      });
  }

  // ===== Event handlers (all via addEventListener — CSP-safe for Brave) =====
  filterInput.addEventListener("input", function () {
    textFilter = filterInput.value.trim();
    renderGrid();
  });

  var tabs = document.querySelectorAll(".tab");
  for (var t = 0; t < tabs.length; t++) {
    tabs[t].addEventListener("click", function () {
      for (var j = 0; j < tabs.length; j++) {
        tabs[j].classList.remove("active");
      }
      this.classList.add("active");
      typeFilter = this.getAttribute("data-filter");
      renderGrid();
    });
  }

  minSizeSelect.addEventListener("change", function () {
    minSize = parseInt(minSizeSelect.value, 10) || 0;
    renderGrid();
  });

  autoDownloadToggle.addEventListener("change", function () {
    autoDownload = autoDownloadToggle.checked;
  });

  btnClear.addEventListener("click", function () {
    // Remember what was cleared so the next HAR resync (it still has these
    // in its log) doesn't just bring them straight back.
    for (var i = 0; i < mediaItems.length; i++) {
      dismissedHashes.add(hashUrl(mediaItems[i].url));
    }
    persistDismissed();
    mediaItems = [];
    itemsByUrl = Object.create(null);
    updateCounts();
    renderGrid();
  });

  btnDownloadAll.addEventListener("click", downloadAllFiltered);

  modalClose.addEventListener("click", closePreview);
  previewModal.addEventListener("click", function (e) {
    if (e.target === previewModal) closePreview();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closePreview();
  });

  modalDownload.addEventListener("click", function () {
    if (currentPreviewItem) downloadMedia(currentPreviewItem);
  });

  // ===== Init =====
  // Load the dismissed list first — otherwise the initial HAR backfill can
  // race ahead and re-add something the user already cleared last session.
  function startCapture() {
    attachNetworkListener();
    attachDataUriListener();
  }

  try {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(DISMISSED_STORAGE_KEY, function (result) {
        var stored = (result && result[DISMISSED_STORAGE_KEY]) || [];
        for (var i = 0; i < stored.length; i++) dismissedHashes.add(stored[i]);
        startCapture();
      });
    } else {
      startCapture();
    }
  } catch (e) {
    startCapture();
  }

  renderGrid();
})();
