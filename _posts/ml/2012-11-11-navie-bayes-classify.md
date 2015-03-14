---
layout: default
title: 朴素贝叶斯新闻分类器详解
comments: true
categories: [ml]
---

## 朴素贝叶斯新闻分类器详解
---
2012-11-11

机器学习的三要素是模型、策略（使用Cost Function计算这个模型是不是好的）和优化算法（不断的寻找最优参数，找到一个参数后用策略判断一下是不是可以，不行再找）。

一个具体的机器学习流程是怎么样的呢，下面使用朴素贝叶斯进行新闻分类进行一个完整的介绍。

### 1、特征表示
---
一篇新闻中，可以把新闻中出现的词作为特征向量表示出来，如 X = {昨日，是，国内，投资，市场...}

### 2、特征选择
---
特征中由于一些词对分类没有比较显著的帮助，甚至会有导致一些噪音，我们需要去除，如“是”、“昨日”等，经过选择的特征可能是 X = {国内，投资，市场...}

### 3、模型选择
---
这里选择朴素贝叶斯分类器，关于朴素贝叶斯可以参看刘未鹏的[这篇博客](http://mindhacks.cn/2008/09/21/the-magical-bayesian-method/)，非常详细。

朴素贝叶斯本身非常简单，但是很多情况下这种简单的分类模型却很有效，在我对新闻进行分类测试的过程中，很容易就能达到93%以上的准确率，个别分类的精度能达到99%。

朴素贝叶斯模型的基本公式为：

$$ P(y_{i}|X) = \frac {P(y_{i}) \* P(X|y_{i})}{P(X)} $$

其中，各个参数的含义为：

1. $P(y_{i}|X)$ 当前文档X属于分类Yi的概率 <br/>
2. $P(y_{i})$ 分类$y_{i}$的先验概率，即在整个训练集中这种分类的比率
3. $P(X)$ 文档$X$的先验概率，每个文档在数据集中都是1/N的概率，可忽略
4. $P(X|y_{i})$ 在分类$y_{i}$中，文档X存在的概率

对于第4条，文档$X$存在于$y_{i}$中的概率，可以按照文档X中每个词在Yi中的概率相乘获得，即：

$$P(X|y_{i})=\prod_{j} P(x_{j}|y_{i})$$

所以贝叶斯公式可以变形为：

$$P(y_{i}|X) = \frac {P(y_{i}) \* \prod_{j}P(x_{j}|y_{i})}{P(X)}$$

其中，上面的那个参数$P(y_{i})$和$P(x_{j}|y_{i})$可以根据最大似然估计法来估算，即：

$$P(y_{i})=\frac {Count(y_{i})}{Count(X)}$$

表示当前分类的先验概率为当前分类下的文档数除以所有文档.

$$P(x_{j}|y_{i}) = \frac {Count(x_{j})}{Count(y_{i})}$$

表示当前分类下出现的所有Xj词数除以当前分类下所有的词数.

这里需要注意的是，$P(x_{j}|y_{i})$的计算方式主要有两种，上面所说的是新闻分类实践中效果较好的一种，叫做多项分布（Multinomial Distribution），就是单个文档中重复出现某个词的时候，出现几次计数几次，分母为所有词汇的总数。

另一种计算方式为，01分布（Binary Distribution），即单个文档中出现多次的词只计数一次，分母为所有文章的个数，而不是词的个数。

#### 可能出现的问题一：
---
在进行预测的时候，如某篇文章包含“澳门”这个词，使用上面变形后的贝叶斯公式计算该文章是“体育”分类的时候，假如“体育”分类下从来没有出现过“澳门”这个词，就会导致

$$P(x_{j}|y_{i})=frac {Count(x_{j})}{Count(x_{i})}=0$$

进一步导致整个贝叶斯概率为0，这是不合理的，所以我们要避免没有出现过的词概率为0的情况。

这里我们只需要使用一个平滑参数，让上式的分子分母同时加上一个小值即可，假如分子加上 lambda ，则分母需要加上 N \* lambda，其中N为所有单词的去重后数量（这是因为分子为每一个词汇都要计算一次）。

这样就变成了：

$$P(x_{j}|y_{i})=frac {Count(x_{j}) + N}{Count(x_{i}) + N \* \lambda}$$

#### 可能出现的问题二：
---
由于贝叶斯公式中是所有的$P(x_{j}|y_{i})$求积，概率求积很可能遇到浮点数溢出的情况，这时候我们需要变通一下，把求积转换成求和，只需要对贝叶斯公式中分子求log即可（log(a \* b) = log(a) + log(b)）:

![](/images/ml/11-11/1.gif)

### 4、训练数据准备
---
我所使用的训练数据集为一批已经分好词的文本文件，文件名中包含它们所属的分类（auto、sports、business），为了让模型训练的时候更方便的读取和使用，我们把数据集按照一定比例（如80%）分为训练集和测试集：

{% highlight python %}
#!/usr/bin/env python
# encoding: utf-8
"""
    author: royguo1988@gmail.com
"""
import os
import random
import re
class DataPrepare(object):
    """处理原始数据，为机器学习模型的训练作准备"""
    def __init__(self, input_dir, train_data_file, test_data_file, train_file_percentage):
        self.input_dir = input_dir
        self.train_data_file = open(train_data_file,'w')
        self.test_data_file = open(test_data_file,'w')
        self.train_file_percentage = train_file_percentage
        self.unique_words = []
        # 每一个单词都使用一个数字类型的id表示，python索引的时候才会快一些
        self.word_ids = {}
    def __del__(self):
        self.train_data_file.close()
        self.test_data_file.close()
    def prepare(self):
        file_num = 0
        output_file = self.test_data_file
        for file_name in os.listdir(self.input_dir):
            # arr = (1234,'business')
            arr = re.findall(r'(\d+)(\w+)',file_name)[0]
            category = arr[1]
            # 随即函数按照train_file_percentage指定的百分比来选择训练和测试数据及
            if random.random() < self.train_file_percentage:
                output_file = self.train_data_file
            else:
                output_file = self.test_data_file
            # 读取文件获得词组
            words = []
            with open(self.input_dir + '/' + file_name,'r') as f:
                words = f.read().decode('utf-8').split()
            output_file.write(category + ' ')
            for word in words:
                if word not in self.word_ids:
                    self.unique_words.append(word)
                    # 可以取Hash，这里为了简便期间，直接使用当前数组的长度（也是唯一的）
                    self.word_ids[word] = len(self.unique_words)
                output_file.write(str(self.word_ids[word]) + " ")
            output_file.write("#"+file_name+"\n")
            # 原始文件较多，需要交互显示进度
            file_num += 1
            if file_num % 100 == 0:
                print file_num,' files processed'
        print file_num, " files loaded!"
        print len(self.unique_words), " unique words found!"
if __name__ == '__main__':
    dp = DataPrepare('newsdata','news.train','news.test',0.8)
    dp.prepare()
{% endhighlight %}

### 5、模型训练
---
在模型训练的部分，我们需要的是求出模型公式中所有需要的参数，这样预测的时候可以直接调用用来预测一个新闻的分类。

模型训练的目标是获得一个概率矩阵：


    分类  单词1   单词2   ...  单词n
    体育  0.0123  0.0003  ...  0.00014
    商业  0.0034  0.0351  ...  0.1342

需要注意的是，某个单词可能不在其中一个分类中，这时候该单词在该分类下的概率就是上面提到的拉普拉斯平滑取得的默认概率，由于这种单词可能非常多，所以我们可以单独使用一个map来存储默认概率，遇到某分类下没有的单词的时候不再增加新的存储空间。

{% highlight python %}
#!/usr/bin/env python
# coding: utf-8
"""
    author: royguo1988@gmail.com
"""
class NavieBayes(object):
    """朴素贝叶斯模型"""
    def __init__(self,train_data_file,model_file):
        self.train_data_file = open(train_data_file,'r')
        self.model_file = open(model_file,'w')
        # 存储每一种类型出现的次数
        self.class_count = {}
        # 存储每一种类型下各个单词出现的次数
        self.class_word_count = {}
        # 唯一单词总数
        self.unique_words = {}
        # ~~~~~~~~~~ NavieBayes参数 ~~~~~~~~~~~~#
        # 每个类别的先验概率
        self.class_probabilities = {}
        # 拉普拉斯平滑，防止概率为0的情况出现
        self.laplace_smooth = 0.1
        # 模型训练结果集
        self.class_word_prob_matrix = {}
        # 当某个单词在某类别下不存在时，默认的概率（拉普拉斯平滑后）
        self.class_default_prob = {}
    def __del__(self):
        self.train_data_file.close()
        self.model_file.close()
    def loadData(self):
        line_num = 0
        line = self.train_data_file.readline().strip()
        while len(line) > 0:
            words = line.split('#')[0].split()
            category = words[0]
            if category not in self.class_count:
                self.class_count[category] = 0
                self.class_word_count[category] = {}
                self.class_word_prob_matrix[category] = {}
            self.class_count[category] += 1
            for word in words[1:]:
                word_id = int(word)
                if word_id not in self.unique_words:
                    self.unique_words[word_id] = 1
                if word_id not in self.class_word_count[category]:
                    self.class_word_count[category][word_id] = 1
                else:
                    self.class_word_count[category][word_id] += 1
            line = self.train_data_file.readline().strip()
            line_num += 1
            if line_num % 100 == 0:
                print line_num,' lines processed'
        print line_num,' training instances loaded'
        print len(self.class_count), " categories!", len(self.unique_words), "words!"
    def computeModel(self):
        # 计算P(Yi)
        news_count = 0
        for count in self.class_count.values():
            news_count += count
        for class_id in self.class_count.keys():
            self.class_probabilities[class_id] = float(self.class_count[class_id]) / news_count
        # 计算P(X|Yi)  <===>  计算所有 P(Xi|Yi)的积  <===>  计算所有 Log(P(Xi|Yi)) 的和
        for class_id in self.class_word_count.keys():
            # 当前类别下所有单词的总数
            sum = 0.0
            for word_id in self.class_word_count[class_id].keys():
                sum += self.class_word_count[class_id][word_id]
            count_Yi = (float)(sum + len(self.unique_words)*self.laplace_smooth)
            # 计算单个单词在某类别下的概率，存储在结果矩阵中，所有当前类别没有的单词赋予默认概率(即使用拉普拉斯平滑)
            for word_id in self.class_word_count[class_id].keys():
                self.class_word_prob_matrix[class_id][word_id] = \
                    (float)(self.class_word_count[class_id][word_id]+self.laplace_smooth) / count_Yi
            self.class_default_prob[class_id] = (float)(self.laplace_smooth) / count_Yi
            print class_id,' matrix finished, length = ',len(self.class_word_prob_matrix[class_id])
        return
    def saveModel(self):
        # 把每个分类的先验概率写入文件
        for class_id in self.class_probabilities.keys():
            self.model_file.write(class_id)
            self.model_file.write(' ')
            self.model_file.write(str(self.class_probabilities[class_id]))
            self.model_file.write(' ')
            self.model_file.write(str(self.class_default_prob[class_id]))
            self.model_file.write('#')
        self.model_file.write('\n')
        # 把每个单词在当前类别的概率写入文件
        for class_id in self.class_word_prob_matrix.keys():
            self.model_file.write(class_id + ' ')
            for word_id in self.class_word_prob_matrix[class_id].keys():
                self.model_file.write(str(word_id) + ' ' \
                     + str(self.class_word_prob_matrix[class_id][word_id]))
                self.model_file.write(' ')
            self.model_file.write('\n')
        return
    def train(self):
        self.loadData()
        self.computeModel()
        self.saveModel()
if __name__ == '__main__':
    nb = NavieBayes('news.train','news.model')
    nb.train()
{% endhighlight %}

### 6、预测（分类）和评价
---
预测部分直接使用朴素贝叶斯公式，计算当前新闻分别属于各个分类的概率，选择概率最大的那个分类输出。

由于第5步已经计算出来概率矩阵和$P(y_{i})$的值，所以预测的时候直接调用朴素贝叶斯函数即可，对测试数据集预测后计算其准确性、精确度等即可。

{% highlight python %}
#!/usr/bin/env python
#coding: utf-8
"""
    author: royguo1988@gmail.com
"""
import math
class NavieBayesPredict(object):
    """使用训练好的模型进行预测"""
    def __init__(self, test_data_file, model_data_file, result_file):
        self.test_data_file = open(test_data_file,'r')
        self.model_data_file = open(model_data_file,'r')
        # 对测试数据集预测的结果文件
        self.result_file = open(result_file,'w')
        # 每个类别的先验概率
        self.class_probabilities = {}
        # 拉普拉斯平滑，防止概率为0的情况出现
        self.laplace_smooth = 0.1
        # 模型训练结果集
        self.class_word_prob_matrix = {}
        # 当某个单词在某类别下不存在时，默认的概率（拉普拉斯平滑后）
        self.class_default_prob = {}
        # 所有单词
        self.unique_words = {}
        # 实际的新闻分类
        self.real_classes = []
        # 预测的新闻分类
        self.predict_classes = []
    def __del__(self):
        self.test_data_file.close()
        self.model_data_file.close()
        self.result_file.close()
    def loadModel(self):
        # 从模型文件的第一行读取类别的先验概率
        class_probs = self.model_data_file.readline().split('#')
        for cls in class_probs:
            arr = cls.split()
            if len(arr) == 3:
                self.class_probabilities[arr[0]] = float(arr[1])
                self.class_default_prob[arr[0]] = float(arr[2])
        # 从模型文件读取单词在每个类别下的概率
        line = self.model_data_file.readline().strip()
        while len(line) > 0:
            arr = line.split()
            assert(len(arr) % 2 == 1)
            assert(arr[0] in self.class_probabilities)
            self.class_word_prob_matrix[arr[0]] = {}
            i = 1
            while i < len(arr):
                word_id = int(arr[i])
                probability = float(arr[i+1])
                if word_id not in self.unique_words:
                    self.unique_words[word_id] = 1
                self.class_word_prob_matrix[arr[0]][word_id] = probability
                i += 2
            line = self.model_data_file.readline().strip()
        print len(self.class_probabilities), " classes loaded!", len(self.unique_words), "words!"
    def caculate(self):
        # 读取测试数据集
        line = self.test_data_file.readline().strip()
        while len(line) > 0:
            arr = line.split()
            class_id = arr[0]
            words = arr[1:len(arr)-1]
            # 把真实的分类保存起来
            self.real_classes.append(class_id)
            # 预测当前行（一个新闻）属于各个分类的概率
            class_score = {}
            for key in self.class_probabilities.keys():
                class_score[key] = math.log(self.class_probabilities[key])
            for word_id in words:
                word_id = int(word_id)
                if word_id not in self.unique_words:
                    continue
                for class_id in self.class_probabilities.keys():
                    if word_id not in self.class_word_prob_matrix[class_id]:
                        class_score[class_id] += math.log(self.class_default_prob[class_id])
                    else:
                        class_score[class_id] += math.log(self.class_word_prob_matrix[class_id][word_id])
            # 对于当前新闻，所属的概率最高的分类
            max_class_score = max(class_score.values())
            for key in class_score.keys():
                if class_score[key] == max_class_score:
                    self.predict_classes.append(key)
            line = self.test_data_file.readline().strip()
        print len(self.real_classes),len(self.predict_classes)
    def evaluation(self):
        # 评价当前分类器的准确性
        accuracy = 0
        i = 0
        while i < len(self.real_classes):
            if self.real_classes[i] == self.predict_classes[i]:
                accuracy += 1
            i += 1
        accuracy = (float)(accuracy)/(float)(len(self.real_classes))
        print "Accuracy:",accuracy
        # 评测精度和召回率
        # 精度是指所有预测中，正确的预测
        # 召回率是指所有对象中被正确预测的比率
        for class_id in self.class_probabilities:
            correctNum = 0
            allNum = 0
            predNum = 0
            i = 0
            while i < len(self.real_classes):
                if self.real_classes[i] == class_id:
                    allNum += 1
                    if self.predict_classes[i] == self.real_classes[i]:
                        correctNum += 1
                if self.predict_classes[i] == class_id:
                    predNum += 1
                i += 1
            precision = (float)(correctNum)/(float)(predNum)
            recall = (float)(correctNum)/(float)(allNum)
            print class_id,' -> precision = ',precision,' recall = ',recall
    def predict(self):
        self.loadModel()
        self.caculate()
        self.evaluation()
if __name__ == '__main__':
    nbp = NavieBayesPredict('news.test','news.model','news.result')
    nbp.predict()
{% endhighlight %}

全文完
