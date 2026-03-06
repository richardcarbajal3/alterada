document.getElementById('openSidebar').addEventListener('click', async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  browser.tabs.sendMessage(tab.id, { action: "toggleSidebar" });
  window.close();
});
