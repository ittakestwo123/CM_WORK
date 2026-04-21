import { Tag } from "antd";

const STATUS_STYLE_MAP: Record<string, { color: string; background: string; border: string }> = {
  未备案: { color: "#5f6f83", background: "#f1f4f7", border: "#dde4ec" },
  待备案: { color: "#9b6a2e", background: "#fbf2e4", border: "#ead7b5" },
  已备案: { color: "#2f6d58", background: "#e8f3ee", border: "#c8e3d6" },
  备案退回: { color: "#98515a", background: "#f8eaed", border: "#e9c7ce" },
  草稿: { color: "#5f6f83", background: "#f1f4f7", border: "#dde4ec" },
  待市审: { color: "#2f4d69", background: "#e9eff7", border: "#ccd9e8" },
  市审通过: { color: "#2c6f67", background: "#e8f4f3", border: "#c4e4e0" },
  市审退回: { color: "#a06a3e", background: "#fbf1e5", border: "#ead4bb" },
  待省审: { color: "#2f4d69", background: "#e7eef6", border: "#c6d5e6" },
  省审通过: { color: "#2f6d58", background: "#e8f3ee", border: "#c8e3d6" },
  省审退回: { color: "#98515a", background: "#f8eaed", border: "#e9c7ce" },
  已上报: { color: "#455f84", background: "#eaf0fa", border: "#cad8eb" },
  已上报部委: { color: "#455f84", background: "#eaf0fa", border: "#cad8eb" },
  已发布: { color: "#455f84", background: "#eaf0fa", border: "#cad8eb" },
  已读: { color: "#5f6f83", background: "#f1f4f7", border: "#dde4ec" },
  未读: { color: "#9a4e58", background: "#f8eaed", border: "#e9c7ce" },
  待办: { color: "#2f4d69", background: "#e9eff7", border: "#ccd9e8" },
  启用: { color: "#2f6d58", background: "#e8f3ee", border: "#c8e3d6" },
  停用: { color: "#98515a", background: "#f8eaed", border: "#e9c7ce" },
  已激活: { color: "#2f4d69", background: "#e9eff7", border: "#ccd9e8" },
  未激活: { color: "#a06a3e", background: "#fbf1e5", border: "#ead4bb" },
  预定义: { color: "#2f4d69", background: "#e9eff7", border: "#ccd9e8" },
  自定义: { color: "#5c4f8e", background: "#f0ebfb", border: "#d8cef2" },
  成功: { color: "#2f6d58", background: "#e8f3ee", border: "#c8e3d6" },
  失败: { color: "#98515a", background: "#f8eaed", border: "#e9c7ce" },
  待重试: { color: "#a06a3e", background: "#fbf1e5", border: "#ead4bb" },
  重试中: { color: "#2f4d69", background: "#e9eff7", border: "#ccd9e8" },
  正常: { color: "#2f6d58", background: "#e8f3ee", border: "#c8e3d6" },
  预警: { color: "#a06a3e", background: "#fbf1e5", border: "#ead4bb" },
  严重: { color: "#98515a", background: "#f8eaed", border: "#e9c7ce" },
};

interface Props {
  status: string;
}

export function StatusTag({ status }: Props) {
  const style = STATUS_STYLE_MAP[status] ?? {
    color: "#5f6f83",
    background: "#f1f4f7",
    border: "#dde4ec",
  };
  return (
    <Tag className="status-tag" style={{ color: style.color, background: style.background, borderColor: style.border }}>
      {status}
    </Tag>
  );
}
