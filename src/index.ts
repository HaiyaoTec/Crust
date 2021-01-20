import Koa from 'koa'
import render from 'koa-ejs'
import * as path from "path";
import request from "request"
import htmlparser2 from 'htmlparser2'
import dns from "dns"

const mode = process.env.MODE ? process.env.MODE : "wrapper"
const targetUrl = process.env.TARGET ? process.env.TARGET as string : "https://google.com"
const wrapperUrl = process.env.WRAPPER ? process.env.WRAPPER : targetUrl;
const countdown = process.env.COUNTDOWN ? process.env.COUNTDOWN : "0"
const clickgo = process.env.COUNTDOWN ? process.env.CLICKGO : "true"
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

    let requestMode = mode
    let requestTarget = targetUrl
    let requestWrapper = wrapperUrl
    let requestCountDown = countdown
    let requestClickGo = clickgo == 'true'

    await new Promise<void>(resolve => {
        dns.resolveTxt("crust." + ctx.hostname, function (err, addresses) {
            if (!err && addresses) {
                console.log(addresses)
                let argMap = new Map<string, string>()
                addresses[0][0].split(";").forEach(arg => {
                    let [key, ...value] = arg.split("=")
                    argMap.set(key, value.join("="))
                })
                if (argMap.has("mode")) requestMode = argMap.get("mode") as string
                if (argMap.has("target")) requestTarget = argMap.get("target") as string
                if (argMap.has("wrapper")) requestWrapper = argMap.get("wrapper") as string
                if (argMap.has("countDown")) requestCountDown = argMap.get("countDown") as string
                if (argMap.has("clickgo")) requestClickGo = (argMap.get("clickgo") as string == 'true')
            }
            resolve()
        })
    })

    if (requestMode == 'redirect') {
        ctx.redirect(requestTarget)
        return
    }


    if (requestTarget.endsWith("/{delegate}")) {
        requestTarget = requestTarget.replace("/{delegate}", ctx.request.path + ctx.request.search)
    }
    if (requestWrapper.endsWith("/{delegate}")) {
        requestWrapper = requestWrapper.replace("/{delegate}", ctx.request.path + ctx.request.search)
    }


    if (requestMode == 'proxy') {
        let body = await getHookedHtmlFor(requestWrapper)
        ctx.response.header['Content-Type'] = "text/html; charset=UTF-8"
        ctx.response.body = hookHtml(body, requestTarget, requestCountDown, requestClickGo)
        return
    }

    // 默认处理方式
    if (requestMode == 'wrapper' || true) {
        let requestHead = await getHeadFor(requestWrapper)
        await ctx.render('index', {
            head: requestHead,
            target: requestTarget,
            wrapper: requestWrapper,
            countdown: requestCountDown,
            clickgo: requestClickGo
        });
        return
    }

});

app.listen(port)
console.log("Start web server at http://localhost:" + port)


function getHookedHtmlFor(url: string): Promise<string> {
    return new Promise(resolve => {
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("Load Page Success")
                resolve(body)
            } else {
                console.log("Load Page Failed")
                resolve("")
            }
        })
    })
}

function hookHtml(html: string, target: string, countdown: string, clickgo: boolean): string {
    let clickgoJs = "<script>\n" +
        "    let clickDiv = document.createElement('div');\n" +
        "    clickDiv.style=\"width: 100%;height: 100%;position: absolute;top: 0\"\n" +
        "    clickDiv.addEventListener(\"click\", function (event) {\n" +
        "        window.location.replace(\"" + target + "\")\n" +
        "    })\n" +
        "    document.body.append(clickDiv)\n" +
        "</script>\n"
    if (clickgo) {
        html = html.replace("</body>", clickgoJs + "</body>")
    }

    let countdownJs = "<script>\n" +
        "        setTimeout(function () {\n" +
        "            window.location.replace(\"" + target + "\")\n" +
        "        }, <" + countdown + ")\n" +
        "</script>\n"
    if (countdown != '0') {
        html = html.replace("</body>", countdownJs + "</body>")
    }
    return html
}


function getHeadFor(url: string): Promise<string> {
    return new Promise(resolve => {
        request(url, function (error, response, body) {

            if (!error && response.statusCode == 200) {
                console.log("Load Page Success")
                resolve(parseHead(body))
            } else {
                console.log("Load Page Failed")
                resolve("")
            }
        })
    })
}

function parseHead(html: string): string {
    let content: string = ""
    let titleReady = false
    const parser = new htmlparser2.Parser({
        onopentag(name, attributes) {
            if (name === "link" || name === "meta") {
                let line = "<" + name + " "
                for (let key in attributes) {
                    line += (key + "=" + attributes[key] + " ")
                }
                line += "/>\n"
                content += line
            }
            if (name === "title" && titleReady == false) {
                titleReady = true
            }
        },

        ontext(data: string) {
            if (titleReady) {
                content += "<title>" + data + "</title>\n"
                titleReady = false
            }
        }
    });
    parser.write(html);
    parser.end();
    return content
}
