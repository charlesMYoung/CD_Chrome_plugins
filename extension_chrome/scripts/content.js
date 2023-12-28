let timeId = null;

/**
 * dates=300&categoryId=88&showStatus=1&page=501&area=110000
 * @param {*} params
 * @returns
 */
const getQueryListUrl = (params) => {
  const queryParams = Object.keys(params).reduce((total, cur, index) => {
    if (index === 0) {
      return `?${cur}=${params[cur]}`;
    }
    return `${total}&${cur}=${params[cur]}`;
  }, "");

  return `https://bulletin.cebpubservice.com/xxfbcmses/search/bulletin.html${queryParams}`;
};

function decryptByDES(ciphertext, key) {
  const keyHex = CryptoJS.enc.Utf8.parse(key);
  // direct decrypt ciphertext
  const decrypted = CryptoJS.DES.decrypt(
    {
      ciphertext: CryptoJS.enc.Base64.parse(ciphertext),
    },
    keyHex,
    {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    }
  );
  return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * 详情页面获取PDF地址流程
 * 1. https://bulletin.cebpubservice.com/details/permission/getSecretKey   post 获取加密数据
 * 2. 然后解密 密钥： Ctpsp@884*
 * 3. 成为data 对象
 * 4. detail_id = $('.mian_list_03').attr("index")//公告id
 * 5. detail_pdf_url = https://bulletin.cebpubservice.com/details/bulletin/getBulletin/"+data.data+"/"+detail_id
 * 6. https://bulletin.cebpubservice.com/resource/ceb/js/pdfjs-dist/web/viewer.html?file="+detail_pdf_url   // 最终地址
 * @param {*} detailHTMLUrl
 * @returns
 */
const getDetailUrl = async (detailHTMLUrl) => {
  const key = "Ctpsp@884*";
  const secureKey = await fetch(
    "https://bulletin.cebpubservice.com/details/permission/getSecretKey",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  ).then((resp) => resp.json());

  const data = JSON.parse(decryptByDES(secureKey, key)) || {};
  console.log("getDetailUrl decryptByDES data", data);
  const htmlStr = await fetch(detailHTMLUrl).then((resp) => resp.text());
  let regex = /index="([^"]*)"/;
  let match = htmlStr.match(regex);
  let detailId = "";
  if (match) {
    detailId = match[1];
  }
  const pdfUrl = `https://bulletin.cebpubservice.com/details/bulletin/getBulletin/${data.data}/${detailId}`;
  return `https://bulletin.cebpubservice.com/resource/ceb/js/pdfjs-dist/web/viewer.html?file=${pdfUrl}`;
};

const iframeContent = () =>
  document.getElementById("iframe").contentWindow.document;
const getUrl = () => location.href;

const getPaginationCount = () => {
  const [pagination] = iframeContent().getElementsByClassName("pagination");
  let total = 0;
  if (pagination) {
    const [countLabel] = pagination.children;
    if (countLabel) {
      total = countLabel.innerHTML;
    }
  }
  return total;
};

const targetDetail = async (htmlUrl) => {
  const url = await getDetailUrl(htmlUrl);
  console.log("targetDetail url", url);
  document.getElementById("iframe").src = url;
};

const clickPaginationNext = ({ page, area }) => {
  const queryUrl = getQueryListUrl({
    dates: 300,
    categoryId: 88,
    showStatus: 1,
    page,
    area,
  });

  document.getElementById("iframe").src = queryUrl;
};

const getTableList = (browserRootDom) => {
  const [tableDom] = browserRootDom.getElementsByClassName("table_text");
  const rows = tableDom.rows;
  let tableContent = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const cells = rows[rowIndex].cells;
    tableContent[rowIndex] = [];
    for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
      if (cellIndex === 0) {
        const [, aDome] = cells[cellIndex].childNodes;
        if (aDome) {
          const [, url] = aDome.href.split("'");
          tableContent[rowIndex].push(url);
        }
      }
      const textContent = cells[cellIndex].innerText;
      tableContent[rowIndex].push(textContent);
    }
  }
  return tableContent;
};

