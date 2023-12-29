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
  return new Promise((resolve) => {
    window.chrome.tabs.sendMessage(
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
  // eslint-disable-next-line no-undef
  chrome?.runtime?.onMessage?.addListener((request) => {
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
  return iterate((value) => {
    if (!value.content || value.content === "LOADING") {
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

export const AreaList = [
  { label: "默认", value: "" },
  { label: "北京", value: 110000 },
  { label: "天津", value: 120000 },
  { label: "河北", value: 130000 },
  { label: "山西", value: 140000 },
  { label: "内蒙古", value: 150000 },
  { label: "吉林", value: 220000 },
  { label: "辽宁", value: 210000 },
  { label: "黑龙江", value: 230000 },
  { label: "陕西", value: 610000 },
  { label: "甘肃", value: 620000 },
  { label: "宁夏", value: 640000 },
  { label: "青海", value: 630000 },
  { label: "新疆", value: 650000 },
  { label: "兵团", value: 660000 },
  { label: "山东", value: 370000 },
  { label: "安徽", value: 340000 },
  { label: "上海", value: 310000 },
  { label: "江苏", value: 320000 },
  { label: "浙江", value: 330000 },
  { label: "福建", value: 350000 },
  { label: "河南", value: 410000 },
  { label: "湖北", value: 420000 },
  { label: "湖南", value: 430000 },
  { label: "江西", value: 360000 },
  { label: "广东", value: 440000 },
  { label: "广西", value: 450000 },
  { label: "海南", value: 460000 },
  { label: "云南", value: 530000 },
  { label: "贵州", value: 520000 },
  { label: "四川", value: 510000 },
  { label: "重庆", value: 500000 },
  { label: "西藏", value: 540000 },
];

export const getChromeStorage = async (key) => {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      console.log("getChromeStorage", result);
      if (!result[key]) {
        return resolve(null);
      }
      resolve(result[key]);
    });
  });
};

export const setChromeStorage = async (key, value) => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, (result) => {
      console.log("setChromeStorage", result);
      resolve();
    });
  });
};

export const getConfig = async () => {
  const config = await getChromeStorage("config");
  if (!config) {
    console.warn("config is not on storage, will use default config");
    return {
      homeUrl: "https://bulletin.cebpubservice.com/",
      listDelayTime: 4,
      detailDelayTime: 4,
    };
  }
  return config;
};
