import { iterate, getItem, setItem, length } from "localforage";

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

export const getTableList = async (current = 1, pageSize = 20) => {
  let data = [];
  const total = await length();
  const offset = (current - 1) * pageSize;
  const maxIndex = total - 1;
  const endOffset = offset + pageSize;
  const eOffset = endOffset > maxIndex ? maxIndex : endOffset;
  await iterate((value, key, index) => {
    if (index > offset && index <= eOffset) {
      data.push(value);
    }
    if (index > eOffset) {
      return [value, key];
    }
  });

  return {
    current,
    pageSize,
    data,
    total,
  };
};

export const updatedContentByLink = async (link, content) => {
  const currentItem = await getItem(link);

  return setItem(link, {
    ...currentItem,
    content,
  }).then(() => {
    console.log("[updatedContentByLink] update data success");
  });
};

export const findFirsContentEmpty = async () => {
  return iterate((value, key) => {
    if (!value.content) {
      return value;
    }
  });
};

export const getAllData = async () => {
  let data = [];
  await iterate((value) => {
    data.push(value);
  });
  return data;
};

export const batchSave = async (resultData) => {
  if (Array.isArray(resultData) && resultData.length > 0) {
    const batchSave = resultData.map((item) => {
      const key = item[0];
      return setItem(key, {
        originalLink: item[0],
        bidName: item[1],
        industry: item[2],
        district: item[3],
        sourceChannel: item[4],
        releaseTime: item[5],
        leftBidOpenTime: item[6],
        content: "",
      });
    });
    console.log("批量保存成功");
    return Promise.all(batchSave);
  }
  return Promise.resolve();
};
