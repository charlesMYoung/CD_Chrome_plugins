import { useEffect, useRef, useState } from "react";

import { Table, message, Tag, Layout, Menu } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { Tools } from "./components/tool";
import { Settings } from "./components/settings";
import { ActionTool } from "./components/actionTool";
import {
  sendMessage,
  sleep,
  onMessageByGetContent,
  batchSave,
  getTableList,
  updatedContentByLink,
  findFirsContentEmpty,
  getAllData,
  getConfig,
  setChromeStorage,
} from "./utils";
import { exportTableData } from "./sheet";
import { clear } from "localforage";
import { usePage } from "./usePage";
import { Alert } from "antd";
const { Header, Content } = Layout;

function App() {
  const [alertInfo, setAlertInfo] = useState("");
  const stopListFlagRef = useRef(false);
  const stopDetailFlagRef = useRef(false);
  const [continuePage, setContinuePage] = useState(1);
  const [area, setArea] = useState();
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const [historySetting, setHistorySetting] = useState({
    homeUrl: "https://bulletin.cebpubservice.com/",
    listDelayTime: 4,
    detailDelayTime: 4,
  });

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
      console.log("result", JSON.stringify(result.data));
      return result;
    },
  });

  const refreshTable = () => {
    onChange(paginationRef.current.current, paginationRef.current.pageSize);
  };

  const queryListHandle = async (page = 1) => {
    setContinuePage(page);
    setAlertInfo("正在抓取第" + page + "页，数据列表");
    const { listDelayTime } = await getConfig();
    await sleep(listDelayTime * 1000);
    const resp = await sendMessage("GET_LIST", "");
    const [, ...resultData] = resp.data;
    await batchSave(resultData);
    refreshTable();
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

  const beginCatchDetailData = async () => {
    stopDetailFlagRef.current = false;
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

    refreshTable();
    await sleep(2000);

    if (!stopDetailFlagRef.current) {
      beginCatchDetailData();
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

  const onCatchDetail = (isCatch) => {
    if (isCatch) {
      stopDetailFlagRef.current = false;
      beginCatchDetailData();
    } else {
      stopDetailFlagRef.current = true;
    }
  };
  const onCatchList = (isCatch) => {
    if (isCatch) {
      stopListFlagRef.current = false;
      queryListHandle(continuePage);
    } else {
      stopListFlagRef.current = true;
    }
  };

  const paginationHandle = (cur, size) => {
    paginationRef.current.pageSize = size;
    paginationRef.current.current = cur;
    onChange(cur, size);
  };

  const menuHandle = async ({ key }) => {
    if (key === "home") {
      const { homeUrl } = await getConfig();
      chrome.tabs.create({
        url: homeUrl,
      });
    } else if (key === "settings") {
      setIsSettingOpen(true);
    }
  };

  const onSettingFinishHandle = async (value) => {
    setIsSettingOpen(false);
    setHistorySetting(value);
    await setChromeStorage("config", value);
  };

  return (
    <Layout>
      {alertInfo && <Alert message={alertInfo} type="info" closable></Alert>}
      <Settings
        open={isSettingOpen}
        onFinish={onSettingFinishHandle}
        historySetting={historySetting}
      ></Settings>
      <Header style={{ display: "flex", backgroundColor: "#ffffff" }}>
        <Menu
          onClick={menuHandle}
          selectable={false}
          mode="horizontal"
          items={[
            {
              label: "打开主页",
              key: "home",
            },
            {
              label: "设置",
              key: "settings",
              icon: <SettingOutlined />,
            },
          ]}
          style={{
            width: "100%",
          }}
        />
      </Header>
      <Content>
        <ActionTool
          onAreaChange={setArea}
          onCatchDetail={onCatchDetail}
          onCatchList={onCatchList}
          onPageContinueChange={setContinuePage}
          area={area}
          continuePage={continuePage}
        ></ActionTool>
        <Table
          bordered
          title={() => (
            <Tools
              onExport={exportData}
              onRefresh={refreshTable}
              onClear={clearData}
            ></Tools>
          )}
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
                      // eslint-disable-next-line no-undef
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
      </Content>
    </Layout>
  );
}

export default App;
