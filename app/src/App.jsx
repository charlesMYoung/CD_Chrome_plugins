import "./App.css";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Table,
  message,
  Alert,
  Tag,
  Card,
  InputNumber,
  Select,
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
  getAllData,
  AreaList,
} from "./utils";
import { exportTableData } from "./sheet";
import { clear } from "localforage";
import { usePage } from "./usePage";

function App() {
  const [alertInfo, setAlertInfo] = useState("");
  const [isQueryList, setIsQueryList] = useState(false);
  const stopListFlagRef = useRef(false);
  const stopDetailFlagRef = useRef(false);
  const [isQueryDetail, setIsQueryDetail] = useState(false);
  const [continuePage, setContinuePage] = useState(1);
  const [area, setArea] = useState();

  const paginationRef = useRef({
    current: 1,
    pageSize: 20,
  });

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

  const queryListHandle = async (page = 1) => {
    setContinuePage(page);
    setAlertInfo("正在抓取第" + page + "页，数据列表");
    await sleep(5000);
    const resp = await sendMessage("GET_LIST", "");
    const [, ...resultData] = resp.data;
    await batchSave(resultData);
    onChange(paginationRef.current.current, paginationRef.current.pageSize);
    setAlertInfo("抓取第" + page + "页, 完成！！");
    if (stopListFlagRef.current || page >= 500) {
      return;
    }
    page = page + 1;
    await sendMessage("JUMP_PAGE", {
      page,
      area,
    });
    setAlertInfo("跳转到" + page + "页");
    return queryListHandle(page);
  };

  const openEmptyContentDetail = async () => {
    stopDetailFlagRef.current = false;
    setIsQueryDetail(true);
    const firstContent = await findFirsContentEmpty();
    if (firstContent) {
      const result = await sendMessage(
        "JUMP_DETAIL",
        firstContent.originalLink
      );
      console.log("result", result);
    }
  };

  const clearData = async () => {
    await clear();
    await onChange(current, pageSize);
    message.success("清除成功");
  };

  const onMessageByGetContentCallback = async (payload) => {
    const { data } = payload;
    const { bidLink, content } = data;

    await updatedContentByLink(bidLink, content);

    onChange(paginationRef.current.current, paginationRef.current.pageSize);
    await sleep(2000);

    if (!stopDetailFlagRef.current) {
      openEmptyContentDetail();
    }
  };

  useEffect(() => {
    onMessageByGetContent(onMessageByGetContentCallback);
  }, []);

  const exportData = async () => {
    message.info("正在导出...");
    const data = await getAllData();
    message.success("导出成功！");
    exportTableData(data);
  };

  const onInputNumberChange = (value) => {
    setContinuePage(value);
  };

  const handleChange = (value) => {
    setArea(value);
  };

  const openHomePage = () => {
    chrome.tabs.create({
      url: "https://bulletin.cebpubservice.com/",
    });
  };

  const CardTitle = () => {
    return (
      <Space>
        <Button type="link" onClick={openHomePage}>
          打开页面
        </Button>
        抓取地区
        <Select
          style={{ width: 80 }}
          onChange={handleChange}
          defaultValue={""}
          value={area}
          options={AreaList}
          size="small"
        />
        <div>
          抓取页数
          <InputNumber
            onChange={onInputNumberChange}
            size="small"
            value={continuePage}
          />
        </div>
      </Space>
    );
  };

  const paginationHandle = (cur, size) => {
    paginationRef.current.pageSize = size;
    paginationRef.current.current = cur;
    onChange(cur, size);
  };

  return (
    <>
      {alertInfo ? (
        <Alert message={alertInfo} type="success" closable banner />
      ) : null}
      <Card title={<CardTitle></CardTitle>}>
        {isQueryList ? (
          <Button
            onClick={() => {
              setIsQueryList(false);
              stopListFlagRef.current = true;
            }}
            size="small"
          >
            暂停抓取列表
          </Button>
        ) : (
          <Button
            onClick={() => {
              setIsQueryList(true);
              stopListFlagRef.current = false;
              queryListHandle(continuePage);
            }}
            size="small"
          >
            抓取列表
          </Button>
        )}

        {isQueryDetail ? (
          <Button
            onClick={() => {
              stopDetailFlagRef.current = true;
              setIsQueryDetail(false);
            }}
            size="small"
          >
            暂停抓取详情数据
          </Button>
        ) : (
          <Button onClick={openEmptyContentDetail} size="small">
            抓取详情数据
          </Button>
        )}

        <Button onClick={clearData} danger size="small">
          清除数据
        </Button>
        <Button onClick={exportData} type="primary" size="small">
          导出Excel
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
                data === "抓取失败" ? (
                  <Tag color="warning">抓取失败</Tag>
                ) : (
                  <Tag color="green">有</Tag>
                )
              ) : (
                <Tag color="magenta">无</Tag>
              );
            },
          },
          {
            title: "原文链接",
            dataIndex: "originalLink",
            render: (data) => {
              return (
                <a
                  onClick={async () => {
                    await chrome.tabs.create({
                      url: data,
                    });
                  }}
                >
                  跳转
                </a>
              );
            },
          },
        ]}
        pagination={{
          current,
          pageSize,
          total,
          onChange: paginationHandle,
          onShowSizeChange: paginationHandle,
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
