import { Flex, Button, Tooltip } from "antd";
import {
  ExportOutlined,
  ReloadOutlined,
  ClearOutlined,
} from "@ant-design/icons";

// eslint-disable-next-line react/prop-types
export const Tools = ({ onExport, onRefresh, onClear }) => {
  return (
    <Flex justify="space-between">
      <Flex>抓取结果</Flex>
      <Flex gap="middle">
        <Tooltip title="刷新">
          <Button
            onClick={onRefresh}
            size="small"
            icon={<ReloadOutlined />}
          ></Button>
        </Tooltip>
        <Tooltip title="清除数据">
          <Button
            onClick={onClear}
            danger
            size="small"
            icon={<ClearOutlined />}
          ></Button>
        </Tooltip>
        <Tooltip title="导出excel">
          <Button
            onClick={onExport}
            type="primary"
            size="small"
            icon={<ExportOutlined />}
          ></Button>
        </Tooltip>
      </Flex>
    </Flex>
  );
};
