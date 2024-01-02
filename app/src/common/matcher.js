import { getMatchers } from "../utils/utils";
import {
  STYLE_PATTER_MAP,
  TENDERER_PATTER_MAP,
  TENDERER_AGENT_PATTER_MAP,
  TENDER_TIME,
  BID_OPEN_TIME,
  DEAD_TENDER_TIME,
  BID_OPEN_ADDRESS,
} from "./constants";

const getInfoFromStyle = (text) => {
  const matches = getMatchers(text, STYLE_PATTER_MAP);
  if (matches && matches.length > 0) {
    const [, user, address, contact, phone, email] = matches;
    return {
      user,
      address,
      contact,
      phone,
      email,
    };
  }
  return {};
};

export const interceptKeyWord = (text, interceptType) => {
  if (!text) {
    return "";
  }

  let match = [];
  switch (interceptType) {
    case "tenderer":
      match = getMatchers(text, TENDERER_PATTER_MAP) || [];
      if (match && match[1]) {
        let tendererStr = match[1].trim();
        return `招标人:${tendererStr}`.replace(/\s/g, "");
      }
      return "";
    case "agent":
      match = getMatchers(text, TENDERER_AGENT_PATTER_MAP) || [];
      if (match && match[1]) {
        let tendererStr = match[1].trim();
        return `招标代理机构:${tendererStr}`.replace(/\s/g, "");
      }
      return "";
    case "tenderTime":
      match = getMatchers(text, TENDER_TIME) || [];
      if (match && match[1]) {
        return match[1].trim();
      }
      return "";
    case "deadTenderTime":
      match = getMatchers(text, DEAD_TENDER_TIME) || [];
      if (match && match[1]) {
        return match[1].trim();
      }
      return "";
    case "bidOpenTime":
      match = getMatchers(text, BID_OPEN_TIME) || [];
      if (match && match[1]) {
        return match[1].trim();
      }
      return "";
    case "bidOpenAddress":
      match = getMatchers(text, BID_OPEN_ADDRESS) || [];
      console.log("match", match);
      if (match && match[1]) {
        return match[1].trim();
      }
      return "";
    default:
      return "";
  }
};

export const getTenderInfoStr = (terInfoStyle) => {
  return `招标人名称：${terInfoStyle.user}\n地址:${terInfoStyle.address}\n联系电话:${terInfoStyle.phone}\n电子邮件:${terInfoStyle.email}`;
};

export const getAgentInfoStr = (agentInfoStyle) => {
  return `招标代理机构名称：${agentInfoStyle.user}\n地址:${agentInfoStyle.address}\n联系电话:${agentInfoStyle.phone}\n电子邮件:${agentInfoStyle.email}`;
};

/**
 * 处理内容数据
 * @constructor
 * @param {string}  content
 */
export const mainCovert = (content) => {
  if (!content || content === "LOADING") {
    return "";
  }
  let fullContent = content.replace(/[\r\n]/g, "");
  fullContent = fullContent.replace(/\s/g, "");

  const terInfo = interceptKeyWord(fullContent, "tenderer");
  const agentInfo = interceptKeyWord(fullContent, "agent");
  const tenderTime = interceptKeyWord(fullContent, "tenderTime");
  const deadTenderTime = interceptKeyWord(fullContent, "deadTenderTime");
  const bidOpenTime = interceptKeyWord(fullContent, "bidOpenTime");
  const bidOpenAddress = interceptKeyWord(fullContent, "bidOpenAddress");
  const terInfoStyle = getInfoFromStyle(terInfo);
  const agentInfoStyle = getInfoFromStyle(agentInfo);
  const tenderInfo4Sheet = getTenderInfoStr(terInfoStyle);
  const tenderAgentInfo4Sheet = getAgentInfoStr(agentInfoStyle);

  console.log("result", {
    fullContent,
    terInfo,
    agentInfo,
    terInfoStyle,
    agentInfoStyle,
    tenderTime,
    deadTenderTime,
    bidOpenTime,
    bidOpenAddress,
  });

  return {
    tenderInfo: tenderInfo4Sheet,
    tenderAgentInfo: tenderAgentInfo4Sheet,
    tenderTime,
  };

  //匹配联系方式
};
