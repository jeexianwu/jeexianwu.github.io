---
layout: default
title: 使用eclipse搭建spark开发环境
comments: true
categories: [program]
---

## Requires

1. [eclipse](http://www.eclipse.org/downloads/), 我下的是发行版luna

2. [scala for eclipse plugin](http://download.scala-ide.org/sdk/lithium/e44/scala211/stable/site) 这个在后面会用到

3. [spark pre-built or spark source (built by yourself later)](https://spark.apache.org/downloads.html) 我下载的是spark-1.2.1-bin-hadoop2.4.tgz

> 注： 前提是你已经安装了jdk，并配置好了相关环境变量，因为scala的运行也是基于jvm的。



## Ready go
- Launch eclipse, open "Help" --> "Install New Software"，在"Work with:"框中输入：


	`http://download.scala-ide.org/sdk/lithium/e44/scala211/stable/site`

	然后就是一步步安装，可以看到我这里安装的scala版本是2.11.X

- 上面完成后，重启eclipse，选择scala开发视图，新建Scala Project, 然后将spark-1.2.1-bin-hadoop2.4.tgz解压后的lib/spark-assembly-1.2.1-hadoop2.4.0.jar加入到Build Path


## 遇到的问题

### “more than one scala library found in the build path eclipse”

这个问题是说有两个scala库在path中被发现，造成这个的原因是spark-assembly-1.2.1-hadoop2.4.0.jar里已经包含了scala库，而刚刚在eclipse中安装的scala插件也包含一份scala库，如果这两个库版本是一致的，你也可以忽略这个警告或者错误；

我这里两个版本号不一致，spark-assembly-1.2.1-hadoop2.4.0.jar里的scala是2.10.x，后者是2.11.x；因为该开发环境不单单是为了spark，所以，我果断删除了spark-assembly-1.2.1-hadoop2.4.0.jar中相关的scala库，问题得以解决，可是这样又出现了其他问题，见下

### “java.lang.ClassNotFoundException: scala.collection.GenTraversableOnce$class”

在该scala project中建包com.ibignew.scala.study, 然后创建scala object “WordCount”,代码如下：
    
    import org.apache.spark._
    import SparkContext._
    
    object WordCount {
      def main(args: Array[String]) {
    if (args.length != 2 ){
      println("usage is com.ibignew.scala.study.WordCount <input> <output>")
      return
    }
    
    val conf = new SparkConf().setMaster("local[1]").setAppName("SparkDebugExample")

    val sc = new SparkContext(conf)
    val textFile = sc.textFile(args(0))

    val result = textFile.flatMap(line => line.split("\\s+")).map(word => (word, 1)).reduceByKey(_ + _)

    result.saveAsTextFile(args(1))
      }
    }

Run Congratulation，as Scala Application, 并配置好输入输出目录，run……，接着就报错“java.lang.ClassNotFoundException: scala.collection.GenTraversableOnce$class”，后google，在[stackoverflow的这个issue](http://stackoverflow.com/questions/26351338/running-spark-scala-example-fails)告诉我是因为我使用使用的scala的版本太高了（这个是由于前面我选择了保留最新的2.11.x而删除了assembly中的scala造成的），退回到2.10.x后，问题解决。

## 总结

spark与scala的版本一定要对应，最好使用assembly里的scala版本。