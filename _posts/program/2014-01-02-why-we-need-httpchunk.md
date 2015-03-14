---
layout: default
title: 我们为什么需要Http Chunk
comments: true
categories: [program]
---
## 我们为什么需要Http Chunk

目前来说Wikipidea和HTTP 1.1标准中Http Chunk都是指服务器端响应数据可以作为Chunked数据，主要作用就是不指定Http Headers中的Content-Length，客户端接收数据按照块接收，如果响应数据比较大，可以让客户端浏览器先渲染着部分数据，防止屏幕是白屏幕.

目前也有人发送HTTP请求的时候把请求数据作为Chunked数据块来发送，如文件上传，这样可以让服务器端先异步的在服务器端处理着数据，增加系统效率.

但是目前来说，很多HTTP Server并不完全支持客户端发送Http Chunk请求，大部分的应用场景还是服务器响应.

如果自己编写Http Server，如使用Netty自己处理请求，则可以完全满足这种发送请求也适用Chunked数据的情况.
