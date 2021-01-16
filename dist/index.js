import Koa from 'koa';
import render from 'koa-ejs';
import * as path from "path";
import request from "request";
import htmlparser2 from 'htmlparser2';
import dns from "dns";

const targetUrl = process.env.TARGET ? process.env.TARGET : "https://baidu.com";
const countdown = process.env.COUNTDOWN ? process.env.COUNTDOWN : 0;
const port = process.env.PORT ? process.env.PORT : 80;

const app = new Koa();
render(app, {
    root: path.resolve('template'),
    layout: 'index',
    viewExt: 'html',
    cache: true,
    debug: false
});
app.use(async function (ctx) {
    let requestHead = "";
    let requestTarget = targetUrl;
    let requestCountDown = countdown;
    let requestClickGo = "false";
    await new Promise(resolve => {
        dns.resolveTxt("crust." + ctx.hostname, function (err, addresses) {
            if (!err && addresses) {
                let argMap = new Map();
                addresses[0][0].split("&").forEach(arg => {
                    let [key, value] = arg.split("=");
                    argMap.set(key, value);
                });
                if (argMap.has("target"))
                    requestTarget = argMap.get("target");
                if (argMap.has("countDown"))
                    requestCountDown = argMap.get("countDown");
                if (argMap.has("clickgo"))
                    requestClickGo = argMap.get("clickgo");
            }
            resolve();
        });
    });
    requestHead = await parseHeadFor(requestTarget);
    await ctx.render('index', {
        head: requestHead,
        target: requestTarget + ctx.request.path + ctx.request.search,
        countdown: requestCountDown,
        clickgo: requestClickGo
    });
});
app.listen(port);
console.log("Start web server at http://localhost:" + port);
function parseHeadFor(url) {
    return new Promise(resolve => {
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("Load Page Success");
                resolve(parseHead(body));
            }
            else {
                console.log("Load Page Failed");
                resolve("");
            }
        });
    });
}
function parseHead(html) {
    let content = "";
    let titleReady = false;
    const parser = new htmlparser2.Parser({
        onopentag(name, attributes) {
            if (name === "link" || name === "meta") {
                let line = "<" + name + " ";
                for (let key in attributes) {
                    line += (key + "=" + attributes[key] + " ");
                }
                line += "/>\n";
                content += line;
            }
            if (name === "title" && titleReady == false) {
                titleReady = true;
            }
        },
        ontext(data) {
            if (titleReady) {
                content += "<title>" + data + "</title>\n";
                titleReady = false;
            }
        }
    });
    parser.write(html);
    parser.end();
    return content;
}
