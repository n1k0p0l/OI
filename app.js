/* global msal, marked, DOMPurify */

const CONFIG = {
    clientId: "0d2b8a4f-7cf8-4544-82a1-0096d711d4af",
    redirectUri: getDefaultRedirectUri(),
    authority: "https://login.microsoftonline.com/common",
    scopes: ["User.Read", "Files.Read"]
};

const msalInstance = new msal.PublicClientApplication({
    auth: {
        clientId: CONFIG.clientId,
        authority: CONFIG.authority,
        redirectUri: CONFIG.redirectUri
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: true
    }
});

const state = {
    account: null,
    currentFolderId: "root",
    currentFolderName: "Root",
    currentFolderWebUrl: "",
    folderStack: [{ id: "root", name: "Root", webUrl: "" }],
    msalInitialized: false,
    currentFolderItems: []
};

const ui = {
    status: document.getElementById("status"),
    browser: document.getElementById("browser"),
    viewer: document.getElementById("viewer"),
    folderList: document.getElementById("folder-list"),
    breadcrumb: document.getElementById("breadcrumb"),
    viewerTitle: document.getElementById("viewer-title"),
    viewerContent: document.getElementById("viewer-content"),
    viewerOpen: document.getElementById("viewer-open"),
    btnSignin: document.getElementById("btn-signin"),
    btnSignout: document.getElementById("btn-signout"),
    btnUseFolder: document.getElementById("btn-use-folder"),
    btnUseAnother: document.getElementById("btn-use-another")
};

ui.btnSignin.addEventListener("click", signIn);
ui.btnSignout.addEventListener("click", signOut);
ui.btnUseFolder.addEventListener("click", () => useCurrentFolder());
ui.btnUseAnother.addEventListener("click", () => useAnotherFolder());

window.addEventListener("hashchange", () => {
    const folderId = getFolderIdFromHash();
    if (folderId) {
        openFolderById(folderId);
    }
});

// Set daily Douglas Adams quote
setDailyQuote();

boot();

function setDailyQuote() {
    const quotes = [
        "Don't Panic.",
        "So long, and thanks for all the fish.",
        "Time is an illusion. Lunchtime doubly so.",
        "42",
        "I'd far rather be happy than right any day.",
        "Flying is learning how to throw yourself at the ground and miss.",
        "In the beginning the Universe was created. This has made a lot of people very angry."
    ];
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const quote = quotes[dayOfYear % quotes.length];
    const quoteElement = document.getElementById("quote-of-day");
    if (quoteElement) {
        quoteElement.textContent = `"${quote}" — Douglas Adams`;
    }
}

async function boot() {
    try {
        setStatus("Initializing...");
        await msalInstance.initialize();
        state.msalInitialized = true;
        setStatus("Checking session...");
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length) {
            state.account = accounts[0];
            setAuthUi(true);

            // Check if there's a previously saved folder with OI.md
            const savedFolderId = localStorage.getItem("oi.selectedFolderId");
            if (savedFolderId && !getFolderIdFromHash()) {
                // Auto-restore last selected folder
                await openFolderById(savedFolderId);
                await useCurrentFolder();
            } else {
                // Navigate based on hash or go to root
                await openFolderById(getFolderIdFromHash() || "root");
                showBrowser();
            }
        } else {
            setAuthUi(false);
            setStatus("Sign in to browse your OneDrive.");
        }
    } catch (err) {
        setStatus("Initialization failed. Check console for details.");
        console.error(err);
    }
}

function setAuthUi(isSignedIn) {
    ui.btnSignin.hidden = isSignedIn;
    ui.btnSignout.hidden = !isSignedIn;
}

async function signIn() {
    if (!state.msalInitialized) {
        setStatus("Still initializing, please wait...");
        return;
    }
    try {
        setStatus("Signing in...");
        const loginResponse = await msalInstance.loginPopup({
            scopes: CONFIG.scopes,
            prompt: "select_account"
        });
        state.account = loginResponse.account;
        setAuthUi(true);
        await openFolderById("root");
        showBrowser();
    } catch (err) {
        setStatus("Sign-in failed. Check your app registration.");
        console.error(err);
    }
}

function signOut() {
    if (!state.account) {
        return;
    }
    msalInstance.logoutPopup({
        account: state.account
    });
}

