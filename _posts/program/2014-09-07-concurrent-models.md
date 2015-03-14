---
layout: default
title: 并发编程：Actors模型和CSP模型
categories: [program]
published: true
---

# 并发编程：Actors模型和CSP模型
-----------------

## 目录

* [一、前言](#1)
* [二、Actors模型](#2)
* [三、CSP(Communicating Sequential Process)模型](#3)
* [四、区别](#4)
* [五、参考文档](#5)

<a id="1">&nbsp;</a>

### 一、前言

不同的编程模型与具体的语言无关，大部分现代语言都可以通过巧妙地结构处理实现不同的模型.杂谈的意思是很杂，想到哪儿写到哪儿，不对正确性负责 :D.

<a id="2">&nbsp;</a>

### 二、Actors模型

传统的并发模型主要由两种实现的形式，一是同一个进程下，多个线程天然的共享内存，由程序对读写做同步控制(有锁或无锁). 二是多个进程通过进程间通讯或者内存映射实现数据的同步.

Actors模型更多的使用消息机制来实现并发，目标是让开发者不再考虑线程这种东西，**每个Actor最多同时只能进行一样工作，Actor内部可以有自己的变量和数据**.

Actors模型避免了由操作系统进行任务调度的问题，在操作系统进程之上，多个Actor可能运行在同一个进程(或线程)中.这就节省了大量的Context切换.

在Actors模型中，每个Actor都有一个专属的命名"邮箱", 其他Actor可以随时选择一个Actor通过邮箱收发数据,对于“邮箱”的维护，通常是使用发布订阅的机制实现的，比如我们可以定义发布者是自己，订阅者可以是某个Socket接口，另外的消息总线或者直接是目标Actor.

目前akka库是比较流行的Actors编程模型实现，支持Scala和Java语言.

<a id="3">&nbsp;</a>

### 三、CSP模型

CSP(Communicating Sequential Process)模型提供一种多个进程公用的“管道(channel)”, 这个channel中存放的是一个个"任务".

目前正流行的go语言中的goroutine就是参考的CSP模型，原始的CSP中channel里的任务都是立即执行的，而go语言为其增加了一个缓存，即任务可以先暂存起来，等待执行进程准备好了再逐个按顺序执行.

<a id="4">&nbsp;</a>

### 四、CSP和Actor的区别

- CSP进程通常是同步的(即任务被推送进Channel就立即执行，如果任务执行的线程正忙，则发送者就暂时无法推送新任务)，Actor进程通常是异步的(消息传递给Actor后并不一定马上执行).
- CSP中的Channel通常是匿名的, 即任务放进Channel之后你并不需要知道是哪个Channel在执行任务，而Actor是有“身份”的，你可以明确的知道哪个Actor在执行任务.
- 在CSP中，我们只能通过Channel在任务间传递消息, 在Actor中我们可以直接从一个Actor往另一个Actor传输数据.
- CSP中消息的交互是同步的，Actor中支持异步的消息交互.

<a id="5">&nbsp;</a>

### 五、参考文档

* [Scala中的actors和Go中的goroutines对比](http://stackoverflow.com/questions/22621514/is-scalas-actors-similar-to-gos-coroutines)
* [CSP Model From Wiki](http://en.wikipedia.org/wiki/Communicating_sequential_processes#Comparison_with_the_Actor_Model)