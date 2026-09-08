(function () {
  "use strict";

  // ===== State =====
  var mediaItems = [];
  var typeFilter = "all";
  var textFilter = "";
  var minSize = 0;
  var autoDownload = false;
  var isListening = false;

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
    try {
      return new URL(url).hostname;
    } catch (e) {
      return "";
    }
  }

  function formatSize(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    return (bytes / 1073741824).toFixed(2) + " GB";
  }

  function classifyMedia(url, mime) {
    var ext = getExtension(url);
    if (mime && mime.indexOf("image/") === 0) return "image";
    if (mime && mime.indexOf("video/") === 0) return "video";
    if (IMAGE_EXTS.indexOf(ext) >= 0) return "image";
    if (VIDEO_EXTS.indexOf(ext) >= 0) return "video";
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

  // ===== Network interception =====
  function onRequestFinished(request) {
    var url = null;
    try {
      url = request.request.url;
    } catch (e) {
      return;
    }

    if (!url || url.indexOf("data:") === 0 || url.indexOf("blob:") === 0) return;

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

    var type = classifyMedia(url, mime);
    if (!type) return;

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

    mediaItems.push(item);
    updateCounts();
    renderGrid();

    if (autoDownload) {
      downloadMedia(item);
    }
  }

  function attachNetworkListener() {
    try {
      if (chrome.devtools && chrome.devtools.network) {
        // Listen for requests going forward.
        chrome.devtools.network.onRequestFinished.addListener(onRequestFinished);

        // DevTools only loads this panel's page the first time the user
        // clicks its tab, so requests that already finished (e.g. all the
        // images a page loaded before MediaHarvest was opened) never reach
        // onRequestFinished. Backfill them from the Network panel's own
        // already-recorded HAR log.
        chrome.devtools.network.getHAR(function (harLog) {
          if (harLog && harLog.entries) {
            for (var i = 0; i < harLog.entries.length; i++) {
              onRequestFinished(harLog.entries[i]);
            }
          }
        });

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

  function downloadAllFiltered() {
    var items = getFilteredItems();
    for (var i = 0; i < items.length; i++) {
      (function (item, delay) {
        setTimeout(function () {
          downloadMedia(item);
        }, delay);
      })(items[i], i * 200);
    }
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
    mediaItems = [];
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
  attachNetworkListener();
  renderGrid();
})();
