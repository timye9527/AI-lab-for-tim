// 把 notes.js 导出成《演讲备注.md》
const fs = require("fs");
const path = require("path");
const { SLIDES_NOTES, fmt } = require("./notes.js");

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
let t = 0;
const rows = [];
const blocks = [];
SLIDES_NOTES.forEach((n, i) => {
  const no = String(i + 1).padStart(2, "0");
  const range = n.sec ? `${mmss(t)}–${mmss(t + n.sec)}` : "备用";
  rows.push(`| ${no} | ${n.t} | ${range} | ${n.sec ? fmt(n.sec) : "—"} | ${n.media} |`);
  t += n.sec;
  blocks.push(`## ${no} · ${n.t}\n\n**时间**：${range}（${n.sec ? fmt(n.sec) : "备用页"}）　**互动 / 媒体**：${n.media}\n\n- **这一页要传递的观点**：${n.view}\n- **讲述建议**：\n\n${n.how.split("\n").map((l) => "  " + l).join("\n")}\n\n- **幽默与转场**：${n.fun}\n`);
});
const md = `# 《动动嘴，让 AI 把活干了！》逐页演讲备注

> 这份备注和 PPT 每页的「备注」栏内容一致（由 \`build/notes.js\` 生成）。正文页合计 ${fmt(t)}。
> 带「请按真实情况调整」的地方，请换成你自己的真实经历，不要照念。

## 时间轴

| 页 | 内容 | 时间 | 时长 | 互动 / 媒体 |
|---|---|---|---|---|
${rows.join("\n")}

${blocks.join("\n")}`;
fs.writeFileSync(path.join(__dirname, "..", "演讲备注.md"), md);
console.log("total", t, "sec");
