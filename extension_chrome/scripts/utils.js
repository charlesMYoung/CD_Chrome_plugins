const sleep = (timeout) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
};

const getChromeStorage = async (key) => {
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

const setChromeStorage = async (key, value) => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, (result) => {
      console.log("setChromeStorage", result);
      resolve();
    });
  });
};

const getConfig = async () => {
  const config = await getChromeStorage("config");
  if (!config) {
    console.warn("config is not on storage, will use default config");
    return {
      homeUrl: "https://bulletin.cebpubservice.com/",
      listDelayTime: 2,
      detailDelayTime: 2,
    };
  }
  return config;
};
