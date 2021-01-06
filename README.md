# Crust 网站加壳代理
Crust 基于 `iframe` 来对任意网站套一层壳，以实现使用任意域名**匿名代理**任意网站的效果。

Crust 还会自动拉取目标网址的基本信息填充自身. 保证自身 tdk, 三方分享与目标站点一致。

Crust 还支持主动触发或一段时间后自动重定向到目标网址。
# Docker 安装
```shell
docker pull jude95/crust
```

# 启动
```shell
docker run -p 80:80 -e TARGET="https://google.com" jude95/crust
```
代表对 `google.com` 进行代理.

### 环境变量
+ TARGET : 要代理的目标网址 eg: https://google.com
+ COUNTDOWN : 倒计时后进行重定向到目标网址，单位毫秒. 默认0表示不作自动跳转 eg : 5000 
+ PORT : 服务端口，默认80