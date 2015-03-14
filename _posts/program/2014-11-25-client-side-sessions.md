---
layout: default
title: Client Side Sessions
categories: [program]
published: true
---

# Client Side Sessions
-----------------

## 客户端Session的目的

现在很多人推崇客户端的Session，主要场景是用在各种APP的服务器端上，优点是服务器Scale的时候不需要同步客户端的session，多少台服务器都无所谓

## 缺点

也很明显，客户端总是不安全的，即便是加密了Cookie数据，但既然是可以被服务器端解密的，那么其他人也可以通过分析大量的加密后数据进行算法猜测，是有可能被破解的。


## 来自SO的讨论

[Not a good idea](http://stackoverflow.com/a/2131603/802585)

```
Not a good idea. Storing vital data like session expiry and user name entirely on client side is too dangerous IMO, encrypted or not. Even if the concept is technically safe in itself (I can't answer that in depth, I'm no encryption expert), a break-in could be facilitated without compromising your server, just by acquiring your encryption key.

Somebody who gets hold of the key could generate session cookies at will, impersonating any user for any length of time, something the classical session concept is designed to prevent.

There are better and scalable solutions for this problem. Why not, for instance, set up a central session verification instance that all associated servers and services can poll? Look around on the web, I am 100% sure there are ready-made solutions addressing your needs.
```

## 一种可行的加密方式

1. 使用非对称加密的方法，在服务器端生成一对密钥
2. 将其中一个发布在客户端，作为`公钥`
3. 当客户端第一次请求服务器端的时候，服务器端会为其生成一个session结构，并使用`私钥`进行加密
4. 客户端只能通过`公钥`进行解密，读取其中的数据，并且将加密后的数据存在本地Cookie
5. 客户端每次请求服务器端都携带本地加密后的session到服务器端，服务器端也能够通过公钥解密才算合法（也就是说这段数据必须是由密钥所加密的，而密钥只有服务器端有）
6. 如果服务器端无法解密客户端的数据或者客户端没有传送数据，服务器端会再次生成用私钥加密后的数据给客户端


