# web app阅读器

> 本产品的开发是为了提高移动端的用户阅读体验，主要实现了换肤，调节字体大小，展示目录，上下翻页等功能，方便用户进行阅读。

# 技术栈

>zepto+base64+jsonp+CSS3+HTML5+es6+ajax

# 运行项目

> 如果直接用谷歌浏览器打开html文件，由于浏览器（Webkit内核）的安全策略决定了file协议访问的应用无法使用XMLHttpRequest对象，会导致跨域请求问题，<br/>
  但在某些浏览器中是允许这种操作的，比如Firefox浏览器，也就是说Filefox支持file协议下的AJAX请求。（请使用手机模式查看）<br/>
  请使用有内置http服务器的WEB开发的IDE(比如webstorm)打开文件或者使用火狐浏览器查看。


# 项目结构
```
.
├── README.md
├── index.html // 移动阅读器
├── css 
│   ├── reset.css  //重置默认的CSS样式
│   └──  reader.css //webapp阅读器样式
├── data // 模拟的数据
│   ├── chapter.json //目录章节数据
│   ├── data1.json //模拟第一章节数据
│   ├── data2.json //模拟第二章节数据
│   ├── data3.json //模拟第三章节数据
│   └──  data4.json //模拟第四章节数据
├── js
│   ├── jquery.base64.js //jQbase64解码插件
│   ├── jquery.jsonp.js //jQ跨域请求插件
│   ├── RangeSlider.js //封装可以修改滑动条样式的一个插件
│   └──  reader.js //用户交互以及请求本地数据
└── lib
    └──  zepto.min.js //JavaScript库

```