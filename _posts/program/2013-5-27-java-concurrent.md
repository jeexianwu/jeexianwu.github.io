---
layout: default
title: 有关Java并发编程的热门话题
comments: true
categories: [program]
---
## 有关Java并发编程的热门话题

2013-5-27

### 前言
---
目前讨论Java并发编程的文章、资料已经相当多了，所以我打算换个思路来总结整理Java并发编程的核心，我期望能通过几个核心的Java关键字入手，把一堆互相依赖的知识点串成知识链。当然，小弟大多数看法都来自于互联网和自己的二次理解，难免疏漏和错误，拜求指正！

**连载中...**

### 大纲
---
初步计划从下面几个点入手分别解释，长期更新：

1. [指令重排序](#1)<br/>
2. [volatile关键字](#2)<br/>
3. [CAS无锁编程](#3)<br/>
4. 双Buffer切换<br/>

---

<a id="1">&nbsp;</a>
### 1. 指令重排序
---
#### 1.1 一窥重排序

先看一段很著名的双检查锁的代码：

{% highlight java %}
class DB {
  private DB(){}
  private static DB instance;

  public static DB getInstance() {
    // First check
    if(instance == null ){
      synchronized(DB.class){
        // Second check
        if(instance == null) {
          instance = new Instance();
        }
      }
    }
    return instance;
  }
}
{% endhighlight %}

这段代码在Java中是失效的，即不能实现单例模式，为什么呢？我们其实可以把`intance = new Instance()`拆开来看一下:

    mem = allocateMemory()  // 分类内存空间
    construct(mem)          // 构造实例的内容
    instance = mem          // 赋值给instance

上面是我们期待的过程，然后遗憾的是，上面的过程并不能被保证，因为JVM在执行指令的时候是可以根据需要对指令进行重新排序，也就是说上面的顺序可能变为：

    mem = allocateMemory()  // 分类内存空间
    instance = mem          // 赋值给instance
    construct(mem)          // 构造实例的内容

即可能在还没有构造好DB的时候，就把它的引用返回，如果这时候第二个线程进行了调用，就有可能出问题了。这就是指令重排序会造成的问题，解决方案可以参考[这篇文章](http://www.cs.umd.edu/~pugh/java/memoryModel/DoubleCheckedLocking.html)，非常详细。


#### 1.2 诡异的重排序

假设我们有下面的哈希程序，其中`hash`是类的实例变量（为了简单起见，我们把计算哈希的过程直接置为1）：

{% highlight java %}
  public int hashCode() {
      if (hash == 0) { hash = 1; }
    return hash;
}
{% endhighlight %}

这段代码转换成字节码如下所示：

    public int hashCode();
       0: aload_0                           //read this
       1: getfield      #6                  //read hash (r1)
       4: ifne          12                  //compare r1 with 0
       7: aload_0                           //read this
       8: iconst_1                          //constant 1
       9: putfield      #6                  //put 1 into hash (w1)
      12: aload_0                           //read this
      13: getfield      #6                  //read hash (r2)
      16: ireturn                           //return r2

**在单线程情况下，上面的程序不会有任何问题，JVM可以保证reorder在单线程上语义总是相同的.**

然而在多线程情况下，JVM的reorder可能会从语义上改变原程序的意思,JVM的reorder具体如何更改程序的指令执行顺序是根据实际情况确定的，我们可以预先知道的就是reorder之后多线程情况下程序的语义可能会改变。

同时我们要注意到有两次对共享变量`hash`的读操作，如果做了reorder，字节码的13行从语义上就有可能被提到第1行之前执行，这里要特别注意的是，如果13行提到了第一行前面执行，那么也就是返回值所在的寄存器r2会被先读进去，这样不管后面在对hash做任何操作，r2总是确定的，即可能返回0。

如果不做reorder，程序最坏的情况只会是“良性数据竞争”，而不会出现返回0的情况。

从语义上来说，原程序就会变成**类似**如下的代码(未必一定是这种，只是可能出现这种单线程与多线程表现不同的代码)：

{% highlight java %}
  public int hashCode() {
    int r2 = hash;                  // read hash (r2)  line #13
    if (hash != 0) return r2;       // return (r2)     line #16
    return (hash = 1);              // put 1 into hash line #9
  }
{% endhighlight %}

这段代码在单线程的情况下，执行结果跟原程序是一样的（符合reorder的定义），但是在多线程的情况下，就可能存在return为0的情况（这是不允许的）.

那么我们再考虑类似的一段代码：

{% highlight java %}
  public int hashCode() {
      int h = hash;
      if (h == 0) { hash = h = 1; }
      return h;
  }
{% endhighlight %}

这段代码比之前的`hashCode`只是增加了一个局部变量`h`，它的字节码如下所示：

    public int hashCode();
       0: aload_0                           //read this
       1: getfield      #6                  //read hash (r1)
       4: istore_1                     //store r1 in local variable h
       5: iload_1                           //read h
       6: ifne          16                  //compare h with 0
       9: aload_0                           //read this
      10: iconst_1                          //constant 1
      11: dup                               //constant again
      12: istore_1                          //store 1 into h
      13: putfield      #6                  //store 1 into hash (w1)
      16: iload_1                           //read h
      17: ireturn                           //return h

我们可以看到这次对`hash`的`read`操作从两次变成了一次，两次对共享变量的的`read`操作很可能导致同步问题，但只有一次对共享变量的读就安全很多了，其余的操作都是在局部变量`h`上的操作，**Java内存模型对局部变量做了特殊的保障，所有的局部变量操作不管如何reorder都要保证外部看到的结果是一致的**，所以return的`h`一定是确定可靠的。

#### 1.3 结论

那么总结起来，了解了重排序，我们在编写程序的时候要注意以下问题：

1. 编写多线程程序的时候，尽量少使用共享变量;<br/>
2. 如果需要用到共享变量，要考虑是不是良性数据竞争(Benign data race)，如果是的话可以不必用加锁等方式同步;<br/>
3. 如果不能很好的理解reorder造成的影响，那么尽量使用其他同步手段; <br/>

#### 1.4 参考资料

* [Benign data races in Java](http://jeremymanson.blogspot.hk/2008/12/benign-data-races-in-java.html)<br/>
* [Instructions reordering in Java JVM](http://stackoverflow.com/questions/12554570/instructions-reordering-in-java-jvm/12554626?noredirect=1#comment24240714_12554626)<br/>

<hr>
<a id="2">&nbsp;</a>
### 2. volatile关键字
---
`volatile`本意是“易变的变量”，就是说我一个变量定义为了`volatile`之后，JVM就要小心点，不要随便用，也不要上来就优化，什么意思呢？可以解释成下面两个意思：

#### 2.1 简要介绍
---

1. `volatile`提供线程可见性，即当线程A修改了该变量之后，线程B已经load到的该变量就立即失效需要重新读取.<br/>
2. `votatile`同时提供一个内存屏障，防止当前变量的读写操作被不安全的`reorder`.<br/>

需要特别注意的是：

1. 线程可见性不代表具有原子性.<br/>
2. 具有内存屏障不代表不能`reorder`，只是只能进行有限的`reorder`<br/>
3. `volatile`的完全支持是在JDK1.5之后的版本，之前的版本支持粒度不够.


#### 2.2 线程可见性
---
这个比较简单易懂，即当线程A修改了某公共变量`v`之后, 会通知其他读取了`v`的线程重新load变量`v`，并且在CPU底层变量`v`的值也不会被`cache`，每次使用都会直接从内存中读取，所以这个特性会导致它的性能比较低。

那既然一个线程修改了另一个线程马上可以看到，我们可以用volatile来实现`i++`的多线程操作么？

答案是否定的，因为我们知道`i++`实际上是三个操作的组合：

    load i  // 从内存读取i到栈内
    inc i   // 对i自增操作
    save i  // 写回到内存

而实现多线程同步不仅仅要求内存可见性，还要求互斥性，volatile只满足了其一，所以对于多个操作不能实现原子化。

#### 2.3 限制reorder
---
比如我们有类似第一节双检查锁中构造数据库单例的代码：

{% highlight java %}
public class Test {
    private Object o;

    public Test() {
        this.o = new Object();
    }

    private volatile static Test t;

    public static void createInstance() {
        t = new Test();
    }

    public static void main(String[] args) throws Exception {
        Test.createInstance();
    }
}

{% endhighlight %}
我们用`javap -c Test`反编译上面的代码看一下字节码：

    public Test();
      Code:
       0: aload_0
       1: invokespecial #1; //Method java/lang/Object."<init>":()V
       4: aload_0
       5: new #2; //class java/lang/Object
       8: dup
       9: invokespecial #1; //Method java/lang/Object."<init>":()V
       12:  putfield  #3; //Field o:Ljava/lang/Object;
       15:  return

    public static void createInstance();
      Code:
       0: new #4; //class Test
       3: dup
       4: invokespecial #5; //Method "<init>":()V
       7: putstatic #6; //Field t:LTest;
       10:  return

    public static void main(java.lang.String[])   throws java.lang.Exception;
      Code:
       0: invokestatic  #7; //Method createInstance:()V
       3: return

    }

我们看第 #4,#5 和 #6, 他们的含义分别是：

    #4 分配Test类的内存空间
    #5 构造Test类
    #6 将Test类的引用赋值给静态域

**如果是单线程程序**，上面的过程不会有什么问题，因为JVM会保证他们按照我们定义的语义去执行。

但**如果是多线程程序，JVM的reorder会导致语义上的变化**,即如果没有volatile的话，#6可以和#5互换位置(语义上的互换，实际上的执行过程由JVM当时的情况决定)，这可能在多线程情况下导致Test没有构造完成就被返回了。

但我们现在有了volatile(并不会在字节码中体现出来，**volatile的标志存在于静态域本身**)，可以保证变量`t`的读操作(#6)和之前的操作之间会被插入一个内存屏障(memory barrier)，这个内存屏障从语义上杜绝了#6被提前到#5之前，也就是说JVM需要保证执行#6的时候前面的操作一定要完成。

而对#6之前的代码，事实上也是可以继续进行reorder的，所以我们称之为限制了reorder而不是杜绝。

#### 2.4 参考资料
---
1. [Java volatile decompile](http://stackoverflow.com/questions/16898367/how-to-decompile-volatile-variable-in-java)<br/>
2. [正确使用volatile](http://www.ibm.com/developerworks/cn/java/j-jtp06197.html)

<hr>
<a id="3">&nbsp;</a>
### 3. CAS无锁编程
---
#### 3.1 AtomInteger代码片断

{% highlight java %}
  private volatile int value;
/**
     * Atomically increments by one the current value.
     *
     * @return the updated value
     */
    public final int incrementAndGet() {
        for (;;) {
            int current = get();  // 获得valatile的value值
            int next = current + 1;
            if (compareAndSet(current, next))
                return next;
        }
    }
{% endhighlight %}

上面这段代码给出了AtomInteger的实现，即不断的设置当前int值，直到设置成功为止，这种操作没有使用锁即可实现原子操作，在某些情况下效率非常高。

**CAS的优点:**

1. 无锁竞争，很大程度提高程序的并发性.<br/>
2. 不会出现死锁等情况.<br/>
3. CPU级别的原语支持，性能有保障.<br/>

**ABA问题:**

CAS的原理是:

1. 第一次先读取变量`v`的值.<br/>
2. 对`v`进行修改并将修改后的结果存入`v'`.<br/>
3. 使用CAS原语判断内存中最新的`v`与第一次读到的`v`是否相等，相等则写入新值，不等则重新从第一步开始.<br/>

上面的过程用在`increaseAndGet`之类的递增程序是没有问题的，但是如果是随即的写数据，就有可能出现ABA问题，即如果另一个线程B修改了`v`的值，按理说当前线程是不能写入的，但是再当前A线程CAS判断之前，又有一个线程C把`v`的值恢复到了原值，那么A线程的数据就可能被写入，虽然这在程序上看起来没什么问题，但实际上B线程的操作相当于被抹去了，语义上是有问题的。

为了解决ABA问题，JDK提供了类似`AtomicStampedReference`的带有`stamp`的原子操作类，但性能肯定要低不少，所以用锁还是用CAS，有时候也是要斟酌一下。

#### 3.2 参考资料
---
1. [多核线程笔记-volatile原理与技巧](http://www.iteye.com/topic/109150)
2. [Advantages & Disadvantages of CAS](http://stackoverflow.com/questions/16899686/advantages-and-disadvantages-of-cas-programming)

<hr>
### 4. 双Buffer切换
---










