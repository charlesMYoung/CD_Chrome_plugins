import "./App.css";
import { useEffect, useState } from "react";
import { Button, Table, message as Message, Alert } from "antd";

const sendMessage = async (action, payload) => {
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

const sleep = (timeout) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
};

const saveList = (value) => {
  if (!value) {
    return;
  }
  value = JSON.stringify(value);
  return chrome.storage.local.set({ bdiList: value }).then(() => {
    console.log("Data saved.");
  });
};

const getList = () => {
  return chrome.storage.local.get("bdiList").then((result) => {
    if (!result.bdiList) {
      return {};
    }
    return JSON.parse(result.bdiList);
  });
};

const convertList = (respData = {}) => {
  return Object.keys(respData).map((key) => {
    return { ...respData[key] };
  });
};

const coverMap = (respData, storageMaps = {}) => {
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

function App() {
  const [message, setMessage] = useState("");
  const [tableData, setTable] = useState([]);

  const queryListHandle = async (page) => {
    await sleep(4000);

    setMessage("正在抓取第" + page + "页，数据列表");

    const resp = await sendMessage("GET_LIST", "");

    const [, ...resultData] = resp.data;

    let bdiListStorage = await getList();
    bdiListStorage = coverMap(resultData, bdiListStorage);

    const tableCol = convertList(bdiListStorage);
    setTable(tableCol);
    console.log("bdiListStorage====", bdiListStorage);
    await saveList(bdiListStorage);

    setMessage("抓取第" + page + "页, 完成！！");
    if (page >= 3) {
      return;
    }
    page = page + 1;
    await sendMessage("JUMP_PAGE", page);
    setMessage("跳转到" + page + "页");
    return queryListHandle(page);
  };

  const findFirstEmptyContent = async () => {
    let bdiListStorage = await getList();
    const tableCol = convertList(bdiListStorage);
    const firstContent = tableCol.find((item) => item.content === "");
    return firstContent;
  };

  const getDetailInfo = async () => {
    const firstContent = await findFirstEmptyContent();
    if (firstContent) {
      const tabMange = await chrome.tabs.create({
        url: firstContent.originalLink,
      });

      const tabId = tabMange.id;
      console.log("tabId---->", tabId);
      await sleep(4000);
      console.log("begin click next page result---->");
      const result = await sendMessage("CLICK_NEXT_PAGE");
      console.log("CLICK_NEXT_PAGE result---->", result);

      console.log("sleep 7000ms");
      const { data: detailInfo } = (await sendMessage("GET_DETAIL", "")) || {};
      console.log("detail info", detailInfo.content);
      let bdiListStorage = await getList();
      if (bdiListStorage[detailInfo.bidLink]) {
        console.log("current", bdiListStorage[detailInfo.bidLink]);
        bdiListStorage[detailInfo.bidLink].content = detailInfo.content;
        await saveList(bdiListStorage);
        await sleep(1000);
        await chrome.tabs.remove(tabId);
      }

      getDetailInfo();
    }
  };

  /**
   * 展示数据
   */
  const initShowData = async () => {
    console.log("extend init");
    let bdiListStorage = await getList();
    const tableCol = convertList(bdiListStorage);
    setTable(tableCol);
  };

  const clearData = () => {
    chrome.storage.local.remove("bdiList").then(() => {
      Message.success("清除数据成功");
      initShowData();
    });
  };

  useEffect(() => {
    initShowData();
  }, []);

  return (
    <>
      <div>
        {message ? <Alert message={message} type="success" /> : null}
        <Button
          onClick={() => {
            queryListHandle(1);
          }}
        >
          抓取列表
        </Button>
        <Button onClick={getDetailInfo}>抓取详情数据</Button>
        <Button onClick={clearData} danger>
          清除数据
        </Button>
      </div>
      <Table
        dataSource={tableData}
        columns={[
          {
            title: "招标公告名称",
            dataIndex: "bidName",
            ellipsis: true,
            width: 100,
          },
          {
            title: "是否有内容",
            dataIndex: "content",
            width: 100,
            render: (data) => {
              return data ? "有" : "无";
            },
          },
        ]}
        rowKey={"originalLink"}
        scroll={{ x: 400 }}
      />
    </>
  );
}

export default App;
