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

function parseTarget() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const { url, id: tabId } = tabs[0];
      const ret = { tabId, target: null };
      const params = new URLSearchParams(url);
      if (!params) {
        console.warn("当前 tab url 获取失败", { url, tabs });
        resolve(ret);
      }
      const target = params.get("param");
      if (target) {
        const infoNode = document.getElementById("target-url");
        infoNode.innerText = target;
      }
      ret.target = target;
      resolve(ret);
    });
  });
}

function jumpPage(target) {
  return new Promise((resolve) => {
    location.href = target;

    setTimeout(() => {
      resolve();
    }, 3000);
  });
}

/**
 * reload page every 3s and check if it works
 * @param {*} target
 * @param {*} domain
 * @param {*} retryTime
 */
async function removeAndReload(target, domain = REMOVE_DOMAIN, retryTime = 3) {
  while (retryTime--) {
    // jump success
    if (location.href.indexOf(domain) === -1) {
      break;
    }
    await removeCookies();
    await jumpPage(target);
  }
}

const button = document.querySelector("button");
button.addEventListener("click", async () => {
  // 1. parse target url
  const { target, tabId } = await parseTarget();
  if (!target) {
    console.warn("no target page found ", { target, tabId });
    return;
  }
  // 2. remove cookies and reload
  chrome.scripting.executeScript(
    {
      target: { tabId },
      func: removeAndReload.bind(null, target),
    },
    (res) => console.log(res)
  );
});
