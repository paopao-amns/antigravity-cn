# Antigravity-CN 贡献指南 (Contributing Guide)

感谢你关注并愿意为 **Antigravity-CN** 做出贡献！本项目致力于为广大中文开发者打造最地道、最流畅、最稳定的 Google Antigravity 汉化与中文增强体验。

无论你是发现了翻译错别字、想要补齐未翻译的词条，还是优化核心补丁引擎，我们都非常欢迎你的 Pull Request。

---

## 目录
1. [如何贡献词条翻译](#如何贡献词条翻译)
2. [术语翻译规范标准](#术语翻译规范标准)
3. [使用「词条检查器」抓取未翻译文本](#使用词条检查器抓取未翻译文本)
4. [本地测试与校验](#本地测试与校验)
5. [提交规范 (Git Commit Guidelines)](#提交规范)

---

## 如何贡献词条翻译

1. **Fork 本仓库** 到你自己的 GitHub 账号。
2. 克隆到本地并创建新分支：
   ```bash
   git checkout -b feat/translate-more-settings
   ```
3. 打开 [`locales/zh-CN.json`](./locales/zh-CN.json) 文件，找到对应的英文 Key，填入或修改中文翻译：
   ```json
   "New Conversation": "新建会话",
   "Tool Execution Policy": "工具调用策略"
   ```
4. 如果遇到带有数字、时间的动态词条（如 `"Thought for 5.2s"`），请在 [`locales/dynamic-rules.json`](./locales/dynamic-rules.json) 中添加正则匹配规则：
   ```json
   {
     "pattern": "^Thought for\\s+([0-9.]+)\\s*(?:s|seconds)$",
     "replacement": "已思考 $1 秒",
     "flags": "i"
   }
   ```

---

## 术语翻译规范标准

为了保持界面术语与主流开发工具（如 VS Code、Chrome DevTools）风格高度一致，请遵循以下规范：

| 英文术语 | 官方推荐中文翻译 | 说明 |
| :--- | :--- | :--- |
| **Workspace** | 工作区 | 不要翻译为“工作空间” |
| **Conversation** | 会话 / 对话 | 指代一次聊天会话时用“会话” |
| **Auxiliary Pane** | 辅助面板 | 侧边展开的辅助管理栏 |
| **Artifacts** | 产物面板 / 交付物 | Agent 生成的计划与独立文件 |
| **Subagents** | 子智能体 | 负责分工协作的子 Agent |
| **Terminal Sandbox** | 终端沙箱环境 | 安全受限的执行环境 |
| **Scheduled Tasks** | 计划任务 | 定时或周期执行的任务 |
| **CodeLens** | 代码透镜 | 悬浮在代码上方的操作引导 |
| **Trajectory** | 运行轨迹 / 会话轨迹 | Agent 的执行日志与轨迹记录 |
| **Skills** | 技能 | 自定义多步工作流能力 |
| **Rules** | 规则 | 提示词与行为规范 |

---

## 使用「词条检查器」抓取未翻译文本

Antigravity-CN 内置了极其方便的开发者检查工具：

1. 启动已打好补丁的 Antigravity。
2. 在任意界面按下快捷键 **<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd>**（macOS: **<kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd>**）。
3. 界面右下角会弹出提示：`🔍 Antigravity-CN 词条检查模式已开启`。
4. **按住 <kbd>Alt</kbd> 键并点击** 界面上任何未翻译的英文文本，该文本的 JSON 键值对将自动复制到你的剪贴板！
   ```json
   "Unsaved Changes": ""
   ```
5. 直接粘贴到 `locales/zh-CN.json` 中并补充中文即可，效率极高！

---

## 本地测试与校验

在提交 PR 前，请务必执行本地校验和单元测试：

```bash
# 1. 语法与查重校验
npm run validate

# 2. 运行自动化单元测试
npm test
```

确保终端输出全部为绿色勾号（Pass）。

---

## 提交规范

Git 提交信息建议遵循 Conventional Commits 规范，例如：
- `feat(locales): 补充计划任务与终端沙箱相关词条`
- `fix(engine): 修复代码块中文本被误翻译的边缘问题`
- `docs: 更新 README 中的安装与还原说明`
