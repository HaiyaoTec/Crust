# Crust 网站加壳代理
Crust 可以使用多种方式对目标站点进行代理
支持的模式
### 重定向（redirect） 
直接响应 302 到 target 地址

### 壳代理（proxy）
完全代理 `wrapper` 站点的请求。本质上就是一层反向代理。
并且支持 `countdown` `clickgo` 2种方式跳转到 `target`

### 壳包裹(wrapper)
使用 iframe 包裹 `wrapper` 站点。
并且支持 `countdown` `clickgo` 2种方式跳转到 `target`

# Docker 安装
```shell
docker pull jude95/crust
```

# 启动
```shell
docker run -p 80:80 jude95/crust
```


### 环境变量
+ TARGET : 要代理的目标网址 eg: https://google.com
+ COUNTDOWN : 倒计时后进行重定向到目标网址，单位毫秒. 默认0表示不作自动跳转 eg : 5000 
+ PORT : 服务端口，默认80