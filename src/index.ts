import Koa from 'koa'
import render from 'koa-ejs'
import * as path from "path";
import request from "request"
import htmlparser2 from 'htmlparser2'
import dns from "dns"

const app = new Koa()

render(app, {
    root: path.resolve('template'),
    layout: 'index',
    viewExt: 'html',
    cache: true,
    debug: false
});

app.use(async function (ctx) {

    let requestMode = 'redirect'
    let requestTarget = 'https://google.com/'
    let requestWrapper = 'https://google.com/'
    let requestCountDown = `0`
    let requestClickGo = true
    let defaultPath = null

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
                if (argMap.has("defaultPath")) defaultPath = argMap.get("defaultPath") as string
            }
            resolve()
        })
    })

    let replace = ctx.request.path + ctx.request.search
    console.log(replace)
    if (replace.length <= 1){
        replace = defaultPath?defaultPath:""
    }
    if (requestTarget.endsWith("/{delegate}")) {
        requestTarget = requestTarget.replace("/{delegate}", replace)
    }
    if (requestWrapper.endsWith("/{delegate}")) {
        requestWrapper = requestWrapper.replace("/{delegate}", replace)
    }

    if (requestMode == 'redirect') {
        ctx.redirect(requestTarget)
        return
    }

    if (requestMode == 'proxy') {
        let resp = await getHookedHtmlFor(requestTarget)

        for (const header in resp.header) {
            ctx.set(header, resp.header[header])
        }

        ctx.response.body = resp.body
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

app.listen(80)
console.log("Start web server at http://localhost:" + 80)


function getHookedHtmlFor(url: string): Promise<{ header: any, body: any }> {
    return new Promise(resolve => {
        request({url: url, encoding: null}, function (error, response, body) {
            resolve({header: response.headers, body: body})
        })
    })
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
