---
layout: default
title: 使用微积分求面积
comments: true
categories: [math, ml]
---

## 使用微积分求解函数面积
隐约记得是高中数学中的知识，请教了老婆大人才想起来怎么算，看来不用真的会生锈，今天践行一下烂笔头精神，写下来先。

求解 $$\int_{0}^{\frac {\pi }{2}}sin(x)dx$$

上面的公式代表下图灰色部分的面积：

![sinxdx](/images/math/1-27/sinxdx.png)

第一步是找到$$sin(x)$$的积分原函数：$$F(x)=−cos(x)+C$$，即：

$$F′(X)=(−cos(x)+C)′=six(x)$$

然后把需要求解的积分式转换成：

$$F(\frac {\pi}{2}) - F(0)$$

获得答案：

![sinxdx](/images/math/1-27/sinxdx_result.png)


