import dayjs from "dayjs";

import type {
  DashboardStat,
  EnterpriseRecord,
  NoticeRecord,
  ReportRecord,
  Role,
  SurveyPeriod,
  User,
} from "../types";

export const roleUsers: Record<Role, User> = {
  enterprise: {
    id: "u-ent-01",
    username: "enterprise_user",
    role: "enterprise",
    name: "云南云智制造有限公司",
    region: "昆明市",
  },
  city: {
    id: "u-city-01",
    username: "city_reviewer",
    role: "city",
    name: "昆明市人社局审核员",
    region: "昆明市",
  },
  province: {
    id: "u-prov-01",
    username: "province_admin",
    role: "province",
    name: "云南省人社厅管理员",
    region: "云南省",
  },
};

export const statusColorMap: Record<string, string> = {
  待备案: "gold",
  已备案: "green",
  备案退回: "red",
  草稿: "default",
  待市审: "processing",
  市审通过: "cyan",
  市审退回: "orange",
  待省审: "blue",
  省审通过: "green",
  省审退回: "red",
  已上报: "purple",
  已上报部委: "purple",
};

const makeHalfMonthPeriods = (year: number): SurveyPeriod[] => {
  const result: SurveyPeriod[] = [];
  for (let month = 1; month <= 12; month += 1) {
    if (month <= 3) {
      result.push({
        periodCode: `${year}${String(month).padStart(2, "0")}H1`,
        periodName: `${year}年${month}月上半月`,
        monthNo: month,
        halfNo: 1,
        periodType: "HALF_MONTH",
        startDate: `${year}-${String(month).padStart(2, "0")}-01`,
        endDate: `${year}-${String(month).padStart(2, "0")}-15`,
      });
      result.push({
        periodCode: `${year}${String(month).padStart(2, "0")}H2`,
        periodName: `${year}年${month}月下半月`,
        monthNo: month,
        halfNo: 2,
        periodType: "HALF_MONTH",
        startDate: `${year}-${String(month).padStart(2, "0")}-16`,
        endDate: dayjs(`${year}-${String(month).padStart(2, "0")}-01`).endOf("month").format("YYYY-MM-DD"),
      });
    } else {
      result.push({
        periodCode: `${year}${String(month).padStart(2, "0")}`,
        periodName: `${year}年${month}月度调查`,
        monthNo: month,
        periodType: "MONTH",
        startDate: `${year}-${String(month).padStart(2, "0")}-01`,
        endDate: dayjs(`${year}-${String(month).padStart(2, "0")}-01`).endOf("month").format("YYYY-MM-DD"),
      });
    }
  }
  return result;
};

export const surveyPeriods = makeHalfMonthPeriods(2026);

export const dashboardStatsByRole: Record<Role, DashboardStat[]> = {
  enterprise: [
    { title: "备案状态", value: "已备案" },
    { title: "当前待办", value: 2, suffix: "项" },
    { title: "本期状态", value: "待填报" },
    { title: "历史填报", value: 11, suffix: "期" },
  ],
  city: [
    { title: "待审核企业", value: 24, suffix: "家" },
    { title: "今日已审核", value: 13, suffix: "家" },
    { title: "退回数量", value: 4, suffix: "家" },
    { title: "高风险异常", value: 3, suffix: "条" },
  ],
  province: [
    { title: "待备案审批", value: 18, suffix: "家" },
    { title: "待省审报表", value: 42, suffix: "份" },
    { title: "已汇总报表", value: 126, suffix: "份" },
    { title: "本期岗位变化", value: "-2.8%", trend: "同比" },
  ],
};

export const enterpriseList: EnterpriseRecord[] = [
  { id: "e01", name: "云南云智制造有限公司", orgCode: "YN-ORG-0001", region: "昆明市", contact: "李敏", filingStatus: "待备案" },
  { id: "e02", name: "大理恒远文旅发展有限公司", orgCode: "YN-ORG-0002", region: "大理州", contact: "王超", filingStatus: "已备案" },
  { id: "e03", name: "曲靖新材科技有限公司", orgCode: "YN-ORG-0003", region: "曲靖市", contact: "刘畅", filingStatus: "备案退回" },
];

const periodNameMap = Object.fromEntries(surveyPeriods.map((item) => [item.periodCode, item.periodName]));

