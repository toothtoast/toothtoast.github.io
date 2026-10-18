# TOOTH · GitHub Pages

入口：https://toothtoast.github.io/

这是现有 TOOTH 游戏的第三个前端入口，共用原有游戏后端与存档。
原项目继续维护在私有仓库，新仓库只包含公开网页、第三方声明和发布配置。

## 首次启用

仓库 Settings → Pages → Build and deployment → Source，选择 **GitHub Actions**。
随后在 Actions → Sync and deploy TOOTH to GitHub Pages 中选择 Run workflow。
不需要为这个仓库填写 Cloudflare、EdgeOne、Resend 或私有源仓库的密钥。

## 自动同步

原项目仍照常自动发布到 Cloudflare 和 EdgeOne。
本仓库的 Actions 在每小时第 7、22、37、52 分钟检查已经上线的 Cloudflare 网页。
网页有变化时同步 index.html 与 THIRD_PARTY_NOTICES.txt，然后发布 GitHub Pages。
也可手动 Run workflow 立即检查。

GitHub 定时任务可能延迟；公开仓库连续 60 天没有活动时，GitHub 可能暂停定时任务，需要到 Actions 重新启用。
同步失败或校验不通过时保留之前已发布的网站。
请在原项目中修改网页，直接修改本仓库的镜像网页会在下次同步时被覆盖。

## 账号与通行密钥

使用原来的玩家 ID 和密码登录，云存档、仓库和排行榜共用。
不同域名的登录状态独立，需要在新入口重新登录。
GitHub Pages 使用独立的通行密钥域名；请先用密码登录，再在本入口添加通行密钥。
原域名的通行密钥继续可用，但不能直接用于本入口。

## 本地构建

Node.js 22 或更高版本：

```sh
npm run sync
npm run build
```

只发布 _site 目录中的静态网页；后端继续运行于原来的 Cloudflare Worker。
