/* eslint-disable react/prop-types */
import { Button, Col, Drawer, Form, Input, Row, Space, Modal } from "antd";
import { useEffect } from "react";
import { message } from "antd";
import { InputNumber } from "antd";

export const Settings = ({ onFinish, open, historySetting }) => {
  const [settingFrom] = Form.useForm();
  const [modal] = Modal.useModal();

  const onClose = async () => {
    const values = await settingFrom.validateFields();

    let isEqual = true;

    Object.keys(values).forEach((key) => {
      if (historySetting[key] !== values[key]) {
        isEqual = false;
        return;
      }
    });

    if (!isEqual) {
      const confirmed = await modal.confirm({
        title: "设置页面已经更改，是否保存？",
      });

      if (confirmed) {
        onFinish(values);
        message.success("设置成功，请重新开始任务");
      } else {
        onFinish(historySetting);
      }
    } else {
      onFinish(historySetting);
    }
  };

  const confirmHandle = async () => {
    const values = await settingFrom.validateFields();
    onFinish(values);
    message.success("设置成功，请重新开始任务");
  };

  const cancelHandle = () => {
    onFinish(historySetting);
  };

  useEffect(() => {
    if (open) {
      historySetting && settingFrom.setFieldsValue(historySetting);
    }
  }, [open]);

  return (
    <Drawer
      title="设置"
      width="90%"
      onClose={onClose}
      open={open}
      extra={
        <Space>
          <Button onClick={cancelHandle}>取消</Button>
          <Button onClick={confirmHandle} type="primary">
            确定
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" form={settingFrom}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="homeUrl"
              label="首页地址"
              rules={[
                {
                  required: true,
                  type: "url",
                  message: "输入地址不合法",
                },
              ]}
            >
              <Input rows={4} placeholder="请输入跳转地址" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              tooltip="单位：秒"
              name="listDelayTime"
              label="列表延迟时间"
              rules={[
                {
                  required: true,
                  message: "列表延迟时间不能为空",
                },
              ]}
            >
              <InputNumber placeholder="请输入延迟时间" min={1} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              tooltip="单位：秒"
              name="detailDelayTime"
              label="详情延迟时间"
              rules={[
                {
                  required: true,
                  message: "详情延迟时间不能为空",
                },
              ]}
            >
              <InputNumber placeholder="请输入详情延迟时间" min={1} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
};
