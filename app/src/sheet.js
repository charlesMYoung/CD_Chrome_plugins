import { utils, writeFile } from "xlsx";

const listToAoa = (rows) => {
  return rows.map((item) => {
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
};

export const exportTableData = (rows) => {
  const aoaData = listToAoa(rows);
  const worksheet = utils.aoa_to_sheet(aoaData);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Sheet1");

  /* 处理标题头 */
  utils.sheet_add_aoa(
    worksheet,
    [
      [
        "招标公告名称",
        "招标链接",
        "所属行业",
        "所属地区",
        "来源渠道",
        "公告发布时间",
        "距离开标时间",
        "内容详情",
      ],
    ],
    {
      origin: "A1",
    }
  );

  /* 计算每行宽度 */
  //   const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
  //   worksheet["!cols"] = [{ wch: max_width }];

  writeFile(workbook, "项目招标.xlsx", {
    compression: true,
  });
};
