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

const getDetailUrl = () => {};

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

const clickPaginationNext = (pageNumber) => {
  console.log("clickPaginationNext>>>>", pageNumber);

  const queryUrl = getQueryListUrl({
    dates: 300,
    categoryId: 88,
    showStatus: 1,
    page: pageNumber,
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

const sleep = (timeout) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
};

const getPDFContent = () => {
  try {
    const pdf_obj = iframeContent().getElementById("viewer");
    return pdf_obj.getElementsByClassName("textLayer")[0].innerText;
  } catch (e) {}

  return "";
};

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
 *
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
 * 获取内容
 * @returns
 */
const getContent = () => {
  const content = getPDFContent() || "未解析到...";
  return {
    bidLink: getUrl(),
    content,
  };
};

//监听列表
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
      const pageNumber = payload;
      clickPaginationNext(pageNumber);
      sendResponse({
        message: "success",
        data: action,
        action,
      });
      return true;

    case "GET_CONTENT":
      sleep(1000);
      await clickPdfNextPage(1);
      console.log("done");
      sleep(2000);
      const data = getContent();
      chrome.runtime.sendMessage({
        action: "GET_CONTENT_DONE",
        payload: {
          tabId: payload,
          data,
        },
      });

      return true;
    default:
      break;
  }
});