async function getToken() {
    if (!state.account) {
        throw new Error("No account");
    }
    try {
        const response = await msalInstance.acquireTokenSilent({
            scopes: CONFIG.scopes,
            account: state.account
        });
        return response.accessToken;
    } catch (err) {
        const response = await msalInstance.acquireTokenPopup({
            scopes: CONFIG.scopes
        });
        return response.accessToken;
    }
}

async function openFolderById(folderId) {
    if (!state.account) {
        return;
    }
    setStatus("Loading folder...");
    state.currentFolderId = folderId;
    const children = await listChildren(folderId);
    const current = await getFolderInfo(folderId);
    state.currentFolderName = current.name;
    state.currentFolderWebUrl = current.webUrl;
    updateBreadcrumb(folderId, current.name, current.webUrl);

    // Check if current folder has OI.md and show/hide "Use this folder" button
    const hasOiMd = findOiFile(children.value) !== undefined;
    ui.btnUseFolder.hidden = !hasOiMd;

    renderFolderList(children);
    showBrowser();

    if (hasOiMd) {
        setStatus("This folder has OI.md. Click 'Use this folder' to view it.");
    } else {
        setStatus("Navigate to a folder containing OI.md.");
    }
}

async function listChildren(folderId) {
    const token = await getToken();
    const url = folderId === "root"
        ? "https://graph.microsoft.com/v1.0/me/drive/root/children"
        : `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`;
    return fetchJson(url, token);
}

async function getFolderInfo(folderId) {
    if (folderId === "root") {
        return { id: "root", name: "Root", webUrl: "" };
    }
    const token = await getToken();
    const url = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}`;
    const data = await fetchJson(url, token);
    return { id: data.id, name: data.name, webUrl: data.webUrl || "" };
}

function renderFolderList(items) {
    ui.folderList.innerHTML = "";
    const folders = items.value.filter((item) => item.folder);
    const files = items.value.filter((item) => item.file);

    if (!folders.length && !files.length) {
        ui.folderList.innerHTML = "<div>No items in this folder.</div>";
        return;
    }

    folders.forEach((folder) => {
        const row = document.createElement("div");
        row.className = "folder-item";
        row.innerHTML = `
      <div>
        <strong>${escapeHtml(folder.name)}</strong>
        <div class="meta">Folder</div>
      </div>
      <div>
        <button class="btn" data-folder-id="${folder.id}">Open</button>
      </div>
    `;
        row.querySelector("button").addEventListener("click", () => {
            setHashFolder(folder.id);
            openFolderById(folder.id);
        });
        ui.folderList.appendChild(row);
    });

    files.forEach((file) => {
        const row = document.createElement("div");
        row.className = "folder-item";
        const webUrl = file.webUrl || "#";
        row.innerHTML = `
      <div>
        <strong>${escapeHtml(file.name)}</strong>
        <div class="meta">File</div>
      </div>
      <div>
        <a class="btn" href="${webUrl}" target="_blank" rel="noopener">Open</a>
      </div>
    `;
        ui.folderList.appendChild(row);
    });
}

async function useCurrentFolder() {
    const children = await listChildren(state.currentFolderId);
    const oiItem = findOiFile(children.value);
    if (!oiItem) {
        setStatus("No OI.md in this folder. Pick another folder.");
        return;
    }
    localStorage.setItem("oi.selectedFolderId", state.currentFolderId);
    await renderOiMarkdown(oiItem, children.value);
}

async function renderOiMarkdown(oiItem, itemsInFolder) {
    setStatus("Loading OI.md...");
    const markdown = await fetchFileContent(oiItem.id);
    const linkMap = buildLinkMap(itemsInFolder);
    const withLinks = rewriteRelativeLinks(markdown, linkMap);
    const html = marked.parse(withLinks, { mangle: false, headerIds: false });
    ui.viewerContent.innerHTML = DOMPurify.sanitize(html);
    ui.viewerTitle.textContent = oiItem.name;
    ui.viewerOpen.href = oiItem.webUrl || "#";

    // Store current items for folder navigation
    state.currentFolderItems = itemsInFolder;

    // Add click handlers to intercept folder links
    addFolderLinkHandlers();

    showViewer();
    setStatus("Rendered OI.md");
}

function findOiFile(items) {
    return items.find((item) => item.name && item.name.toLowerCase() === "oi.md");
}

async function fetchFileContent(itemId) {
    const token = await getToken();
    const url = `https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/content`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
        throw new Error("Failed to download OI.md");
    }
    return res.text();
}

function buildLinkMap(items) {
    const map = new Map();
    items.forEach((item) => {
        if (item.name) {
            // Store with and without trailing slash for flexible matching
            const baseName = item.name;
            map.set(baseName, item);
            map.set(baseName + "/", item);
            // Also store URL-encoded versions
            map.set(encodeURIComponent(baseName), item);
            map.set(encodeURIComponent(baseName) + "/", item);
        }
    });
    return map;
}

function rewriteRelativeLinks(markdown, linkMap) {
    const regex = /(!?\[[^\]]*\]\(([^)]+)\))/g;
    return markdown.replace(regex, (match, full, url) => {
        const clean = url.trim();
        if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("#")) {
            return match;
        }
        const normalized = clean.replace(/^\.\//, "");
        const item = linkMap.get(normalized);
        if (!item) {
            return match;
        }
        
        // For folders, use a special marker that we can detect later
        if (item.folder) {
            // Return link with data attribute marker
            return full.replace(url, `#folder:${item.id}`);
        } else {
            // For files, use webUrl
            return full.replace(url, item.webUrl || url);
        }
    });
}

