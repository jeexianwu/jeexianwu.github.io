---
layout: default
title: 使用HMM实现简单拼音输入法
comments: true
categories: [ml]
---

## 使用HMM实现简单拼音输入法
之前写过一篇使用语言模型进行中文分词的博客，本篇在之前写的语言模型的基础上，通过隐马尔科夫模型实现简单的拼音输入法，即输入一组拼音，我们把它转换成中文。

### 一、隐马尔科夫模型
首先我们来说一下什么是马尔科夫链，简单的说，任何一组我们可以观察到的连续序列，比如连续一个星期的天气状况，都可以称为马尔科夫链。

马尔科夫链的最主要特性是，假设当前节点的状态（比如今天的天气），只与之前N个连续状态相关（比如之前一个星期的天气状况），通过这个性质和大量的统计，我们就可以根据最近几天的天气预测未来一天的天气了。

#### 那么什么是隐马尔科夫模型呢？
比如你有一个朋友在美国，他会每天告诉你他今天做了什么（打球、跑步或呆在家里），你要通过他的这些活动推测过去一周内他们那边的天气。这里你朋友的活动对你来说是可以观察到的，即观察序列，而过去一周的天气是隐藏序列，那么这个通过观察序列推测隐藏序列的模型，就是隐马尔科夫模型。

隐马尔科夫模型的“隐”就体现在“隐藏序列”这个概念里。

### 二、通过拼音推测汉字
很明显，我们的拼音输入法的观察序列就是用户的输入拼音，比如"wo shi zhong guo ren"，我们要推测出用户想要输入的是“我 是 中 国 人”，这是个很典型的隐马尔科夫模型：

![HMM](/images/ml/3-7/hmm.jpg)

如上图所示，我们根据给定的观察对象O，获得一个概率最大的序列S\*。我们所知道的数据有：

1, 所有观察对象的值

2, 隐藏序列的马尔科夫模型概率，这是通过统计获得的

3, 隐藏状态到观察状态的概率，比如 “晴天”(隐藏状态) 到 “出去玩”(观察状态)的概率

我们要求的是S\*各个状态的连续概率最大的那个序列。

### 三、前向概率Viterbi算法
我们把隐藏序列中的一个节点的每一种可能取值都画出来的话，我们会发现这其实是一个有向图寻找最优路径的问题：

![viterbi](/images/ml/3-7/viterbi.jpg)

H、O、S都是当前节点可能的取值（比如hao拼音可能有好、号、耗等汉字）。而对于这种寻找最优路径的问题，我们可以通过动态规划的思想去考虑，假设σt(k)表示第t个位置对应的汉字是k，s表示隐藏序列，o表示观察序列，M表示当前隐藏节点的可能取值，那么：

![viterbi2](/images/ml/3-7/viterbi2.jpg)

上式中的$$b_{k}(o_{t+1})$$表示从隐藏节点k到观察序列t+1的发射概率，α_{l,k}表示l到k的马尔科夫状态转移概率。

写出了递归式，这个动态规划程序就容易写了。

### 四、实现
既然我们是一个有向图，那么闲来构造图中的所有节点：
{% highlight python %}
class GraphNode(object):
"""有向图中的节点"""
  def __init__(self, word, emission):
    # 当前节点所代表的汉字（即状态）
    self.word = word
    # 当前状态发射拼音的发射概率
    self.emission = emission
    # 最优路径时，从起点到该节点的最高分
    self.max_score = 0.0
    # 最优路径时，该节点的前一个节点，用来输出路径的时候使用
    self.prev_node = None
class Graph(object):
  """有向图结构构造器"""
  def __init__(self, pinyins, im):
    """根据拼音所对应的所有汉字组合，构造有向图"""
    self.sequence = []
    for py in pinyins:
      current_position = {}
      # 从拼音、汉字的映射表中读取汉字及汉字到拼音的发射概率
      for word,emission in im.emission[py].items():
        node = GraphNode(word, emission)
        current_position[word] = node
      self.sequence.append(current_position)
{% endhighlight %}

核心的viterbi算法为：

{% highlight python %}
def viterbi(self, t, k):
    """
      第t个位置出现k字符的概率，记为p_t(k)
    """
    if self.get_key(t,k) in self.viterbi_cache:
      return self.viterbi_cache[self.get_key(t,k)]
    node = self.graph.sequence[t][k]
    if t == 0:
      # 从统计语言模型中获得转移概率
      state_transfer = self.lm.get_init_prop(k)
      # 获得发射概率
      emission_prop = self.emission[self.pinyins[t]][k]
      # 计算当前节点的概率得分
      node.max_score = 1.0 * state_transfer * emission_prop
      self.viterbi_cache[self.get_key(t,k)] = node.max_score
      return node.max_score
    # 获得前一个状态所有可能的汉字
    pre_words = self.graph.sequence[t-1].keys()
    # 对当前节点分贝与前一个节点的所有可能汉字进行计算，获得概率最大的那个
    for l in pre_words:
      state_transfer = self.lm.get_trans_prop(k, l)
      emission_prop = self.emission[self.pinyins[t-1]][l]
      score = self.viterbi(t-1, l) * state_transfer * emission_prop
      if score > node.max_score:
        node.max_score = score
        node.prev_node = self.graph.sequence[t-1][l]
    self.viterbi_cache[self.get_key(t,k)] = node.max_score
    return node.max_score
{% endhighlight %}

由于完整代码牵扯的东西太多，包括语言模型、汉字拼音映射表，这里就不在全部贴出来了，不过有了上面两部分代码，其实其他的也很容易谢了，就是加载进去而已。如有兴趣可以联系我索取相关完整代码。

#### 输出效果：

{%highlight python %}
ocalhost:HMM roy$ python InputMethod.py
loading words
hashing bi-gram keys
hashing single word keys
zhong wen shu ru fa
中 文 输 入 发
ren min ri bao ri ren min
人 民 日 报 日 人 民
zhong hua ren min gong he guo
中 华 人 民 共 和 国
localhost:HMM roy$
{%endhighlight%}

第一组输入的有一个错字，主要是因为语料库不够完善，可能“入法”两个字的概率小于“入发”两个字了，不是大问题。

由于找我发邮件要代码的人太多...我觉得还是直接放在 [这里](https://dl.dropboxusercontent.com/u/74609482/pinyin.zip) 让大家下载吧，不过代码都是demo性质的，只为实现效果，切勿放到真实环境运行。

