# Crust 网站加壳
Crust 能够给任意网站套一层壳，以实现使用任意域名**匿名代理**任意网站的效果。

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

# 原理
容易会使用 `iframe` 对目标网站进行包裹. 另外会自动获取目标站点的 head 信息填充自身.