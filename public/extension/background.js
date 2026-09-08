// Background service worker — handles downloads and relay logic.
// Works in Chrome, Brave, and across Windows, macOS, and Linux.

// Listen for download requests from the DevTools panel or popup
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "download") {
    var url = message.url;
    // Stash mime so sanitizeFilename can infer an extension if needed
    self._lastMime = message.mime || "";
    var filename = sanitizeFilename(message.filename || "media_" + Date.now());

    chrome.downloads.download(
      {
        url: url,
        filename: filename,
        saveAs: false,
        conflictAction: "uniquify"
      },
      function (downloadId) {
        if (chrome.runtime.lastError) {
          console.error("[MediaHarvest] Download error:", chrome.runtime.lastError.message);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true, downloadId: downloadId });
        }
      }
    );
    return true; // keep the message channel open for async response
  }

  if (message.action === "ping") {
    sendResponse({ success: true, browser: navigator.userAgent });
    return false;
  }
});

// Windows reserved device names — can't be used as filenames
var WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i;

// Known extensions so we can add one if the URL had none
var EXT_BY_MIME = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "image/bmp": ".bmp",
  "image/x-icon": ".ico",
  "image/avif": ".avif",
  "image/apng": ".apng",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/ogg": ".ogv",
  "video/quicktime": ".mov",
  "video/x-msvideo": ".avi",
  "video/x-matroska": ".mkv"
};

// Sanitize filenames for all OSes (Windows, macOS, Linux)
function sanitizeFilename(name) {
  // Decode if URL-encoded
  try {
    name = decodeURIComponent(name);
  } catch (e) {
    // already decoded or not encoded — use as-is
  }

  // Strip path separators and other illegal characters on any OS
  // Windows bans: \ / : * ? " < > |  and  control chars 0x00-0x1F
  var sanitized = name.replace(/[\\/:*?"<>|]/g, "_");
  sanitized = sanitized.replace(/[\x00-\x1f]/g, "");

  // Collapse multiple underscores
  sanitized = sanitized.replace(/_+/g, "_");

  // Remove leading/trailing dots and spaces (Windows strips them silently
  // and that can produce empty names or break extensions)
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, "");

  // Fallback if empty
  if (!sanitized) {
    sanitized = "media_" + Date.now();
  }

  // Windows reserved device names (CON, PRN, NUL, COM1-9, LPT1-9)
  if (WINDOWS_RESERVED.test(sanitized)) {
    sanitized = "media_" + sanitized;
  }

  // Ensure the name has an extension — Chrome's downloads API on Windows
  // can mis-handle extensionless files; infer from mime if available
  if (sanitized.lastIndexOf(".") <= 0) {
    var mime = (typeof self !== "undefined" && self._lastMime) || "";
    if (mime && EXT_BY_MIME[mime]) {
      sanitized += EXT_BY_MIME[mime];
    } else {
      // No mime info — add a generic extension so Windows is happy
      if (sanitized.lastIndexOf(".") < 0) {
        sanitized += ".bin";
      }
    }
  }

  // Limit total path length to avoid OS errors
  // Windows MAX_PATH is 260; leave room for download directory path
  if (sanitized.length > 180) {
    var dotIdx = sanitized.lastIndexOf(".");
    if (dotIdx > 0 && sanitized.length - dotIdx < 20) {
      var ext = sanitized.substring(dotIdx);
      sanitized = sanitized.substring(0, 180 - ext.length) + ext;
    } else {
      sanitized = sanitized.substring(0, 180);
    }
  }

  return sanitized;
}

// Keep service worker alive in Brave — it sometimes terminates earlier than Chrome
chrome.runtime.onInstalled.addListener(function (details) {
  console.log("[MediaHarvest] Extension installed/updated:", details.reason);
});
