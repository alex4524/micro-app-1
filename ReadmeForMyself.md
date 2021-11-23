[京东 micro-app 框架使用文档](https://github.com/micro-zoe/micro-app/blob/dev/README.zh-cn.md)
[react-router@6](https://reactrouter.com/docs/en/v6/getting-started/tutorial)

#### 新建一个带 router 的 vue 应用

> [vue-cli](https://cli.vuejs.org/zh/guide/installation.html) > [vue-router](https://router.vuejs.org/zh/installation.html) 注意版本是 3.x 还是 4.x

```
npm install -g @vue/cli
vue create hello-world
```

#### 新建一个带 router 的 react 应用

> [create-react-app](https://github.com/facebook/create-react-app)  
> [react-router](https://reactrouter.com/docs/en/v6/getting-started/installation)
> 如需使用 history 模式 ，直接将 HashRouter 替换为 BrowserRouter [指南 Tutorial](https://reactrouter.com/docs/en/v6/getting-started/tutorial)

```
npm install -g create-react-app
create-react-app my-react-app
```


#### 思路: 跑起来一个demo，了解了基本的协作语法
##### 父应用：
1. yarn add @micro-zoe/micro-app
2. 入口文件引入
// main.js
import microApp from '@micro-zoe/micro-app'
microApp.start()
3. 分配一个路由给子应用
const routes = [
    {
    // 👇 非严格匹配，/my-page/xxx 都将匹配到 MyPage 页面
    path: '/my-page/*', 
    name: 'my-page',
    component: MyPage,
    },
]
4. 在`MyPage`页面中嵌入微前端应用
<micro-app name="app1" url="http://localhost:3000/"></micro-app>

##### 子应用：
基座应用是history路由，子应用是hash路由时，仅需要在webpack-dev-server的headers中设置跨域支持。

devServer: {
    headers: {
    'Access-Control-Allow-Origin': '*',
    },
},

#### 遇到的问题
1. Socket服务报错
```
node:events:368
      throw er; // Unhandled 'error' event
      ^

Error: read ECONNRESET
    at TCP.onStreamRead (node:internal/stream_base_commons:220:20)
Emitted 'error' event on Socket instance at:
    at emitErrorNT (node:internal/streams/destroy:157:8)
    at emitErrorCloseNT (node:internal/streams/destroy:122:3)
    at processTicksAndRejections (node:internal/process/task_queues:83:21) {
  errno: -54,
  code: 'ECONNRESET',
  sy
```


#### 原理分析
> 兼容性如何？  
micro-app依赖于CustomElements和Proxy两个较新的API。  
对于不支持CustomElements的浏览器，可以通过引入polyfill进行兼容，详情可参考：webcomponents/polyfills。  
但是Proxy暂时没有做兼容，所以对于不支持Proxy的浏览器无法运行micro-app。  
浏览器兼容性可以查看：Can I Use  

基于此，首先需要了解 CustomElements和Proxy

#### CustomElements（即为 WebComponent）

#### Proxy