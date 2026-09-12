// Reads the version straight from the manifest so this never drifts out of
// sync with the actual installed version again (it was hardcoded as "v1.0").
document.getElementById("version").textContent = "v" + chrome.runtime.getManifest().version;
