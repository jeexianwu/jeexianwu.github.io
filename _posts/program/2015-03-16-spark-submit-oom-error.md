## Spark submit application with "java.lang.OutOfMemoryError: Java heap space" ##

### 1.问题描述
今天在spark集群上提交APP，脚本命令如下：

`bin/spark-submit --master spark://cloud1:7077 app.py hdfs://cloud1:8020/user/hive/warehouse/log.db/dt=201502 3`

运行后，报"java.lang.OutOfMemoryError: Java heap space"错误


### 2.问题解决
查看log后，将命令修改为：

`bin/spark-submit --master spark://cloud1:7077 --executor-memory 20g app.py hdfs://cloud1:8020/user/hive/warehouse/log.db/dt=201502 3`

提交后，依然报相同错误，仔细分析了一下，数据总共才6G，而且app.py中没有使用很大的存储对象，应该不会**OOM**,那是什么原因呢？

任务就两个过程：

- 提交 (`default: driver-memory=512m`)

- 执行 (`default: executor-memory=512m`)

上面已经修改过executor-memory, 那**OOM**的问题应该是driver引起的，遂修改命令如下：

`bin/spark-submit --master spark://cloud1:7077 --driver-memory 20g --executor-memory 20g app.py hdfs://cloud1:8020/user/hive/warehouse/log.db/dt=201502 3`


提交后app正常执行完成，这个问题是读hive中大表(数据较大)引起的。
 
