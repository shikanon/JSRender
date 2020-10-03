/*
 * Author: shikanon (shikanon@tensorbytes.com)
 * File Created Time: 2020-09-01 10:09:54
 * 
 * Project: JSRender
 * File: main.js
 * Description: A server-side rendering service based koa and puppeteer.
 * 
 */

// 导入包
const puppeteer = require('puppeteer');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const request = require('request');
const fs = require("fs");
const app = new Koa();

app.use(bodyParser());

var targetHost = "http://shikanon.com"

// 存储browserWSEndpoint列表
let WSE_LIST = [];

// 初始化
// browser 初始化，将bwse存储复用
(async() =>{
  // 因为服务器内核不支持sandbox，所以只能启用--no-sandbox
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox','--no-first-run']});
  // 存储节点以便能重新连接到 Chromium
  const browserWSEndpoint = await browser.wsEndpoint();
  WSE_LIST = [browserWSEndpoint]
  fs.readFile('config/config.json','utf8',(err,data)=>{
    //判断是否成功
    if(!err){
        let configfile = JSON.parse(data);
        targetHost = configfile["targetHost"];
    }else{
        console.log("Warn: use default url 'shikanon.com' only for test");
    }
  })
})();

// 对 request 方法进行封装
function getRequest(url, ctx) {
  return new Promise((resolve, reject) => {
    // 需要设置 encoding 为 null ，不然body默认是string而非buffer，这样对images等二进制文件就会出错
    request({url:url, method: ctx.method, header: ctx.header, form:ctx.request.body, encoding: null},
      function(error, response, body){
        // 可以成功打印，但ctx最终没继续执行
        resolve(response)
      }
      )
  })
}

// 转发请求
app.use(async ctx =>{
  let ua = ctx.header["user-agent"]
  let time1 = new Date().getTime();
  let url = targetHost + ctx.url
  console.log(url, ua);
  // 针对 header 类型直接返回200
  if (ctx.method == "header"){
    ctx.response.status = 200
    return
  }
  // UA检查, 没有 UA 禁止访问，一方面是防止恶意爬虫攻击
  if (ua === undefined){
    ua = "-"
    ctx.response.status = 403
    ctx.response.body = "please tell me your User-Agent"
    return 
  }
  // 蜘蛛检查，没有标识默认为非蜘蛛
  if ((ua.search('[sS]pider') == -1) {
    // 将非spider的请求直接转发到原地址
    let resp = await getRequest(url, ctx);
    ctx.response.body = resp.body;
    // 不 set header 会存在 response.header 丢失
    ctx.response.set(resp.headers);
    ctx.response.status = resp.statusCode;
  }else{
    // 恢复节点
    let browserWSEndpoint = WSE_LIST[0]
    const browser = await puppeteer.connect({browserWSEndpoint});
    
    // 开启新的标签页
    let page = await browser.newPage();
    await page.setJavaScriptEnabled(true);
    // 由于只关心渲染后的dom树，所以对css，font，image等都做了屏蔽
    await page.setRequestInterception(true); 
    page.on('request', (req) => {
      if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'){
              req.abort();
          }
          else {
              req.continue();
          }
      });

    // waitUntil 主要包括四个值，'load','domcontentloaded','networkidle2','networkidle0'
    // 分别表示在xx之后才确定为跳转完成
    // load - 页面的load事件触发时
    // domcontentloaded - 页面的 DOMContentLoaded 事件触发时
    // networkidle2 - 只有2个网络连接时触发（至少500毫秒后）
    // networkidle0 - 不再有网络连接时触发（至少500毫秒后）
    await page.goto(url, { waitUntil: ['load','domcontentloaded','networkidle2']});

    ctx.body = await page.content();
    // 关闭标签页
    await page.close();

    // 断开连接
    await browser.disconnect();
  }
  
  let time2 = new Date().getTime();
  console.log("finish time:",(time2-time1)/1000)

});

// 监听端口
app.listen(8000);
