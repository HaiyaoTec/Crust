import Koa from 'koa'
import render from 'koa-ejs'
import * as path from "path";
import request from "request"
import htmlparser2 from 'htmlparser2'
import dns from "dns"

const mode = process.env.MODE ? process.env.MODE : "wrap"
const targetUrl = process.env.TARGET ? process.env.TARGET as string : "https://baidu.com"
const wrapperUrl = process.env.WRAPPER ? process.env.WRAPPER : targetUrl;
const countdown = process.env.COUNTDOWN ? process.env.COUNTDOWN : 0
const port = process.env.PORT ? process.env.PORT : 80

const app = new Koa()

render(app, {
    root: path.resolve('template'),
    layout: 'index',
    viewExt: 'html',
    cache: true,
    debug: false
});

app.use(async function (ctx) {
    let requestHead
    let requestTarget = targetUrl
    let requestWrapper = wrapperUrl
    let requestCountDown = countdown
    let requestClickGo = "false"

    await new Promise<void>(resolve => {
        dns.resolveTxt("crust."+ctx.hostname, function (err, addresses) {
            if (!err && addresses){
                console.log(addresses)
                let argMap = new Map<string,string>()
                addresses[0][0].split(";").forEach(arg=>{
                    let [key,...value] = arg.split("=")
                    argMap.set(key, value.join("="))
                })
                console.log(argMap)
                if (argMap.has("target")) requestTarget = argMap.get("target") as string
                if (argMap.has("wrapper")) requestWrapper = argMap.get("wrapper") as string
                if (argMap.has("countDown")) requestCountDown = argMap.get("countDown") as string
                if (argMap.has("clickgo")) requestClickGo = argMap.get("clickgo") as string
            }
            resolve()
        })
    })

    requestHead = await parseHeadFor(requestWrapper)
    if (requestTarget.endsWith("/{delegate}")){
        requestTarget = requestTarget.replace("/{delegate}", ctx.request.path+ctx.request.search)
    }
    if (requestWrapper.endsWith("/{delegate}")){
        requestWrapper = requestWrapper.replace("/{delegate}", ctx.request.path+ctx.request.search)
    }

    await ctx.render('index', {
        head: requestHead,
        target: requestTarget,
        wrapper: requestWrapper,
        countdown: requestCountDown,
        clickgo: requestClickGo == 'true'
    });

});

app.listen(port)
console.log("Start web server at http://localhost:"+port)

function parseHeadFor(url: string):Promise<string>{
    return new Promise(resolve => {
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200){
                console.log("Load Page Success")
                resolve(parseHead(body))
            }else {
                console.log("Load Page Failed")
                resolve("")
            }
        })
    })
}

function parseHead(html: string):string{
    let content: string = ""
    let titleReady = false
    const parser = new htmlparser2.Parser({
        onopentag(name, attributes) {
            if (name === "link" || name === "meta") {
                let line = "<"+name+" "
                for (let key in attributes) {
                    line+=(key+"="+attributes[key]+" ")
                }
                line+="/>\n"
                content+=line
            }
            if (name === "title" && titleReady == false){
                titleReady = true
            }
        },

        ontext(data: string) {
            if (titleReady){
                content += "<title>"+data+"</title>\n"
                titleReady = false
            }
        }
    });
    parser.write(html);
    parser.end();
    return content
}
