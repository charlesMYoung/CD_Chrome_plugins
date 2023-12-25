import "./App.css";
import { useEffect, useState } from "react";
import { Button, Table, message as Message, Alert, Tag } from "antd";
import {
  sendMessage,
  sleep,
  onMessageByGetContent,
  coverMap,
  convertList,
} from "./utils";
import { getItem, setItem, clear } from "localforage";

function App() {
  const [message, setMessage] = useState("");
  const [tableData, setTable] = useState([]);

  const queryListHandle = async (page) => {
    await sleep(4000);

    setMessage("正在抓取第" + page + "页，数据列表");

    const resp = await sendMessage("GET_LIST", "");

    const [, ...resultData] = resp.data;

    let bdiListStorage = (await getItem("bdiList")) || {};
    bdiListStorage = coverMap(resultData, bdiListStorage);

    const tableCol = convertList(bdiListStorage);
    setTable(tableCol);
    console.log("bdiListStorage====", bdiListStorage);
    await setItem("bdiList", bdiListStorage);

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
    let bdiListStorage = (await getItem("bdiList")) || {};
    const tableCol = convertList(bdiListStorage);
    const firstContent = tableCol.find((item) => item.content === "");
    return firstContent;
  };

  const getDetailInfo = async () => {
    const firstContent = await findFirstEmptyContent();
    if (firstContent) {
      await chrome.tabs.create({
        url: firstContent.originalLink,
      });
    }
  };

  /**
   * 展示数据
   */
  const initShowData = async () => {
    console.log("extend init");
    let bdiListStorage = (await getItem("bdiList")) || {};
    const tableCol = convertList(bdiListStorage);
    setTable(tableCol);
  };

  const clearData = async () => {
    await clear();
    initShowData();
    Message.success("清除成功");
  };

  const onMessageByGetContentCallback = async (payload) => {
    const { data, tabId } = payload;
    const { bidLink, content } = data;
    let bdiListStorage = (await getItem("bdiList")) || {};
    bdiListStorage[bidLink].content = content;
    await setItem("bdiList", bdiListStorage);
    initShowData();
    await sleep(1000);
    await chrome.tabs.remove(tabId);
    getDetailInfo();
  };

  useEffect(() => {
    initShowData();
    onMessageByGetContent(onMessageByGetContentCallback);
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
              return data ? (
                <Tag color="green">有</Tag>
              ) : (
                <Tag color="magenta">无</Tag>
              );
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
