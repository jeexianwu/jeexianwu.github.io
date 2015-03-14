---
layout: default
title: 概率图模型简介
comments: true
categories: [ml]
published: false
---

## 概率图模型简介

2013-06-28 *主要翻译自PRML*

### 前言

在概率论、统计学及机器学习中，概率图模型是用图论方法以表现数个独立随机变量之关系的一种建模法。其图中的任一节点为随机变量，若两节点间无边相接则意味此二变量彼此条件独立。

概率在模式识别领域处于一个很核心的地位.在第一章我们已经注意到我们可以使用表达式的和或者积来描述概率.本书中所提到的不管多么复杂的学习算法，全都是这两种操作的不断组合重复.因此我们只通过纯粹的代数计算我们就可以设计和求解概率模型. 但是, 我们会发现使用图来表示概率分布会很大程度的方便我们的分析，我们把这种图示成为**概率图模型**. 它有一些很有用的特点：

1. 概率图模型提供一种可视化概率模型的简单途径，这种图示可以方便我们设计模型和激发灵感.<br/>
2. 从图上我们可以直观的研究图的各个属性，包括条件独立性等.<br/>
3. 某些复杂的计算可能需要在复杂的模型上进行推导和学习, 使用概率模型我们可以把这些计算转换成图的计算，这些计算在数学上是很直接的.<br/>

图是由顶点和边组成的,在概率图模型中,每个顶点代表一个（或一组）随机变量，边表示这些变量之间的概率关系. 这个图模型可以分解成多个联合分布之间的关系，而每个分布近依赖于自己的那部分子集的随机变量. 我们首先会探讨**贝叶斯网络**，也被称为有向图模型，即每个边都有一个方向箭头. 另一个主要的图模型是**马尔科夫随机场**, 也被成为无向图. 有向图主要用来描述随机变量之间的因果关系，而无向图更适合表达随机变量之间的软约束(与强关联对应). 不过为了解决推导问题, 通常会把有向图和无向图都转换成一种叫做**因子图**的图.


### 1.1 贝叶斯网络
---
我们首先来考虑一种最简单的联合分布$p(a, b, c)$，这个分布有三个我们任一假设的变量，我们暂时不用考虑他们是离散的还是连续的.事实上，概率图模型其中一个强大的作用是，可以用一个特定的图去表达某一大类的概率公式. 通过使用概率的乘积法则我们可以把$p(a,b,c)$描述为：

$$p(a,b,c) = p(c|a,b)p(a,b)$$

然后对右侧的$p(a,b)$再次使用乘积法则，整个公式就变成了:

$$p(a,b,c) = p(c|a,b)p(b|a)p(a)$$

需要注意的是，使用乘法规则做解构的方法有很多种，类似$p(c|a,b)$也可以解构为$p(a|c,b)$,每一种解构方法对应的概率图也是不同的，如果我们把依赖关系做一条有向边，上面的公式可以生成如下的概率图：

![](/images/math/6-28/1.png)

如果我们继续泛化上面的那个公式，我们可以得到如下的通用概率关系：

$$p(x_{1},...,x_{K}) = p(x_{K}|x_{1},...,x_{K-1}) ... p(x_{2}|x_{1})p(x_{1})$$

从图上和公式中我们可以看到每一个节点只依赖于它的父级节点，这让我们更容易分析一个分布中的逻辑关系.

我们再看一个从概率图转换回概率公式的例子：

![](/images/math/6-28/2.png)

这个概率图转换回公式就是：

$$p(x_{1})p(x_{2})p(x_{3})p(x_{4}|x_{1}, x_{2}, x_{3})p(x_{5}|x_{1}, x_{3})p(x_{6}|x_{4})p(x_{7}|x_{4}, x_{5})$$

通过上面的例子，我们可以把一个特定的概率图的公示表达描述为：

$$p(x) = \prod_{k=1}^{K} p(x_{k}|pa_{k})$$

其中$pa_{k}$表示$a_{k}$的所有父节点集合, $x$是指图中所有节点$x_{1}, x_{2} ... x_{k}$.

需要注意的是，概率图必须是有向五环图(DAG)，即不能循环，后面的节点不能又指回到前面.

#### 1.1.1 Example: 多项式回归(Polynomial regression)
---
首先我们来考虑一个例子：基于贝叶斯定理的多项式回归模型，使用这个例子来解释概率图模型的合理性。

在这个模型中，我们假设观察到的结果数据集为$t = (t_{1},t_{2} ... t_{N})^T$. 输入数据为$x=(x_{1},x_{2} ... x_{N})^T$, 还有噪声变量$\sigma$，容忍度参数$\alpha$，模型参数$w$. 现在，我们暂时只来考虑随机变量，不考虑确定的常量，在该模型中随机变量是输出$t$和参数$w$.这两个变量的联合分布如下：

$$p(t,w) = p(w)\prod_{n=1}^{N} p(t_{n}|w)$$

根据上面的概率图模型介绍，我们可以把这个模型画作概率图：

![](/images/math/6-28/3.png)

在继续引入其他参数之前，我们先介绍一种画复杂模型图的一个技巧. 如上图所示的$t$参数有很多，我们不可能把他们全部画出来，而且使用很多$...$号在图中也不直观 ，为了解决这个问题，我们可以把一个把$t$用蓝色边框包裹起来，注明$N$表示一共有N个变量：

![](/images/math/6-28/4.png)

下面，我们把刚才忽略掉的常量引进来：

$$p(t, w|x,\alpha , \sigma^2) = p(w|\alpha)\prod_{n=1}{N}p(t_{n}|w, x_{n}, \sigma^2)$$

概率图模型就转换为了：

![](/images/math/6-28/5.png)

当我们在机器学习或模式识别中使用图模型时，我们常常需要把一些值随机变量作为观察对象以训练模型，如上面的$t$参数就是随机变量，但是我们对它进行了观察，并标记为$t_{n}$, 这样才好推算出模型参数$w$.在这种情况下，我们需要在图模型中把该变量标注成不同的颜色，比如蓝色：

![](/images/math/6-28/6.png)

通常来说，我们的最终目的都是针对一组新的输入$\hat{x}$预测其输出结果$\hat{t}$的分布，这个新的$\hat{t}$依赖于我们的训练数据得出的$t$和$w$:

![](/images/math/6-28/7.png)

#### 1.1.2 Generative models



### 马尔科夫随机场
---
We have seen that directed graphical models specify a factorization of the joint dis- tribution over a set of variables into a product of local conditional distributions. They also define a set of conditional independence properties that must be satisfied by any distribution that factorizes according to the graph. We turn now to the second ma- jor class of graphical models that are described by undirected graphs and that again specify both a factorization and a set of conditional independence relations.

我们已经看到有向图模型可以通过因子分解把联合分布转换成一组局部条件分布的积. 

A Markov random field, also known as a Markov network or an undirected graphical model (Kindermann and Snell, 1980), has a set of nodes each of which corresponds to a variable or group of variables, as well as a set of links each of which connects a pair of nodes. The links are undirected, that is they do not carry arrows. In the case of undirected graphs, it is convenient to begin with a discussion of conditional independence properties.