const getPDFContent = () => {
  let pdfContent = "";
  try {
    const pdf_obj = iframeContent().getElementById("viewer");
    const textLayers = pdf_obj.getElementsByClassName("textLayer");

    if (textLayers && textLayers.length > 0) {
      for (const item of textLayers) {
        pdfContent += item.innerText;
      }
    }

    return pdfContent;
  } catch (e) {
    console.error("加载pdf容器失败", e);
  }

  return pdfContent;
};

const checkPDFContent = async (checkCount = 1) => {
  return new Promise((resolve) => {
    let pdfContent = getPDFContent();
    resolve(pdfContent);
  }).then((item) => {
    console.log("[checkPDFContent]  check pdf content count" + checkCount);
    if (checkCount > 7) {
      return Promise.resolve("");
    }
    if (item) {
      console.log("[checkPDFContent]  check pdf content success");
      return Promise.resolve(item);
    }
    checkCount = checkCount + 1;
    return sleep(1500).then(() => checkPDFContent(checkCount));
  });
};

/**
 *  获取pdf总页数
 * @returns
 */
const getPdfTotal = () => {
  const numPagesDom = iframeContent().getElementById("numPages");

  if (numPagesDom) {
    const [, page] = numPagesDom.innerText.split("/");
    if (page) {
      console.log("page===", page);
      return +page;
    }
  }

  return 0;
};

/**
 * 点击下一页
 * @param {*} clickClout
 * @returns
 */
const clickPdfNextPage = async (clickClout) => {
  return new Promise((resolve) => {
    timeId = setTimeout(() => {
      const [pageDownDom] = iframeContent().getElementsByClassName(
        "toolbarButton pageDown"
      );
      if (pageDownDom) {
        pageDownDom.click();
      }
      resolve();
    }, 1500);
  }).then(() => {
    if (clickClout >= getPdfTotal()) {
      clearTimeout(timeId);
      return Promise.resolve();
    }
    clickClout++;
    return clickPdfNextPage(clickClout);
  });
};

/**
 * 检测pdf是否加载完成
 * @param {*} callback
 * @returns
 */
let checkPDFTimeId = null;
const checkPDF = (callback, checkCount = 1) => {
  const pdf_obj = iframeContent().getElementById("viewer");
  const pdfContent = pdf_obj.getElementsByClassName("textLayer")[0];
  if (!pdfContent) {
    console.info("Loading...");
    //检测10次，10次没有结果,就强制退出
    if (checkCount > 10) {
      clearTimeout(checkPDFTimeId);
      callback && callback(false);
      return;
    }
    checkPDFTimeId = setTimeout(() => {
      checkCount = checkCount + 1;
      checkPDF(callback, checkCount);
    }, 1000);
  } else {
    clearTimeout(checkPDFTimeId);
    callback && callback(true);
  }
};

/**
 * 监听消息
 * @param {*} request
 * @param {*} sender
 * @param {*} sendResponse
 * @returns
 */
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  const { action, payload } = request;
  console.log("%c Line:4 🥔 action, payload", "color:#b03734", action, payload);

  switch (action) {
    case "GET_LIST":
      const tableData = getTableList(iframeContent());
      sendResponse({
        data: tableData,
        message: "success",
        action,
      });
      break;
    case "JUMP_PAGE":
      const { page, area } = payload;
      clickPaginationNext({
        page,
        area: area || "",
      });
      sendResponse({
        message: "success",
        data: action,
        action,
      });
      return true;

    case "JUMP_DETAIL":
      await targetDetail(payload);

      const config = await getConfig();
      await sleep(config.detailDelayTime * 1000);
      checkPDF(async (isSuccess) => {
        let data = {
          bidLink: payload,
        };
        if (isSuccess) {
          await clickPdfNextPage(1);
          data.content = (await checkPDFContent()) || "抓取失败";
        } else {
          await sleep(2000);
          data.content = "抓取失败";
        }

        chrome.runtime.sendMessage({
          action: "GET_CONTENT_DONE",
          payload: {
            data,
          },
        });
      });

      return true;
    default:
      break;
  }
});
