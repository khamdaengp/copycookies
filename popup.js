document.addEventListener('DOMContentLoaded', () => {
    const statusDiv = document.getElementById('status');

    function showStatus(message, isError = false) {
        statusDiv.textContent = message;
        statusDiv.className = isError ? 'error' : 'success';
        statusDiv.style.display = 'block';
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }

    // Helper to get local/session storage from the active tab
    async function getStorageData(tabId) {
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                    return {
                        localStorage: { ...localStorage },
                        sessionStorage: { ...sessionStorage }
                    };
                }
            });
            return results[0].result;
        } catch (e) {
            console.warn("Could not read local/session storage", e);
            return { localStorage: {}, sessionStorage: {} };
        }
    }

    // Helper to inject local/session storage into the active tab
    async function setStorageData(tabId, lsData, ssData) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: (ls, ss) => {
                    for (const [key, value] of Object.entries(ls)) {
                        localStorage.setItem(key, value);
                    }
                    for (const [key, value] of Object.entries(ss)) {
                        sessionStorage.setItem(key, value);
                    }
                },
                args: [lsData, ssData]
            });
        } catch (e) {
            console.error("Could not set local/session storage", e);
        }
    }

    // 1. Copy to Clipboard
    document.getElementById('copyBtn').addEventListener('click', async () => {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.cookies.getAll({ "url": tab.url }, async (cookies) => {
            try {
                const storageData = await getStorageData(tab.id);
                const exportData = {
                    cookies: cookies,
                    localStorage: storageData.localStorage,
                    sessionStorage: storageData.sessionStorage
                };
                await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
                showStatus('Copied to clipboard!');
            } catch (err) {
                console.error("Failed to copy data: ", err);
                showStatus('Failed to copy.', true);
            }
        });
    });

    // 2. Export to File
    document.getElementById('exportBtn').addEventListener('click', async () => {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.cookies.getAll({ "url": tab.url }, async (cookies) => {
            try {
                const storageData = await getStorageData(tab.id);
                const exportData = {
                    cookies: cookies,
                    localStorage: storageData.localStorage,
                    sessionStorage: storageData.sessionStorage
                };

                const jsonStr = JSON.stringify(exportData, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                
                let domain = "site";
                try {
                    domain = new URL(tab.url).hostname;
                } catch(e) {}
                a.download = `data-${domain}.json`; // updated filename
                
                a.click();
                URL.revokeObjectURL(url);
                showStatus('Exported successfully!');
            } catch (err) {
                console.error("Failed to export: ", err);
                showStatus('Failed to export.', true);
            }
        });
    });

    // 3. Import from File
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        event.target.value = '';

        try {
            const text = await file.text();
            const parsedData = JSON.parse(text);

            let cookiesToImport = [];
            let lsToImport = {};
            let ssToImport = {};

            // Backward compatibility with older exports (Array of cookies)
            if (Array.isArray(parsedData)) {
                cookiesToImport = parsedData;
            } else if (typeof parsedData === 'object' && parsedData !== null) {
                cookiesToImport = parsedData.cookies || [];
                lsToImport = parsedData.localStorage || {};
                ssToImport = parsedData.sessionStorage || {};
            } else {
                throw new Error("Invalid format");
            }

            let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // 1. IMPORT COOKIES
            let importedCookiesCount = 0;
            const now = Date.now() / 1000;

            for (const cookie of cookiesToImport) {
                let url = (cookie.secure ? "https://" : "http://") + cookie.domain.replace(/^\./, '') + cookie.path;

                const cookieData = {
                    url: url,
                    name: cookie.name,
                    value: cookie.value,
                    path: cookie.path,
                    secure: cookie.secure,
                    httpOnly: cookie.httpOnly,
                    sameSite: cookie.sameSite
                };

                if (!cookie.hostOnly && cookie.domain) {
                    cookieData.domain = cookie.domain;
                }

                if (!cookie.session && cookie.expirationDate) {
                    let expiry = cookie.expirationDate;
                    if (expiry < now) {
                        expiry = now + (365 * 24 * 60 * 60);
                    }
                    cookieData.expirationDate = expiry;
                }

                await new Promise((resolve) => {
                    chrome.cookies.set(cookieData, (setCookie) => {
                        if (chrome.runtime.lastError) {
                            console.error(`Failed to set cookie: ${cookie.name}`, chrome.runtime.lastError);
                        } else {
                            importedCookiesCount++;
                        }
                        resolve();
                    });
                });
            }

            // 2. IMPORT STORAGE
            let storageMsg = "";
            const lsKeysCount = Object.keys(lsToImport).length;
            const ssKeysCount = Object.keys(ssToImport).length;

            if (lsKeysCount > 0 || ssKeysCount > 0) {
                await setStorageData(tab.id, lsToImport, ssToImport);
                storageMsg = ` (+ ${lsKeysCount} LS, ${ssKeysCount} SS)`;
            }

            // Let user know it succeeded
            showStatus(`Imported ${importedCookiesCount} cookies${storageMsg}!`);

            // Optionally, page may need to be reloaded so local storage takes effect
            // But we will leave that up to the user since reloading abruptly can be annoying.

        } catch (err) {
            console.error("Failed to import: ", err);
            showStatus('Failed to import. Invalid file.', true);
        }
    });
});
