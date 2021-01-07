import Koa from 'koa'
import render from 'koa-ejs'
import * as path from "path";
import request from "request"
import htmlparser2 from 'htmlparser2'
import RuntimeError = WebAssembly.RuntimeError;


const targetUrl = process.env.TARGET ? process.env.TARGET as string : "https://baidu.com"
const countdown = process.env.COUNTDOWN ? process.env.COUNTDOWN : 0
const port = process.env.PORT ? process.env.PORT : 80

let head: string
const app = new Koa()

render(app, {
    root: path.resolve('template'),
    layout: 'index',
    viewExt: 'html',
    cache: true,
    debug: false
});

request(targetUrl, function (error, response, body) {
    if (!error && response.statusCode == 200){
        console.log("Load Page Success")
        head = parseHead(body)
    }else {
        console.log("Load Page Failed")
        throw new RuntimeError()
    }
})

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


app.use(async function (ctx) {
    await ctx.render('index', {
        head: head,
        target: targetUrl,
        countdown: countdown
    });
});

app.listen(port)
console.log("Start web server at http://localhost:"+port)