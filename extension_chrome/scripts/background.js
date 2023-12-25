chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.webNavigation.onCompleted.addListener(function (details) {
  if (details.frameId === 0) {
    if (details.url.includes("bulletin.cebpubservice.com/biddingBulletin")) {
      chrome.tabs.sendMessage(details.tabId, {
        action: "GET_CONTENT",
        payload: details.tabId,
      });
    }
  }
});
