import "./App.css";
import { useEffect, useState } from "react";
import {
  Button,
  Table,
  message as Message,
  Alert,
  Tag,
  Card,
  Space,
} from "antd";
import {
  sendMessage,
  sleep,
  onMessageByGetContent,
  batchSave,
  getTableList,
  updatedContentByLink,
  findFirsContentEmpty,
} from "./utils";
import { clear } from "localforage";
import { usePage } from "./usePage";

function App() {
  const [message, setMessage] = useState("");

  const {
    data,
    isLoading,
    pagination: { current, pageSize, total },
    onChange,
  } = usePage({
    service: async (cur, size) => {
      const result = await getTableList(cur, size);
      console.log("result", result);
      return result;
    },
  });

  const queryListHandle = async (page) => {
    setMessage("正在抓取第" + page + "页，数据列表");
    await sleep(4000);
    const resp = await sendMessage("GET_LIST", "");

    const [, ...resultData] = resp.data;
    await batchSave(resultData);
    onChange(current, pageSize);

    setMessage("抓取第" + page + "页, 完成！！");
    if (page >= 3) {
      return;
    }
    page = page + 1;
    await sendMessage("JUMP_PAGE", page);
    setMessage("跳转到" + page + "页");
    return queryListHandle(page);
  };

  const getDetailInfo = async () => {
    const firstContent = await findFirsContentEmpty();
    if (firstContent) {
      await chrome.tabs.create({
        url: firstContent.originalLink,
      });
    }
  };

  const clearData = async () => {
    await clear();
    await onChange(current, pageSize);
    Message.success("清除成功");
  };

  const onMessageByGetContentCallback = async (payload) => {
    const { data, tabId } = payload;
    const { bidLink, content } = data;

    await updatedContentByLink(bidLink, content);

    await onChange(current, pageSize);
    await sleep(1000);
    await chrome.tabs.remove(tabId);
    getDetailInfo();
  };

  useEffect(() => {
    onMessageByGetContent(onMessageByGetContentCallback);
  }, []);

  const exportData = () => {};

  return (
    <>
      {message ? <Alert message={message} type="success" /> : null}
      <Card title="数据抓取插件">
        <Button
          onClick={() => {
            queryListHandle(1);
          }}
          size="small"
        >
          抓取列表
        </Button>
        <Button onClick={getDetailInfo} size="small">
          抓取详情数据
        </Button>
        <Button onClick={clearData} danger size="small">
          清除数据
        </Button>
        <Button onClick={exportData} type="primary" size="small">
          导出数据
        </Button>
      </Card>
      <Table
        title={() => "数据列表"}
        isLoading={isLoading}
        dataSource={data}
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
        pagination={{
          current,
          pageSize,
          total,
          onChange: onChange,
          onShowSizeChange: onChange,
          showTotal: (total) => {
            return `共 ${total} 记录`;
          },
          position: ["topCenter"],
        }}
        rowKey={"originalLink"}
        scroll={{ x: 400 }}
      />
    </>
  );
}

export default App;
