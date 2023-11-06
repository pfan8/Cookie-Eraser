// A generic onclick callback function.
chrome.contextMenus.onClicked.addListener(genericOnClick);

// A generic onclick callback function.
function genericOnClick(info, tab) {
  switch (info.menuItemId) {
    case "reload":
      // Radio item function
      console.log("reload item clicked. Status:", { info, tab });
      chrome.tabs.sendMessage(tab.id, { event: "reload" });
      break;
    default:
      // Standard context menu item function
      console.log("Standard context menu item clicked.");
  }
}
chrome.runtime.onInstalled.addListener(function () {
  // Create one test item for each context type.
  // let contexts = [
  //   "page",
  //   "selection",
  //   "link",
  //   "editable",
  //   "image",
  //   "video",
  //   "audio",
  // ];
  // for (let i = 0; i < contexts.length; i++) {
  //   let context = contexts[i];
  //   let title = "Test '" + context + "' menu item";
  //   chrome.contextMenus.create({
  //     title: title,
  //     contexts: [context],
  //     id: context,
  //   });
  // }

  chrome.contextMenus.create({
    title: "清除 Cookie 并刷新",
    id: "reload",
  });
});

chrome.tabs.onRemoved.addListener(function (tabId, info) {
  chrome.cookies.getAll(
    {
      domain: "df-pub.alibaba-inc.com",
    },
    (cookies) => {
      console.log("df-pub cookies", cookies);
      cookies.forEach(({ domain, name }) => {
        chrome.cookies.remove({ url: `https://${domain}`, name }, (res) => {
          console.log("cookie remove result", res);
        });
      });
    }
  );
});

const REMOVE_DOMAIN = "df-pub.alibaba-inc.com";
async function removeCookies(domain = REMOVE_DOMAIN) {
  return new Promise((resolve) => {
    chrome.cookies.getAll(
      {
        domain,
      },
      (cookies) => {
        console.log("df-pub cookies", cookies);
        cookies.forEach(({ domain, name }) => {
          chrome.cookies.remove({ url: `https://${domain}`, name }, (res) => {
            console.log("cookie remove result", res);
          });
        });
        // trick to wait all cookies removed
        setTimeout(() => {
          resolve();
        });
      }
    );
  });
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log(
    sender.tab
      ? "from a content script:" + sender.tab.url
      : "from the extension"
  );
  if (request.event === "removeCookies") {
    removeCookies().then(() => {
      sendResponse("remove cookies done!");
    });
  }
});
