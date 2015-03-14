---
layout: default
title: 中文分词的原理与实践
comments: true
categories: [ml]
---
## 中文分词的原理与实践
发表日期：2012-12-23

中文分词问题是绝大多数中文信息处理的基础问题，在搜索引擎、推荐系统（尤其是相关主题推荐）、大量文本自动分类等方面，一个好的分词系统是整个系统成功的关键。

主流的分词思路有三种，分别是“规则分词”、“统计分词”和“混合分词（统计+规则）”，本问会依次介绍到这三种方式。


### 一、基于规则的分词
基于规则的思路其实很自然，直白的说其实就是预先设计一个词典，把待分词的句子按照某种规则进行切割，切出来的词如果在词典里出现，那就算分出来一个词。

具体到句子的切割方式，主流的有以下三种：


#### 1）正向最大匹配
假设我们现有一个词典，该词典中的最长词的长度为5，这个5就是“正向最大匹配”中的“最大”的含义，这个词典中存在“长江大桥”和“南京市长”两个词。

现在，我们要对“**南京市长江大桥**”这个句子进行分词，根据正向最大匹配的原则：

1. 先从句子中拿出前5个字符“**南京市长江**”，把这5个字符到词典中匹配，发现没有这个词，那就缩短取字个数，取前四个“**南京市长**”，发现词库有这个词，就把该词切下来；<br/>
2. 对剩余三个字“**江大桥**”再次进行正向最大匹配，会切成“**江**”、“**大桥**”；<br/>
3. 整个句子切分完成为：**南京市长、江、大桥**；<br/>

我们可以很明显的看到，这么分词其实有很明显的缺陷，即没有把“南京市”给分出来，而且这个句子的原意显然与“南京市长”没有任何关系。


#### 2）逆向最大匹配
后来人们发现，中文经常会把要描述的主体对象放到句子的后面（不绝对），于是就有人提出了逆向最大匹配，从句子的后面开始最大匹配：

1. 取出“**南京市长江大桥**”的后四个字“**长江大桥**”，发现词典中有匹配，切割下来；<br/>
2. 对剩余的“南京市”进行分词，整体结果为：**南京市、长江大桥**<br/>

要注意的是，对于这个句子虽然效果好了一些，但并不代表逆向的匹配一定正确，也许某个句子真的是在讨论“**南京市长**”呢？


#### 3）双向最大匹配
如果不能准确把握分词的效果，有人提出了双向的最大匹配，即把所有可能的最大词都分出来，上面的句子可以分为：**南京市、南京市长、长江大桥、江、大桥**

具体到实践中，如果只是简单的系统而不是复杂的数据挖掘，使用这种基于规则的匹配非常方便，几十行代码也就搞定了。

从分词的实际效果来说，逆向最大匹配通常效果要略好于正向的最大匹配（没有严谨的证明，只是大家的感觉......）。

下面的通过代码，对逆向最大匹配做一个简单的体验：
{% highlight python %}
#!/usr/bin/python
# coding:utf-8
"""
  Inverse Maximum Matching Words Spliting.
"""
class IMM(object):
  def __init__(self, dictionary_file):
    self.dictionary = {}
    self.maximum = 0
    # 读取词典文件
    with open(dictionary_file,'r') as f:
      line = f.readline().strip()
      while line:
        self.dictionary[line] = 1
        if len(line) > self.maximum:
          # 设置词典的最大单词长度
          self.maximum = len(line)
        line = f.readline().strip()
  def split_words(self, text):
    result = []
    # 最大匹配
    index = len(text)
    while index > 0:
      word = None
      for length in range(self.maximum, 0, -1):
        if index - length < 0:
          continue
        piece = text[(index - length):index]
        if piece in self.dictionary:
          word = piece
          result.append(word)
          index = index - length
          break
      if word is None:
        index -= 1
    return result
def main():
  text = "中华人民共和国中央政府今天，成立了"
  # 输出： 了   成立   今天   中央政府   中华人民共和国
  splitter = IMM('dict.txt')
  result = splitter.split_words(text)
  for r in result:
    print r,' ',
if __name__ == '__main__':
  main()
{% endhighlight %}


### 二、基于统计的分词
基于规则的统计很大程度上是看运气来的，因为你无法猜测原文的意思是表达什么，但是统计学家想出了好办法，如果某两个词的组合，在概率统计上出现的几率非常大，那么我们就认为分词正确。

比如： “南京市“后紧跟”长江大桥”的在各种资料的统计结果中，概率非常大，那么我们就认为这个词应该分成这样，而“南京市长”和“江大桥”这两个词的组合，相信概率会非常低，也就认为不正确了。

