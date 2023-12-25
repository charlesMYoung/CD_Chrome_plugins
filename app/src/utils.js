/**
 *  Send message to content script
 * @param {*} action
 * @param {*} payload
 * @returns
 */
export const sendMessage = async (action, payload) => {
  let [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tab.id,
      {
        action,
        payload,
      },
      (resp) => {
        console.log("resp", resp);
        resolve(resp);
      }
    );
  });
};

export const sleep = (timeout) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
};

export const coverMap = (respData, storageMaps = {}) => {
  respData.forEach((item) => {
    storageMaps[item[0]] = {
      originalLink: item[0],
      bidName: item[1],
      industry: item[2],
      sourceChannel: item[3],
      releaseTime: item[4],
      leftBidOpenTime: item[5],
      content: "",
    };
  });
  return storageMaps;
};

export const onMessageByGetContent = (callback) => {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { action, payload } = request;
    switch (action) {
      case "GET_CONTENT_DONE":
        console.log("GET_CONTENT_DONE", payload);
        callback && callback(payload);
        break;

      default:
        break;
    }
  });
};

export const convertList = (respData = {}) => {
  return Object.keys(respData).map((key) => {
    return { ...respData[key] };
  });
};