function addFolderLinkHandlers() {
    // Find all links in the viewer content
    const links = ui.viewerContent.querySelectorAll("a");

    links.forEach((link) => {
        const href = link.getAttribute("href");
        if (!href) return;
        
        // Check if this is a folder link (marked with #folder:ID)
        if (href.startsWith("#folder:")) {
            const folderId = href.replace("#folder:", "");
            
            link.addEventListener("click", async (e) => {
                e.preventDefault();
                // Navigate to this folder within the app
                setHashFolder(folderId);
                await openFolderById(folderId);
            });
        }
    });
}

function updateBreadcrumb(folderId, name, webUrl) {
    if (folderId === "root") {
        state.folderStack = [{ id: "root", name: "Root", webUrl: "" }];
    } else {
        const existingIndex = state.folderStack.findIndex((item) => item.id === folderId);
        if (existingIndex >= 0) {
            state.folderStack = state.folderStack.slice(0, existingIndex + 1);
        } else {
            state.folderStack.push({ id: folderId, name, webUrl });
        }
    }

    ui.breadcrumb.innerHTML = "";
    state.folderStack.forEach((item, index) => {
        if (index > 0) {
            const sep = document.createElement("span");
            sep.textContent = "/";
            ui.breadcrumb.appendChild(sep);
        }
        const btn = document.createElement("button");
        btn.textContent = item.name;
        btn.addEventListener("click", () => {
            setHashFolder(item.id);
            openFolderById(item.id);
        });
        ui.breadcrumb.appendChild(btn);
    });
}

function setHashFolder(folderId) {
    if (folderId === "root") {
        window.location.hash = "#/root";
        return;
    }
    window.location.hash = `#/folder/${folderId}`;
}

function getFolderIdFromHash() {
    const hash = window.location.hash || "";
    if (hash === "#/root") {
        return "root";
    }
    if (hash.startsWith("#/folder/")) {
        return hash.replace("#/folder/", "");
    }
    return null;
}

function showBrowser() {
    ui.viewer.hidden = true;
    ui.browser.hidden = false;
}

function showViewer() {
    ui.browser.hidden = true;
    ui.viewer.hidden = false;
}

function useAnotherFolder() {
    // Clear saved folder and go back to root
    localStorage.removeItem("oi.selectedFolderId");
    setHashFolder("root");
    openFolderById("root");
}

function setStatus(message) {
    ui.status.textContent = message;
}

async function fetchJson(url, token) {
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
        throw new Error("Graph request failed");
    }
    return res.json();
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getDefaultRedirectUri() {
    const path = window.location.pathname;
    if (path.endsWith("/OI/") || path.endsWith("/OI/index.html")) {
        return window.location.origin + "/OI/";
    }
    return window.location.origin + path.replace(/index\.html$/, "");
}