要使用基于统计的分词，一共需要做两步操作：1、建立统计语言模型，2、对句子进行单词划分，对划分结果进行概率计算，获得概率最大的分词方式。


#### 1）建立统计语言模型
这一步比较复杂，我们首先需要来看一下全概率公式。现在假如我们现在要预测未来四天的天气是以下序列的概率：

>> 晴->雨->多云->多云

我们已经知道，这几种天气独立出现的概率分别是：

$$P(w_{1})、P(w_{2})、P(w_{3})、P(w_{4})$$

我们现在要计算整个序列出现的概率，可以使用全概率公式：
$$P(w_{1},w_{2},w_{3},w_{4})=P(w_{1})∗P(w_{2}|w_{1})∗P(w_{3}|w_{1},w_{2})∗P(w_{4}|w_{1},w_{2},w_{3})$$

我们可以看到，对于天气来说，只需要统计出以前各种天气独立出现的概率，然后使用全概率公式计算即可，这个道理同样可以用于分词统计上，即根据每个词以前独立出现的概率，计算出整个句子出现的概率。

问题在于，一个句子出现的单词比较多的话，需要统计的数据会几何倍数的增长，比如光$P(w_{2}|w_{1})$一个参数，就需要计算$N^2$个概率，N是语料库单词数量，$P(w_{3}|w_{1},w_{2})$需要计算$N^3$个概率，不太现实。


所以为了解决这个问题，需要引入“**马尔科夫模型**”，这个模型的的本质是，假设某一时刻的状态，只与该状态之前的$N$个状态有关，这个$N$是有限的，整个状态链称为**N阶马尔科夫链**。比如，对于以上天气预测使用1阶马尔科夫链，当天的天气只与之前一天有关，与更早的天气没有关系，那么全概率就变成了：

$$P(w_{1},w_{2},w_{3},w_{4})=P(w_{1})∗P(w_{2}|w_{1})∗P(w_{3}|w_{2})∗P(w_{4}|w_{3})$$


所有的概率都只有两个参数，只需要计算$N^2$个概率即可，同时也适用于更长的天气预测链，这种两个参数的一阶马尔科夫链用在统计语言模型上就称为二元语言模型。一般的小公司，用到二元的模型就够了，像Google这种巨头，也只是用到了大约四元的程度，它对计算能力和空间的需求都太大了。


现在，我们已经从全概率公式引入了语言模型，那么真正用起来如何用呢？

举个简单的例子，我们要计算 "南京 市长 江 大桥" 这种分词情况出现的概率就可以这么算：

>> P(南京,市长,江,大桥) = P(南京)\*P(市长|南京)\*P(江|市长)\*P(大桥|江)


对于任一一个条件概率，我们都可以用最大似然估计来简单计算，如：

$$P_{MLE}(w_{1}|w_{2})=\frac {Count(w_{2}, w_{1})}{Count(w_{2})}$$

其中$Count(w_{2},w_{1})$表示这两个单词同时出现且2在1前面的次数，这种估算方式非常使用有效，基本上各大公司都是这么来做的。但是问题在于假如这两个单词压根没出现过，那岂不是概率为0了？这在概率上和计算方便上都是不允许的，毕竟再稀有的词也是有出现概率的嘛，所以这就需要我们使用一些“平滑方法”来保证所有概率都不能为0。

最简单的平滑方式莫过于加一平滑了，即把所有单词组合出现的次数都加一：

$$P_{MLE}(w_{1}|w_{2})=\frac {Count(w_{2}, w_{1}) + 1}{Count(w_{2}) + V}$$

<br/>

其中$V$是词表单词的数量（唯一单词数），保证整体概率加起来还是1。当然，实际使用中用的最多的是“katz平滑”，这种平滑方式稍微复杂一些，本篇暂不详述，我们先用加一平滑就行（目的都是一样的）。

现在，我们的语言模型轮廓已经出来了，即：

计算相邻两个单词共同出现的概率，用最大似然估计的话，也就是词组的频率（二元模型，多远模型需要计算三个连续单词连续出现的频率）。

计算多个单词组合的概率的时候，使用上面提到的马尔科夫链公式，这里要注意首个单词是没有前缀的，所以我们也要计算这种“在句首出现”的概率，为了计算统一，我们可以为每一句的前面加一个标记如&lt;s&gt;，这样计算P(w|&lt;s&gt;)就表示w词出现在句首的概率了。

说起来可能不太好理解，看代码最容易了：

