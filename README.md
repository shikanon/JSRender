# JSRender

JSRender 是一个基于koa + puppeteer 构建的 SSR 服务端渲染 SEO 工具，可以帮助任何类型的前端渲染页面进行快速服务端渲染，从而实现前端渲染类页面进行SEO优化。

## Document

JSRender 通过劫持流量，对 UA 进行判断 spdier（搜索引擎爬虫）决定是否哪些流量需要 puppeteer 进行渲染，哪些流量直接转发。

![](./blob/master/docs/jsrender.png)

## Installation

### 使用 Docker 部署
使用docker安装部署：
```bash
docker run -d -p 8000:8000 -v <config.json路径>:/app/config/config.json registry.cn-shenzhen.aliyuncs.com/shikanon/jsrender
```

config.json 是配置文件，可以自定义`config/config.json`：
```json
{
    "targetHost": "<需要做SSR的网站>"
}
```

### 使用 npm 安装
使用 npm 安装：
```bash
git clone https://github.com/shikanon/JSRender.git
cd JSRender
npm install
```
如果在安装 puppeteer 遇到问题，可以参考[puppeteer troubleshooting](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#chrome-headless-doesnt-launch-on-unix)或者参考这篇博客[针对jQuery页面做SSR服务器渲染方案](https://www.shikanon.com/2020/%E6%9E%B6%E6%9E%84/%E9%92%88%E5%AF%B9jq%E5%81%9A%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%B8%B2%E6%9F%93%E6%96%B9%E6%A1%88/)