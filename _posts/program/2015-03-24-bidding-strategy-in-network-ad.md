---
layout: default
title: 互联网广告实时竞价中竞价策略
comments: true
categories: [product]
---

### 1.首先明确一下概念

> 什么是竞价策略？

竞价策略其实是对一次竞价请求做出出价响应时所考虑和使用的因素。比如，有些出价策略会考虑CTR，用户-广告相关性等，有的在根据设备、浏览器、地理位置以及一天中的时段等实时信息来细化CTR模型以便调整出价，有些出价策略还会根据再营销列表中是否包含相应用户来自动调整出价。

### 2.竞价策略的主要内容

#### 2.1 出价策略

**1.** 方式

- CPC ： 按点击出价， 需要广告主设置一个float值
 
	每次点击的最高出价：**广告主愿意为每次点击支付的最高费用**，实际扣费不会高于此价格； 出价越高，获得的展示机会就越大。

- CPM ： 按展示/曝光出价， 需要广告主设置一个float值

	每千次展示最高出价：**广告主愿意为每千次展示支付的最高费用**，实际扣费不会高于此价格;您出价越高，获得的展示机会就越大。

- CR ： 按转化出价， 需要广告主设置一个float值

	每次转化的最高出价：**广告主愿意为每次转化支付的最高费用**，实际扣费不会高于此价格;您出价越高，获得的展示机会就越大。
	(注意，这个需要先关联转化定义，一般是要获得广告主针对该dsp平台发出的竞价形成的点击是否构成转化的反馈)

**2.** 与模型的联系

上面的出价方式最终都是映射到出价模型上，即：每次出价

<img src="http://latex.codecogs.com/png.latex? BidPrice = BasePrice*(\frac{CTR'}{BaseCTR})^{\lambda}">
 (1)

不同的出价方式映射到上式中的BasePrice，对应关系可以是：

- <img src="http://latex.codecogs.com/png.latex? BasePrice = CPC*{CTR}'">

- <img src="http://latex.codecogs.com/png.latex? BasePrice = CPM/1000">

- <img src="http://latex.codecogs.com/png.latex? BasePrice = CR/({CR}'*{CTR}')">，这里的CR'需要先估算

以上只是参考，映射公式中还可以加入其它因素，比方说定向筛选条件下的CTR'等。


#### 2.2 投放策略

- **展示优先**

	这个投放策略不考虑当日的预算消耗，只要一个请求满足竞价需求就进行竞价进而获得展示，直到广告预算消费完才停止竞价；
	
	如果将此方式扩展，可以衍生成“**曝光优先**”，此时出价模型中可能不考虑CTR'了，直接用:

	<img src="http://latex.codecogs.com/png.latex? Similarity(user, ad)*CPM/1000"> 

- **均匀消费**

	这个投放策略会均匀展示广告，系统会在设置的投放时间内根据预算，平均将预算分配到每一个时间段内进行展示，当该时间段广告费用花完了，广告停止竞价，直到下一个时间段重新竞价展示广告；
	
	如果将此方式扩展，可以衍生成“**效果优先**”，此时出价模型中除了使用CTR'外，还可能用到用户-广告相似度Similarity(user, ad)，将该因素加入到（1）式的训练中来确定参数lambda

----------