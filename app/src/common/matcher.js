import { getMatchers } from "../utils/utils";
import {
  STYLE_PATTER_MAP,
  CONTACT_PATTER_MAP,
  TENDERER_PATTER_MAP,
  TENDERER_AGENT_PATTER_MAP,
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

export const getContactInfo = (text) => {
  if (!text) {
    return "";
  }

  // 使用正则表达式进行匹配
  let match = getMatchers(text, CONTACT_PATTER_MAP);

  if (match && match[1]) {
    return match[1].trim(); // 去除首尾的空格
  }
};

/**
 * 招标人获取
 * @param {string} text
 * @returns
 */
export const tendererInfo = (text) => {
  if (!text) {
    return "";
  }

  let match = getMatchers(text, TENDERER_PATTER_MAP);

  if (match && match[1]) {
    let tendererStr = match[1].trim();
    return `招标人:${tendererStr}`.replace(/\s/g, "");
  }
};

export const tenderAgentInfo = (text) => {
  if (!text) {
    return "";
  }

  let match = getMatchers(text, TENDERER_AGENT_PATTER_MAP);
  if (match && match[1]) {
    let tendererStr = match[1].trim();
    return `招标代理机构:${tendererStr}`.replace(/\s/g, "");
  }
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

  const terInfo = tendererInfo(fullContent);

  const terInfoStyle = getInfoFromStyle(terInfo);

  const agentInfo = tenderAgentInfo(fullContent);

  const agentInfoStyle = getInfoFromStyle(agentInfo);

  console.log("result", {
    fullContent,
    terInfo,
    agentInfo,
    terInfoStyle,
    agentInfoStyle,
  });

  //匹配联系方式
};
