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

# 参数
+ **mode** ： 代理模式：`redirect` | `proxy` | `wrapper`
+ **wrapper** : 包裹或代理的站点URL，可以包含具体 path 与 query. `{delegate}` 用于表示访问壳站时的 path + query
+ **target** : 跳转的目标站点URL，可以包含具体 path 与 query. `{delegate}` 用于表示访问壳站时的 path + query
+ **countdown** : 倒计时跳转时间,单位秒，0为不启用倒计时跳转
+ **clickgo** : 是否点击跳转（点击页面任何地方都可以跳转）true 开启，false 关闭

参数示例：
##### 场景1
使用 wrapper 模式，包裹 `https://www.abcdefg.com` 并且进入页面5秒后自动跳转到 `https://iamherer.com`
```shell
mode=wrapper
wrapper=https://www.abcdefg.com
target=https://iamherer.com
countdown=5000
```

##### 场景2
使用 proxy 模式，包裹 `https://www.abcdefg.com/lee?hallo` 并且进入页面后点击任意地方自动跳转到 `https://iamherer.com`, 并携带上访问时带的 path 和 query
```shell
mode=wrapper
wrapper=https://www.abcdefg.com/lee?hallo
target=https://iamherer.com/{delegate}
clickgo=true
```


# 域名跟随配置
允许一套配置跟随一个域名，只需要在域名的txt记录上写入参数即可。`;` 分割参数

比如欲解析域名 `sample.com`   
先解析 A 记录：`@` -> `123.123.123.123`  
再解析 TXT 记录：`crust` -> `mode=wrapper;wrapper=https://www.abcdefg.com;target=https://iamherer.com;countdown=5000`  
这样服务就会自动将 `sample.com` 应用 TXT 记录中的配置