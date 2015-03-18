---
layout: default
title: spark-submit oom
comments: true
categories: [program]
---

## Spark RDD saveAsTextFile在保存成本地文件时一直为空，只有大小为0的_SUCCESS文件 ##

### 1.问题描述
在使用spark RDD Action之中的saveAsTextFile序列化RDD到本地磁盘时，一直得不到预想结果，生成的目录里只有一个_SUCCESS文件，没有数据文件，使用的命令如下（pyspark-shell）：

	li = sc.parallelize([1,2,3])
	li.coalesce(1).saveAsTextFile("file:///tmp/123")

然后去本地的`/tmp/123`下，发现只有_SUCCESS文件，关于上面命令的第二行我又试了几种：

	li.coalesce(1).saveAsTextFile("/tmp/123")
	li.coalesce(1).saveAsTextFile("file:////tmp/123")

结果都一样，仍然没有文件数据。


### 2.问题解决
既然本地文件系统有问题，那咱试试HDFS怎么样：

	li = sc.parallelize([1,2,3])
	li.coalesce(1).saveAsTextFile("hdfs://cloud1:8020/tmp/123")

然后使用：

	[bd@cloud1 ~]$ hadoop fs -ls /tmp/123
	Found 2 items
	-rw-r--r--   3 bd supergroup          0 2015-03-17 17:24 /tmp/123/_SUCCESS
	-rw-r--r--   3 bd supergroup          6 2015-03-17 17:24 /tmp/123/part-00000
	---
	[datadev@cloud1 ~]$ hadoop fs -cat /tmp/123/part-00000
	1
	2
	3

看到没，HDFS一点问题没有，说明spark环境和RDD操作没有问题，那问题会不会是因为分布式呢，去看下worker上对应的目录/tmp下是否有123文件夹，果然每台worker机器的/tmp/123下都有数据文件)
	
所以saveAsTextFile in local file system本身并没有问题，只是它将RDD序列化到每个worker的本地目录下，而不是在driver上。
 
