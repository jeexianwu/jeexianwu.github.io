---
layout: default
title: 如何设计一个秒杀系统
comments: true
categories: [program]
---

## 如何设计一个秒杀系统
清明节出去玩的时候接到一个淘宝的面试，只问了我这么一个问题，由于当时在西湖边上正火热的拍照....答得真是一塌糊涂，现在到家了得好好思考一下这个问题。

### 一、题目

1, 这是一个秒杀系统，即大量用户抢有限的商品，先到先得

2, 用户并发访问流量非常大, 需要分布式的机器集群处理请求

3, 系统实现使用Java

### 二、模块设计

1, 用户请求分发模块：使用Nginx或Apache将用户的请求分发到不同的机器上。

2, 用户请求预处理模块：判断商品是不是还有剩余来决定是不是要处理该请求。

3, 用户请求处理模块：把通过预处理的请求封装成事务提交给数据库，并返回是否成功。

4, 数据库接口模块：该模块是数据库的唯一接口，负责与数据库交互，提供RPC接口供查询是否秒杀结束、剩余数量等信息。

第一部分就不多说了，配置HTTP服务器即可，这里主要谈谈后面的模块。


#### 用户请求预处理模块
经过HTTP服务器的分发后，单个服务器的负载相对低了一些，但总量依然可能很大，如果后台商品已经被秒杀完毕，那么直接给后来的请求返回秒杀失败即可，不必再进一步发送事务了，示例代码可以如下所示：

{% highlight java %}
package seckill;
import org.apache.http.HttpRequest;
/**
 * 预处理阶段，把不必要的请求直接驳回，必要的请求添加到队列中进入下一阶段.
 */
public class PreProcessor {
    // 商品是否还有剩余
    private static boolean reminds = true;
    private static void forbidden() {
        // Do something.
    }
    public static boolean checkReminds() {
        if (reminds) {
            // 远程检测是否还有剩余，该RPC接口应由数据库服务器提供，不必完全严格检查.
            if (!RPC.checkReminds()) {
                reminds = false;
            }
        }
        return reminds;
    }
    /**
     * 每一个HTTP请求都要经过该预处理.
     */
    public static void preProcess(HttpRequest request) {
        if (checkReminds()) {
            // 一个并发的队列
            RequestQueue.queue.add(request);
        } else {
            // 如果已经没有商品了，则直接驳回请求即可.
            forbidden();
        }
    }
}
{% endhighlight %}


#### 并发队列的选择
Java的并发包提供了三个常用的并发队列实现，分别是：ConcurrentLinkedQueue 、 LinkedBlockingQueue 和 ArrayBlockingQueue。

ArrayBlockingQueue是初始容量固定的阻塞队列，我们可以用来作为数据库模块成功竞拍的队列，比如有10个商品，那么我们就设定一个10大小的数组队列。

ConcurrentLinkedQueue使用的是CAS原语无锁队列实现，是一个异步队列，入队的速度很快，出队进行了加锁，性能稍慢。

LinkedBlockingQueue也是阻塞的队列，入队和出队都用了加锁，当队空的时候线程会暂时阻塞。

由于我们的系统入队需求要远大于出队需求，一般不会出现队空的情况，所以我们可以选择ConcurrentLinkedQueue来作为我们的请求队列实现：

{% highlight java %}
package seckill;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ConcurrentLinkedQueue;
import org.apache.http.HttpRequest;
public class RequestQueue {
    public static ConcurrentLinkedQueue<HttpRequest> queue =
            new ConcurrentLinkedQueue<HttpRequest>();
}
{% endhighlight %}

#### 用户请求模块
{% highlight java %}
package seckill;
import org.apache.http.HttpRequest;
public class Processor {
    /**
     * 发送秒杀事务到数据库队列.
     */
    public static void kill(BidInfo info) {
        DB.bids.add(info);
    }
    public static void process() {
        BidInfo info = new BidInfo(RequestQueue.queue.poll());
        if (info != null) {
            kill(info);
        }
    }
}
class BidInfo {
    BidInfo(HttpRequest request) {
        // Do something.
    }
}
{% endhighlight %}

#### 数据库模块
数据库主要是使用一个`ArrayBlockingQueue`来暂存有可能成功的用户请求。

{% highlight java %}
package seckill;
import java.util.concurrent.ArrayBlockingQueue;
/**
 * DB应该是数据库的唯一接口.
 */
public class DB {
    public static int count = 10;
    public static ArrayBlockingQueue<BidInfo> bids = new ArrayBlockingQueue<BidInfo>(10);
    public static boolean checkReminds() {
        // TODO
        return true;
    }
    // 单线程操作
    public static void bid() {
        BidInfo info = bids.poll();
        while (count-- > 0) {
            // insert into table Bids values(item_id, user_id, bid_date, other)
            // select count(id) from Bids where item_id = ?
            // 如果数据库商品数量大约总数，则标志秒杀已完成，设置标志位reminds = false.
            info = bids.poll();
        }
    }
}
{% endhighlight %}

### 三、结语
看起来大体这样应该就可以了，当然还有细节可以优化，比如数据库请求可以都做成异步的等等。

目前还不确定设计是不是合理，希望高人指导。
