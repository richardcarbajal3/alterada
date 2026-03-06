(() => {
  const APP_URL = "https://exploration-ai--ricardoxp3.replit.app/";
  
  let sidebar = null;
  let isOpen = false;

  function createSidebar() {
    if (sidebar) return sidebar;

    sidebar = document.createElement("div");
    sidebar.id = "cognitive-explorer-sidebar";
    sidebar.innerHTML = `
      <div class="ce-sidebar-header">
        <span class="ce-sidebar-title">Cognitive Explorer</span>
        <button class="ce-sidebar-close" id="ce-close-btn">&times;</button>
      </div>
      <iframe 
        id="ce-sidebar-iframe" 
        src="${APP_URL}" 
        allow="clipboard-read; clipboard-write"
      ></iframe>
      <div class="ce-sidebar-resize" id="ce-resize-handle"></div>
    `;

    document.body.appendChild(sidebar);

    document.getElementById("ce-close-btn").addEventListener("click", () => {
      toggleSidebar();
    });

    let isResizing = false;
    const resizeHandle = document.getElementById("ce-resize-handle");
    
    resizeHandle.addEventListener("mousedown", (e) => {
      isResizing = true;
      document.body.style.cursor = "ew-resize";
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 280 && newWidth <= 600) {
        sidebar.style.width = newWidth + "px";
      }
    });

    document.addEventListener("mouseup", () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = "";
        chrome.storage.local.set({ sidebarWidth: sidebar.style.width });
      }
    });

    chrome.storage.local.get(["sidebarWidth"], (result) => {
      if (result.sidebarWidth) {
        sidebar.style.width = result.sidebarWidth;
      }
    });

    return sidebar;
  }

  function toggleSidebar() {
    if (!sidebar) {
      createSidebar();
    }

    isOpen = !isOpen;
    sidebar.classList.toggle("ce-sidebar-open", isOpen);
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "toggleSidebar") {
      toggleSidebar();
    }
  });
})();