{% highlight python %}
#!/usr/bin/env python
# coding:utf-8
class LanguageModel(object):
  def __init__(self, corpus_file):
    self.words = []
    self.freq = {}
    print 'loading words'
    with open(corpus_file,'r') as f:
      line = f.readline().strip()
      while line:
        self.words.append('<s>')
        self.words.extend(line.split())
        self.words.append('</s>')
        line = f.readline().strip()
    print 'hashing bi-gram keys'
    for i in range(1,len(self.words)):
      # 条件概率
      key = self.words[i] + '|' + self.words[i-1]
      if key not in self.freq:
        self.freq[key] = 0
      self.freq[key] += 1
    print 'hashing single word keys'
    for i in range(0,len(self.words)):
      key = self.words[i]
      if key not in self.freq:
        self.freq[key] = 0
      self.freq[key] += 1
  def get_trans_prop(self, word, condition):
    """获得转移概率"""
    key = word + '|' + condition
    if key not in self.freq:
      self.freq[key] = 0
    if condition not in self.freq:
      self.freq[condition] = 0
    C_2 = (float)(self.freq[key] + 1.0)
    C_1 = (float)(self.freq[condition] + len(self.words))
    return C_2/C_1
  def get_init_prop(self, word):
    """获得初始概率"""
    return self.get_trans_prop(word,'<s>')
  def get_prop(self, *words):
    init = self.get_init_prop(words[0])
    product = 1.0
    for i in range(1,len(words)):
      product *= self.get_trans_prop(words[i],words[i-1])
    return init*product
def main():
    lm = LanguageModel('RenMinData.txt')
    print 'total words: ', len(lm.words)
    print 'total keys: ', len(lm.freq)
    print 'P(各族|全国) = ', lm.get_trans_prop('各族','全国')
    print 'P(党|坚持) = ', lm.get_trans_prop('党','坚持')
    print 'P(以来|建国) = ', lm.get_trans_prop('以来','建国')
    print 'init(全国) = ', lm.get_init_prop('全国')
    print "P('全国','各族','人民')", lm.get_prop('全国','各族','人民')
if __name__ == '__main__':
    main()
{% endhighlight %}

#### 2）划分句子求出概率最高的分词方式
现在，我们有了统计语言模型，下一步要做的就是对句子进行划分，最原始直接的方式，就是对句子的所有可能的分词方式进行遍历然后求出概率最高的分词组合。但是这种穷举法显而易见非常耗费性能，所以我们要想办法用别的方式达到目的。

仔细思考一下，假如我们把每一个字当做一个节点，每两个字之间的连线看做边的话，对于句子“中国人民万岁”，我们可以构造一个如下的分词结构：

![](/images/ml/12-23/zgrmyh.jpg)

