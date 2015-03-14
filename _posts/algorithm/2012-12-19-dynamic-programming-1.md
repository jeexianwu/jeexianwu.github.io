---
layout: default
title: 常用算法设计思想之一：动态规划算法
comments: true
categories: [algorithm]
---

## 常用算法设计思想之一：动态规划算法
发布日期：2012-12-19

常用的算法设计思想主要有动态规划、贪婪法、随机化算法、回溯法等等，这些思想有重叠的部分，当面对一个问题的时候，从这几个思路入手往往都能得到一个还不错的答案。

本来想把动态规划单独拿出来写三篇文章呢，后来发现自己学疏才浅，实在是只能讲一些皮毛，更深入的东西尝试构思了几次，也没有什么进展，打算每种设计思想就写一篇吧。


动态规划（Dynamic Programming）是一种非常有用的用来解决复杂问题的算法，它通过把复杂问题分解为简单的子问题的方式来获得最优解。

### 一、自顶向下和自底向上
---
总体上来说，我们可以把动态规划的解法分为自顶向下和自底向上两种方式。

一个问题如果可以使用动态规划来解决，那么它必须具有“最优子结构”，简单来说就是，如果该问题可以被分解为多个子问题，并且这些子问题有最优解，那这个问题才可以使用动态规划。

#### 自顶向下（Top-Down）
自顶向下的方式其实就是使用递归来求解子问题，最终解只需要调用递归式，子问题逐步往下层递归的求解。我们可以使用缓存把每次求解出来的子问题缓存起来，下次调用的时候就不必再递归计算了。

举例著名的斐波那契数列的计算：

{% highlight python %}
#!/usr/bin/env python
# coding:utf-8
def fib(number):
    if number == 0 or number == 1:
        return 1
    else:
        return fib(number - 1) + fib(number - 2)
if __name__ == '__main__':
    print fib(35)
{% endhighlight %}

有一点开发经验的人就能看出，fib(number-1)和fib(number-2)会导致我们产生大量的重复计算，以上程序执行了14s才出结果，现在，我们把每次计算出来的结果保存下来，下一次需要计算的时候直接取缓存，看看结果：

{% highlight python %}
#!/usr/bin/env python
# coding:utf-8
cache = {}
def fib(number):
    if number in cache:
        return cache[number]
    if number == 0 or number == 1:
        return 1
    else:
        cache[number] = fib(number - 1) + fib(number - 2)
        return cache[number]
if __name__ == '__main__':
    print fib(35)
{% endhighlight %}

耗费时间为 0m0.053s 效果提升非常明显。

#### 自底向上（Bottom-Up）
自底向上是另一种求解动态规划问题的方法，它不使用递归式，而是直接使用循环来计算所有可能的结果，往上层逐渐累加子问题的解。

我们在求解子问题的最优解的同时，也相当于是在求解整个问题的最优解。其中最难的部分是找到求解最终问题的递归关系式，或者说状态转移方程。

这里举一个01背包问题的例子：

你现在想买一大堆算法书，需要很多钱，所以你打算去抢一个商店，这个商店一共有n个商品。问题在于，你只能最多拿 W kg 的东西。$w_{i}$和$v_{i}$分别表示第i个商品的重量和价值。我们的目标就是在能拿的下的情况下，获得最大价值，求解哪些物品可以放进背包。对于每一个商品你有两个选择：拿或者不拿。

首先我们要做的就是要找到“子问题”是什么，我们发现，每次背包新装进一个物品，就可以把剩余的承重能力作为一个新的背包来求解，一直递推到承重为0的背包问题：

作为一个聪明的贼，你用 $m\[i,w\]$表示偷到商品的总价值，其中i表示一共多少个商品，w表示总重量，所以求解$m\[i,w\]$就是我们的子问题，那么你看到某一个商品i的时候，如何决定是不是要装进背包，有以下几点考虑：

