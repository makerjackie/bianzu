# 滑动变祖器 / Bianzu

通用滑动变祖器：马斯克、梁文锋、杨植麟、奥特曼、达里奥、Tibo、MakerJackie。

- https://zu.01mvp.com
- https://bianzu.01mvp.com
- https://godelon.01mvp.com
- https://rheostat.01mvp.com
- https://github.com/makerjackie/bianzu

短视频：`/promo-zh.mp4` · `/promo-en.mp4`

## 给自己做一版

用一张头像 + 姓名 + 职业/背景，生成六档肖像（小难 → 祖）和一份搞笑档案。

```bash
npx skills add makerjackie/bianzu
```

装完后对 Grok / Claude / Codex / Cursor（或任何能对照片做 image-edit 的 Agent）说：

> 用这张头像做滑动变祖器。我叫 MakerJackie，独立开发者，现在收入为 0。

Agent 会：

1. 锁正脸（必须像你，再微美颜一点）
2. 一次出齐六档：衣服、表情、体型全变
3. 编昵称和时间线
4. **在 bianzu 仓库里** → 把角色追加到站点最后一栏  
   **在别处** → 吐出一个可分享的文件夹：`bianzu-{id}/index.html` + `ranks/`

案例（本站最后一栏）：[zu.01mvp.com/?who=jackie](https://zu.01mvp.com/?who=jackie) —— MakerJackie，默默无闻的独立开发者，三十个 App，MRR 还是 0。

指定安装某一个 Agent：

```bash
npx skills add makerjackie/bianzu --skill create-bianzu-image -g -a grok -y
npx skills add makerjackie/bianzu --skill create-bianzu-image -g -a claude-code -y
npx skills add makerjackie/bianzu --skill create-bianzu-image -g -a codex -y
```

Rank voices: Fish Audio `s2.1-pro-free` via `mj-tts`.
