# @supertiny99/dsh-changelog-viewer

DSH（DeepSeek Harness）客户端版本更新日志与更新前置确认插件。

在 DSH 客户端内提供独立便捷的 Changelog 查看面板；当官方发布新版本时，增加“先查看目标版本 Changelog，再明确确认是否下载更新”的拦截与确认步骤，避免盲目升级。

---

## ✨ 核心特性

1. **官方 Release 日志聚合与智能缓存**：
   - 从官方 Release 源（`https://api.github.com/repos/deepseek-ai/deepseek-harness/releases`）自动同步发布日志；
   - 支持 E-Tag 条件请求与 TTL 缓存机制，避免触发 GitHub API 限流；
   - 内置静态离线种子数据（Seed Data），在首次断网或冷启动时依旧秒级呈现。
2. **设置页独立「版本更新日志」区块**：
   - 注入 DSH 设置页（`settings.section`，order 98，不占用首页侧边栏，界面更清爽）；
   - 展示版本时间轴，标注“当前已装”、“最新可用”、“RC/Pre-release”等状态标签；
   - 支持中英双语切换（中文 / English / 全部）、Markdown 富文本排版、贡献者标签与发布时间戳；
   - 支持大窗口展开全文与一键直达官方 GitHub Release 网页。
3. **左下角默认更新全面拦截与接管**：
   - 注入全局 DOM 捕获监听器（`useCapture: true`），自动接管 DSH 客户端左下角（设置/更多旁）的原生更新指示器按钮；
   - 点击原生更新不再直接触发下载，而是立即阻断并弹出自适应主题的 Changelog 审阅弹窗；
   - 无论身处聊天、工作区还是设置，均可获得一致的更新前置把控体验。
4. **两阶段安全更新流（先看改动，再决定下载升级）**：
   - 实时感知官方新版本发布状态（联动 `window.dshDesktop.updates`）；
   - 面板顶部展示高亮横幅提示：“发现 DSH 官方新版本已就绪”；
   - 弹窗内完整呈现本次更新的核心变动说明与安全注意事项；
   - 底部提供双向明确操作：【暂不更新】（安全关闭，绝不触发下载）与【确认下载并更新】（经用户确认后才真正调起宿主更新流程）。
5. **官方规范与双主题自适应**：
   - 严格遵守 `docs/ui-style-guide.md` 规范，所有色值基于 `--dsw-alias-*` token 别名层；
   - 自适应 DSH 浅色与深色主题，文字黑白清晰高对比，排版无截断断行。

---

## 📦 安装与配置

### 方式 A：通过本地链接或 tgz 安装

在本地 profile（`~/.dsh/profiles/desktop`）的 `package.json` 添加依赖：

```json
{
  "dependencies": {
    "@supertiny99/dsh-changelog-viewer": "link:/path/to/changelog-viewer"
  }
}
```

在 `cordis.patch.yml` 中激活 bundle：

```yaml
- insert:
    - id: changelog-viewer
      name: '@supertiny99/dsh-changelog-viewer'
```

---

## 🛠️ 构建与测试

```bash
# 构建 client 并执行依赖自检（严防外部单例泄漏）
npm run build

# 运行全量单元与集成测试
npm test
```

---

## 📄 授权协议

[MIT License](LICENSE)
