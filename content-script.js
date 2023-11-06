const REMOVE_DOMAIN = "df-pub.alibaba-inc.com";

async function removeCookies(domain = REMOVE_DOMAIN) {
  // Send message to SW
  const response = await chrome.runtime.sendMessage({
    event: "removeCookies",
    domain,
  });
  console.log("removeCookie res", response);
  return response;
}

function parseTarget() {
  const url = location.href;
  const params = new URLSearchParams(url);
  if (!params) {
    console.warn("当前 tab url 获取失败", { url, tabs });
    return null;
  }
  const target = params.get("param");
  return target;
}

function jumpPage(target) {
  return new Promise((resolve) => {
    location.href = target;

    setTimeout(() => {
      resolve();
    }, 3000);
  });
}

function isPageJumped(domain = REMOVE_DOMAIN) {
  return location.href.indexOf(domain) === -1;
}

/**
 * reload page every 3s and check if it works
 * @param {*} target
 * @param {*} domain
 * @param {*} retryTime
 */
async function removeAndReload(target, retryTime = 3) {
  while (retryTime--) {
    // jump success
    if (isPageJumped()) {
      break;
    }
    console.log("尝试清除并刷新，剩余次数", retryTime);
    await removeCookies();
    await jumpPage(target);
  }
}

async function main() {
  // 1. parse target url
  const target = parseTarget();
  if (!target) {
    console.warn("no target page found ", { target });
    return;
  }
  // 2. remove cookies and reload
  removeAndReload(target);
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log(
    sender.tab
      ? "from a content script:" + sender.tab.url
      : "from the extension"
  );
  if (request.event === "reload") {
    if (isPageJumped()) {
      sendResponse({
        status: "done",
      });
    } else {
      main();
      sendResponse({
        status: "processing",
      });
    }
  }
});