我们要找概率最大的分词结构的话，可以看做是一个动态规划问题， 也就是说，要找整个句子的最大概率结构，对于其子串也应该是最大概率的，我们只需要找到这个状态转移函数即可，关于动态规划的转移函数，可以参考[这篇文章](#)。

对于句子任意一个位置$t$上的字，我们要从词典中找到其所有可能的词组形式，如上图中的第一个字，可能有：中、中国、中国人三种组合，第四个字可能只有民，经过整理，我们的分词结构可以转换成以下的有向图模型:

![](/images/ml/12-23/viterbi.jpg)

我们要做的就是找到一个概率最大的路径即可。我们假设$C_{t}(k)$表示第t个字的位置可能的词是k，那么可以写出状态转移方程：

![](/images/ml/12-23/viterbi_math.png)

其中k是当前位置的可能单词，l是上一个位置的可能单词，M是l可能的取值，有了状态转移返程，写出递归的动态规划代码就很容易了（这个方程其实就是著名的viterbi算法，通常在隐马尔科夫模型中应用较多）：

{% highlight python %}
#!/usr/bin/python
# coding:utf-8
"""
  @author royguo1988@gmail.com
  @date 2012-12-23
"""
from lm import LanguageModel
class Node(object):
  """有向图中的节点"""
  def __init__(self,word):
    # 当前节点作为左右路径中的节点时的得分
    self.max_score = 0.0
    # 前一个最优节点
    self.prev_node = None
    # 当前节点所代表的词
    self.word = word
class Graph(object):
  """有向图"""
  def __init__(self):
    # 有向图中的序列是一组hash集合
    self.sequence = []
class DPSplit(object):
  """动态规划分词"""
  def __init__(self):
    self.lm = LanguageModel('RenMinData.txt')
    self.dict = {}
    self.words = []
    self.max_len_word = 0
    self.load_dict('dict.txt')
    self.graph = None
    self.viterbi_cache = {}
  def get_key(self, t, k):
    return '_'.join([str(t),str(k)])
  def load_dict(self,file):
    with open(file, 'r') as f:
      for line in f:
        word_list = [w.encode('utf-8') for w in list(line.strip().decode('utf-8'))]
        if len(word_list) > 0:
          self.dict[''.join(word_list)] = 1
          if len(word_list) > self.max_len_word:
            self.max_len_word = len(word_list)
  def createGraph(self):
    """根据输入的句子创建有向图"""
    self.graph = Graph()
    for i in range(len(self.words)):
      self.graph.sequence.append({})
    word_length = len(self.words)
    # 为每一个字所在的位置创建一个可能词集合
    for i in range(word_length):
      for j in range(self.max_len_word):
        if i+j+1 > len(self.words):
          break
        word = ''.join(self.words[i:i+j+1])
        if word in self.dict:
          node = Node(word)
          # 按照该词的结尾字为其分配位置
          self.graph.sequence[i+j][word] = node
    # 增加一个结束空节点，方便计算
    end = Node('#')
    self.graph.sequence.append({'#':end})
    # for s in self.graph.sequence:
    #   for i in s.values():
    #     print i.word,
    #   print ' - '
    # exit(-1)
  def split(self, sentence):
    self.words = [w.encode('utf-8') for w in list(sentence.decode('utf-8'))]
    self.createGraph()
    # 根据viterbi动态规划算法计算图中的所有节点最大分数
    self.viterbi(len(self.words), '#')
    # 输出分支最大的节点
    end = self.graph.sequence[-1]['#']
    node = end.prev_node
    result = []
    while node:
      result.insert(0,node.word)
      node = node.prev_node
    print ''.join(self.words)
    print ' '.join(result)
  def viterbi(self, t, k):
    """第t个位置，是单词k的最优路径概率"""
    if self.get_key(t,k) in self.viterbi_cache:
      return self.viterbi_cache[self.get_key(t,k)]
    node = self.graph.sequence[t][k]
    # t = 0 的情况,即句子第一个字
    if t == 0:
      node.max_score = self.lm.get_init_prop(k)
      self.viterbi_cache[self.get_key(t,k)] = node.max_score
      return node.max_score
    prev_t = t - len(k.decode('utf-8'))
    # 当前一个节点的位置已经超出句首，则无需再计算概率
    if prev_t == -1:
      return 1.0
    # 获得前一个状态所有可能的汉字
    pre_words = self.graph.sequence[prev_t].keys()
    for l in pre_words:
      # 从l到k的状态转移概率
      state_transfer = self.lm.get_trans_prop(k, l)
      # 当前状态的得分为上一个最优路径的概率乘以当前的状态转移概率
      score = self.viterbi(prev_t, l) * state_transfer
      prev_node = self.graph.sequence[prev_t][l]
      cur_score = score + prev_node.max_score
      if cur_score > node.max_score:
        node.max_score = cur_score
        # 把当前节点的上一最优节点保存起来，用来回溯输出
        node.prev_node = self.graph.sequence[prev_t][l]
    self.viterbi_cache[self.get_key(t,k)] = node.max_score
    return node.max_score
def main():
  dp = DPSplit()
  dp.split('中国人民银行')
  dp.split('中华人民共和国今天成立了')
  dp.split('努力提高居民收入')
if __name__ == '__main__':
  main()
{% endhighlight %}

<br/>
需要特别注意的几点是：

1. 做递归计算式务必使用缓存，把子问题的解先暂存起来，参考动态规划入门实践。<br/>
2. 当前位置的前一位置应当使用当前位置单词的长度获得。<br/>
3. 以上代码只是作为实验用，原理没有问题，但性能较差，生产情况需要建立索引以提高性能。<br/>
4. 本分词代码忽略了英文单词、未登录词和标点符号，但改进并不复杂，读者可自行斟酌。<br/>

代码的输出结果为：

{% highlight java %}
中国人民银行
中国 人民 银行
中华人民共和国今天成立了
中华人民共和国 今天 成立 了
努力提高居民收入
努力 提高 居民 收入
{% endhighlight %}

### 三、统计+规则分词

有时候我们不单单需要准确的把原句的意思分出来，同时也希望能尽可能多的把符合原句意思的词抽取出来，比如 “中国人民银行”，按照统计分词可以得到：中国、人民、银行 三个词，但在某些领域，我们可能还需要 “人民银行”、“中国人民“ 这些词。

所以为了尽可能多的提取句子中的词，大多数分词工具的实现都会结合规则和统计，把结果进行合并。

 

### 后记

水平有限，以上内容只是我作为业余爱好者的研究了解，如有错误，求不吝指正。
