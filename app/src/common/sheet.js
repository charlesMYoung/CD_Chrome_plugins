import { utils, writeFile } from "xlsx";
import { mainCovert } from "./matcher";

// 招标人信息 代理机构信息 标的金额 获取时间 递交截止时间 递交方式 开标时间 开标地点

const listToAoa = (rows) => {
  const allRows = rows.map((item) => {
    mainCovert(item.content);
    return [
      item.bidName,
      item.originalLink,
      item.industry,
      item.district,
      item.sourceChannel,
      item.releaseTime,
      item.leftBidOpenTime,
      item.content,
    ];
  });

  allRows.unshift([
    "招标公告名称",
    "招标链接",
    "所属行业",
    "所属地区",
    "来源渠道",
    "公告发布时间",
    "距离开标时间",
    "内容详情",
  ]);
  return allRows;
};

export const exportTableData = (rows) => {
  const aoaData = listToAoa(rows);
  const worksheet = utils.aoa_to_sheet(aoaData, {});
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Sheet1");

  /* 计算每行宽度 */
  //   const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
  //   worksheet["!cols"] = [{ wch: max_width }];

  writeFile(workbook, "项目招标.xlsx", {
    compression: true,
  });
};