1. 该物品的重量大于背包的总重量，不考虑，换下一个商品；<br/>
2. 该商品的重量小于背包的总重量，那么我们尝试把它装进去，如果装不下就把其他东西换出来，看看装进去后的总价值是不是更高了，否则还是按照之前的装法；<br/>
3. 极端情况，所有的物品都装不下或者背包的承重能力为0，那么总价值都是0；<br/>

由以上的分析，我们可以得出$m\[i,w\]$的状态转移方程为：

![](/images/algorithm/12-19/stat.png)

有了状态转移方程，那么写起代码来就非常简单了，首先看一下自顶向下的递归方式，比较容易理解：

{% highlight python%}
#!/usr/bin/env python
# coding:utf-8
cache = {}
items = range(0,9)
weights = [10,1,5,9,10,7,3,12,5]
values = [10,20,30,15,40,6,9,12,18]
# 最大承重能力
W = 4
def m(i,w):
    if str(i)+','+str(w) in cache:
        return cache[str(i)+','+str(w)]
    result = 0
    # 特殊情况
    if i == 0 or w == 0:
        return 0
    # w < w[i]
    if w < weights[i]:
        result = m(i-1,w)
    # w >= w[i]
    if w >= weights[i]:
        # 把第i个物品放入背包后的总价值
        take_it = m(i-1,w - weights[i]) + values[i]
        # 不把第i个物品放入背包的总价值
        ignore_it = m(i-1,w)
        # 哪个策略总价值高用哪个
        result = max(take_it,ignore_it)
        if take_it > ignore_it:
            print 'take ',i
        else:
            print 'did not take',i
    cache[str(i)+','+str(w)] = result
    return result
if __name__ == '__main__':
    # 背包把所有东西都能装进去做假设开始
    print m(len(items)-1,W)
{% endhighlight %}

改造成非递归，即循环的方式，从底向上求解：

{% highlight python %}
#!/usr/bin/env python
# coding:utf-8
cache = {}
items = range(1,9)
weights = [10,1,5,9,10,7,3,12,5]
values = [10,20,30,15,40,6,9,12,18]
# 最大承重能力
W = 4
def knapsack():
    for w in range(W+1):
        cache[get_key(0,w)] = 0
    for i in items:
        cache[get_key(i,0)] = 0
        for w in range(W+1):
            if w >= weights[i]:
                if cache[get_key(i-1,w-weights[i])] + values[i] > cache[get_key(i-1,w)]:
                    cache[get_key(i,w)] = values[i] + cache[get_key(i-1,w-weights[i])]
                else:
                    cache[get_key(i,w)] = cache[get_key(i-1,w)]
            else:
                cache[get_key(i,w)] = cache[get_key(i-1,w)]
    return cache[get_key(8,W)]
def get_key(i,w):
    return str(i)+','+str(w)
if __name__ == '__main__':
    # 背包把所有东西都能装进去做假设开始
    print knapsack()
{% endhighlight %}

从这里可以看出，其实很多动态规划问题都可以使用循环替代递归求解，他们的区别在于，循环方式会穷举出所有可能用到的数据，而递归只需要计算那些对最终解有帮助的子问题的解，但是递归本身是很耗费性能的，所以具体实践中怎么用要看具体问题具体分析。

### 最长公共子序列（LCS）
---
解决了01背包问题之后，我们对“子问题”和“状态转移方程”有了一点点理解，现在趁热打铁，来试试解决LCS问题：

字符串一“ABCDABCD”和字符串二"BDCFG"的公共子序列（不是公共子串，不需要连续）是BDC，现在给出两个确定长度的字符串X和Y，求他们的最大公共子序列的长度。

首先，我们还是找最优子结构，即把问题分解为子问题，$X$和$Y$的最大公共子序列可以分解为$X$的子串$X_{i}$和$Y$的子串$Y_{j}$的最大公共子序列问题。

