const browserAPI = typeof browser !== "undefined" ? browser : chrome;

browserAPI.browserAction.onClicked.addListener((tab) => {
  browserAPI.tabs.sendMessage(tab.id, { action: "toggleSidebar" });
});