export const reportList: ReportRecord[] = [
  {
    id: "r01",
    enterpriseName: "云南云智制造有限公司",
    periodCode: "202601H1",
    periodName: periodNameMap["202601H1"],
    baseEmployment: 320,
    surveyEmployment: 312,
    status: "市审通过",
    submitTime: "2026-01-14 16:35",
    cityReviewTime: "2026-01-15 09:30",
    region: "昆明市",
    reason: "订单结构调整",
  },
  {
    id: "r02",
    enterpriseName: "云南云智制造有限公司",
    periodCode: "202601H2",
    periodName: periodNameMap["202601H2"],
    baseEmployment: 320,
    surveyEmployment: 300,
    status: "待省审",
    submitTime: "2026-01-28 15:00",
    cityReviewTime: "2026-01-29 10:15",
    region: "昆明市",
    reason: "阶段性产线升级",
  },
  {
    id: "r03",
    enterpriseName: "曲靖新材科技有限公司",
    periodCode: "202604",
    periodName: periodNameMap["202604"],
    baseEmployment: 215,
    surveyEmployment: 190,
    status: "待市审",
    submitTime: "2026-04-06 14:20",
    region: "曲靖市",
    reason: "原料价格波动",
  },
  {
    id: "r04",
    enterpriseName: "大理恒远文旅发展有限公司",
    periodCode: "202604",
    periodName: periodNameMap["202604"],
    baseEmployment: 178,
    surveyEmployment: 182,
    status: "草稿",
    submitTime: "2026-04-07 09:05",
    region: "大理州",
  },
];

export const notices: NoticeRecord[] = [
  {
    id: "n01",
    title: "关于 2026 年 4 月调查期填报工作的通知",
    content: "请各企业于 4 月 1 日至 4 月 30 日完成数据填报。",
    publisher: "云南省人社厅",
    publishTime: "2026-04-01 08:30",
    read: false,
    status: "已发布",
  },
  {
    id: "n02",
    title: "市级审核规则更新提示",
    content: "对异常波动数据请填写核查意见后再退回。",
    publisher: "昆明市人社局",
    publishTime: "2026-04-03 10:00",
    read: true,
    status: "已发布",
  },
];

export const recentActivities = [
  { id: "a1", text: "企业用户提交了 2026年4月度调查 报表", time: "10 分钟前" },
  { id: "a2", text: "市级审核员退回了 1 份报表并填写原因", time: "35 分钟前" },
  { id: "a3", text: "省级发布了本期填报通知", time: "1 小时前" },
];

export const natureOptions = [
  {
    label: "国有企业",
    value: "state",
    children: [
      { label: "中央企业", value: "central" },
      { label: "地方国企", value: "local" },
    ],
  },
  {
    label: "民营企业",
    value: "private",
    children: [
      { label: "有限责任公司", value: "llc" },
      { label: "股份有限公司", value: "joint" },
    ],
  },
];

export const industryOptions = [
  {
    label: "制造业",
    value: "manufacturing",
    children: [
      { label: "装备制造", value: "equipment" },
      { label: "材料加工", value: "material" },
    ],
  },
  {
    label: "服务业",
    value: "service",
    children: [
      { label: "文旅服务", value: "tourism" },
      { label: "信息服务", value: "it" },
    ],
  },
];

export const contactAddressOptions = [
  {
    label: "昆明市",
    value: "昆明市",
    children: [
      { label: "五华区", value: "五华区" },
      { label: "盘龙区", value: "盘龙区" },
      { label: "官渡区", value: "官渡区" },
      { label: "西山区", value: "西山区" },
    ],
  },
  {
    label: "曲靖市",
    value: "曲靖市",
    children: [
      { label: "麒麟区", value: "麒麟区" },
      { label: "沾益区", value: "沾益区" },
      { label: "马龙区", value: "马龙区" },
    ],
  },
  {
    label: "大理州",
    value: "大理州",
    children: [
      { label: "大理市", value: "大理市" },
      { label: "祥云县", value: "祥云县" },
      { label: "弥渡县", value: "弥渡县" },
    ],
  },
];

export const decreaseReasonMap: Record<string, string[]> = {
  "生产经营调整": ["订单减少", "生产线调整", "其他"],
  "组织结构优化": ["组织精简", "岗位合并", "其他"],
  "员工主动流动": ["个人原因离职", "退休", "其他"],
  其他: ["其他"],
};

export const decreaseTypeOptions = Object.keys(decreaseReasonMap).map((item) => ({ value: item, label: item }));

export const cityCodeOptions = [
  { value: "530100", label: "530100 - 昆明市" },
  { value: "530300", label: "530300 - 曲靖市" },
  { value: "530400", label: "530400 - 玉溪市" },
  { value: "530500", label: "530500 - 保山市" },
  { value: "530600", label: "530600 - 昭通市" },
  { value: "530700", label: "530700 - 丽江市" },
  { value: "530800", label: "530800 - 普洱市" },
  { value: "530900", label: "530900 - 临沧市" },
  { value: "532300", label: "532300 - 楚雄州" },
  { value: "532500", label: "532500 - 红河州" },
  { value: "532600", label: "532600 - 文山州" },
  { value: "532800", label: "532800 - 西双版纳州" },
  { value: "532900", label: "532900 - 大理州" },
  { value: "533100", label: "533100 - 德宏州" },
  { value: "533300", label: "533300 - 怒江州" },
  { value: "533400", label: "533400 - 迪庆州" },
];

export const noticeTextLimits = {
  title: 50,
  content: 1000,
} as const;
