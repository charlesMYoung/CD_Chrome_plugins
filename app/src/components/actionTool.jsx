/* eslint-disable react/prop-types */
import { Button, Card, InputNumber, Select, Tooltip, Flex } from "antd";
import { useState } from "react";
import { AreaList } from "../utils";
import { PauseOutlined, CaretRightOutlined } from "@ant-design/icons";

export const ActionTool = ({
  onCatchList,
  onCatchDetail,
  onAreaChange,
  onPageContinueChange,
  area,
  continuePage,
}) => {
  const [isQueryList, setIsQueryList] = useState(false);
  const [isQueryDetail, setIsQueryDetail] = useState(false);

  const beginCatchList = () => {
    setIsQueryList(true);
    onCatchList(true);
  };

  const pauseCatchList = () => {
    setIsQueryList(false);
    onCatchList(false);
  };

  const beginCatchDetail = () => {
    setIsQueryDetail(true);
    onCatchDetail(true);
  };

  const pauseCatchDetail = () => {
    setIsQueryDetail(false);
    onCatchDetail(false);
  };

  return (
    <Card
      hoverable
      style={{
        margin: "6px 0",
      }}
    >
      <Flex gap={"middle"} wrap="wrap">
        {isQueryList ? (
          <Tooltip title="暂停抓取列表">
            <Button
              onClick={pauseCatchList}
              size="small"
              icon={<PauseOutlined />}
            >
              列表
            </Button>
          </Tooltip>
        ) : (
          <Tooltip title="开始抓取列表">
            <Button
              onClick={beginCatchList}
              size="small"
              icon={<CaretRightOutlined />}
            >
              列表
            </Button>
          </Tooltip>
        )}

        {isQueryDetail ? (
          <Tooltip title="暂停抓取详情数据">
            <Button
              onClick={pauseCatchDetail}
              size="small"
              icon={<PauseOutlined />}
            >
              详情
            </Button>
          </Tooltip>
        ) : (
          <Tooltip title="开始抓取详情数据">
            <Button
              onClick={beginCatchDetail}
              size="small"
              icon={<CaretRightOutlined />}
            >
              详情
            </Button>
          </Tooltip>
        )}
        <Flex gap={"middle"}>
          <Flex gap={"small"}>
            地区:
            <Select
              style={{ width: 80 }}
              onChange={onAreaChange}
              defaultValue={""}
              value={area}
              options={AreaList}
              size="small"
            />
          </Flex>
          <Flex>
            <Flex gap={"small"}>
              页数:
              <InputNumber
                min={1}
                onChange={onPageContinueChange}
                size="small"
                value={continuePage}
              />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
};