其次，我们需要考虑$X_{i}$和$Y_{j}$的最大公共子序列$C\[i,j\]$需要符合什么条件：

1. 如果两个串的长度都为0，则公共子序列的长度也为0；<br/>
2. 如果两个串的长度都大于0且最后面一位的字符相同，则公共子序列的长度是$C\[i-1,j-1\]$的长度加一；<br/>
3. 如果两个子串的长度都大于0，且最后面一位的字符不同，则最大公共子序列的长度是$C\[i-1,j\]$和$C\[i,j-1\]$的最大值；<br/>

最后，根据条件获得状态转移函数：

![](/images/algorithm/12-19/stat2.png)

由此转移函数，很容易写出递归代码：

{% highlight python %}
#!/usr/bin/env python
# coding:utf-8
cache = {}
# 为了下面表示方便更容易理解，数组从1开始编号
# 即当i,j为0的时候，公共子序列为0，属于极端情况
A = [0,'A','B','C','B','D','A','B','E','F']
B = [0,'B','D','C','A','B','A','F']
def C(i,j):
    if get_key(i,j) in cache:
        return cache[get_key(i,j)]
    result = 0
    if i > 0 and j > 0:
        if A[i] == B[j]:
            result = C(i-1,j-1)+1
        else:
            result = max(C(i,j-1),C(i-1,j))
    cache[get_key(i,j)] = result
    return result
def get_key(i,j):
    return str(i)+','+str(j)
if __name__ == '__main__':
    print C(len(A)-1,len(B)-1)
{% endhighlight %}

上面程序的输出结果为5，我们也可以像背包问题一样，把上面代码改造成自底向上的求解方式，这里就省略了。

但是实际应用中，我们可能更需要求最大公共子序列的序列，而不只是序列的长度，所以我们下面额外考虑一下如何输出这个结果。

其实输出LCS字符串也是使用动态规划的方法，我们假设$LCS\[i,j\]$表示长度为i的字符串和长度为$j$的字符串的最大公共子序列，那么我们有以下状态转移函数：

![](/images/algorithm/12-19/stat3.png)

其中$C\[i,j\]$是我们之前求得的最大子序列长度的缓存，根据上面的状态转移函数写出递归代码并不麻烦：

{% highlight python %}
#!/usr/bin/python
# coding:utf-8
"""Dynamic Programming"""
CACHE = {}
# 为了下面表示方便，数组从1开始编号
# 即当i,j为0的时候，公共子序列为0，属于极端情况
A = [0, 'A', 'B', 'C', 'B', 'D', 'A', 'B', 'E', 'F']
B = [0, 'B', 'D', 'C', 'A', 'B', 'A', 'F']
def lcs_length(i, j):
    """Calculate max sequence length"""
    if get_key(i, j) in CACHE:
        return CACHE[get_key(i, j)]
    result = 0
    if i > 0 and j > 0:
        if A[i] == B[j]:
            result = lcs_length(i-1, j-1)+1
        else:
            result = max(lcs_length(i, j-1), lcs_length(i-1, j))
    CACHE[get_key(i, j)] = result
    return result
def lcs(i, j):
    """backtrack lcs"""
    if i == 0 or j == 0 :
        return ""
    if A[i] == B[j]:
        return lcs(i-1, j-1) + A[i]
    else:
        if CACHE[get_key(i-1, j)] > CACHE[get_key(i, j-1)]:
            return lcs(i-1, j)
        else:
            return lcs(i, j-1)
def get_key(i, j):
    """build cache keys"""
    return str(i) + ',' + str(j)
if __name__ == '__main__':
    print lcs_length(len(A)-1, len(B)-1)
    print lcs(len(A)-1, len(B)-1)
{% endhighlight %}

本小节就暂时到这里了，其实我们很容易能体会到，动态规划的核心就是找到那个状态转移方程，所以遇到问题的时候，首先想一想其有没有最优子结构，很可能帮助我们省下大把的思考时间。

