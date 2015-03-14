---
layout: default
title: Java实现的Bloom Filter
comments: true
categories: [algorithm]
---
## Java实现简单的Bloom Filter

布隆过滤器在信息去重，比如网页的去重、邮件去重以及URL去重上很常用，其原理也相对简单，主要是通过多个哈希函数来设置bit位作为某条记录的指纹，查询和空间效率都非常不错。

### 一、基本原理
这篇博客讲的非常好，我就不再狗尾续貂了：

[http://www.cnblogs.com/haippy/archive/2012/07/13/2590351.html](http://www.cnblogs.com/haippy/archive/2012/07/13/2590351.html)

![bloom filter](/images/algorithm/3-4/bloomfilter.png)

简单来说，就是对数据库中的记录$X，Y，Z$分别使用多个（图中为3个）哈希函数，映射到对应的比特位，将比特位置1，如果下一个数据使用相同三个哈希后对应的比特位全为1，则该数据已存在数据库中。

#### 推导结论为(m为bit位个数，n为待添加的记录数，p为冲突概率)
如果已经限定了bitset容量和待添加的记录数，则最优的哈希函数的个数k为

$$k=\frac {m}{n}ln2=0.7\frac {m}{n}$$

此时冲突率为：

$$p=2^{-k}=0.618^{\frac {m}{n}}$$

如果已经限定了冲突概率，则bit数组的大小最优为：

$$m=-\frac {nlnp}{(ln2)^2}$$

### 二、构造函数
{% highlight java %}
public class Bloomfilter {
    private BitSet bitSet;
    private int bitSetSize;
    private int addedElements;
    private int hashFunctionNumber;
    /**
     * 构造一个布隆过滤器，过滤器的容量为c * n 个bit.
     * @param c 当前过滤器预先开辟的最大包含记录,通常要比预计存入的记录多一倍.
     * @param n 当前过滤器预计所要包含的记录.
     * @param k 哈希函数的个数，等同每条记录要占用的bit数.
     */
    public Bloomfilter(int c, int n, int k) {
        this.hashFunctionNumber = k;
        this.bitSetSize = (int) Math.ceil(c * k);
        this.addedElements = n;
        this.bitSet = new BitSet(this.bitSetSize);
    }
{% endhighlight %}

通常我们要预设一个相对大一点的bit空间，这样冲突才会比较小，哈希函数的数量K也是越多越好，但是通常8个以上就行了，要看能接受的冲突阈值。

代码中也提供了获得当前冲突率的函数。

### 三、完整代码
完整代码包括两个类，一个哈希函数库（从网上搜的8个hash函数），和过滤器类：

{% highlight java %}
package crawler.analysis;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.BitSet;
import java.util.List;
public class Bloomfilter {
    private BitSet bitSet;
    private int bitSetSize;
    private int addedElements;
    private int hashFunctionNumber;
    /**
     * 构造一个布隆过滤器，过滤器的容量为c * n 个bit.
     * @param c 当前过滤器预先开辟的最大包含记录,通常要比预计存入的记录多一倍.
     * @param n 当前过滤器预计所要包含的记录.
     * @param k 哈希函数的个数，等同每条记录要占用的bit数.
     */
    public Bloomfilter(int c, int n, int k) {
        this.hashFunctionNumber = k;
        this.bitSetSize = (int) Math.ceil(c * k);
        this.addedElements = n;
        this.bitSet = new BitSet(this.bitSetSize);
    }
    /**
     * 通过文件初始化过滤器.
     * @param file
     */
    public void init(String file) {
        BufferedReader reader = null;
        try {
            reader = new BufferedReader(new FileReader(file));
            String line = reader.readLine();
            while (line != null && line.length() > 0) {
                this.put(line);
                line = reader.readLine();
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (reader != null) reader.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
    public void put(String str) {
        int[] positions = createHashes(str.getBytes(), hashFunctionNumber);
        for (int i = 0; i < positions.length; i++) {
            int position = Math.abs(positions[i] % bitSetSize);
            bitSet.set(position, true);
        }
    }
    public boolean contains(String str) {
        byte[] bytes = str.getBytes();
        int[] positions = createHashes(bytes, hashFunctionNumber);
        for (int i : positions) {
            int position = Math.abs(i % bitSetSize);
            if (!bitSet.get(position)) {
                return false;
            }
        }
        return true;
    }
    /**
     * 得到当前过滤器的错误率.
     * @return
     */
    public double getFalsePositiveProbability() {
        // (1 - e^(-k * n / m)) ^ k
        return Math.pow((1 - Math.exp(-hashFunctionNumber * (double) addedElements / bitSetSize)),
                hashFunctionNumber);
    }
    /**
     * 将字符串的字节表示进行多哈希编码.
     * @param bytes 待添加进过滤器的字符串字节表示.
     * @param hashNumber 要经过的哈希个数.
     * @return 各个哈希的结果数组.
     */
    public static int[] createHashes(byte[] bytes, int hashNumber) {
        int[] result = new int[hashNumber];
        int k = 0;
        while (k < hashNumber) {
            result[k] = HashFunctions.hash(bytes, k);
            k++;
        }
        return result;
    }
    public static void main(String[] args) throws Exception {
        Bloomfilter bloomfilter = new Bloomfilter(30000000, 10000000, 8);
        System.out.println("Bloom Filter Initialize ... ");
        bloomfilter.init("data/base.txt");
        System.out.println("Bloom Filter Ready");
        System.out.println("False Positive Probability : "
                + bloomfilter.getFalsePositiveProbability());
        // 查找新数据
        List<String> result = new ArrayList<String>();
        long t1 = System.currentTimeMillis();
        BufferedReader reader = new BufferedReader(new FileReader("data/input.txt"));
        String line = reader.readLine();
        while (line != null && line.length() > 0) {
            if (!bloomfilter.contains(line)) {
                result.add(line);
            }
            line = reader.readLine();
        }
        reader.close();
        long t2 = System.currentTimeMillis();
        System.out.println("Parse 9900000 items, Time : " + (t2 - t1) + "ms , find "
                + result.size() + " new items.");
        System.out.println("Average : " + 9900000 / ((t2 - t1) / 1000) + " items/second");
    }
}
class HashFunctions {
    public static int hash(byte[] bytes, int k) {
        switch (k) {
            case 0:
                return RSHash(bytes);
            case 1:
                return JSHash(bytes);
            case 2:
                return ELFHash(bytes);
            case 3:
                return BKDRHash(bytes);
            case 4:
                return APHash(bytes);
            case 5:
                return DJBHash(bytes);
            case 6:
                return SDBMHash(bytes);
            case 7:
                return PJWHash(bytes);
        }
        return 0;
    }
    public static int RSHash(byte[] bytes) {
        int hash = 0;
        int magic = 63689;
        int len = bytes.length;
        for (int i = 0; i < len; i++) {
            hash = hash * magic + bytes[i];
            magic = magic * 378551;
        }
        return hash;
    }
    public static int JSHash(byte[] bytes) {
        int hash = 1315423911;
        for (int i = 0; i < bytes.length; i++) {
            hash ^= ((hash << 5) + bytes[i] + (hash >> 2));
        }
        return hash;
    }
    public static int ELFHash(byte[] bytes) {
        int hash = 0;
        int x = 0;
        int len = bytes.length;
        for (int i = 0; i < len; i++) {
            hash = (hash << 4) + bytes[i];
            if ((x = hash & 0xF0000000) != 0) {
                hash ^= (x >> 24);
                hash &= ~x;
            }
        }
        return hash;
    }
    public static int BKDRHash(byte[] bytes) {
        int seed = 131;
        int hash = 0;
        int len = bytes.length;
        for (int i = 0; i < len; i++) {
            hash = (hash * seed) + bytes[i];
        }
        return hash;
    }
    public static int APHash(byte[] bytes) {
        int hash = 0;
        int len = bytes.length;
        for (int i = 0; i < len; i++) {
            if ((i & 1) == 0) {
                hash ^= ((hash << 7) ^ bytes[i] ^ (hash >> 3));
            } else {
                hash ^= (~((hash << 11) ^ bytes[i] ^ (hash >> 5)));
            }
        }
        return hash;
    }
    public static int DJBHash(byte[] bytes) {
        int hash = 5381;
        int len = bytes.length;
        for (int i = 0; i < len; i++) {
            hash = ((hash << 5) + hash) + bytes[i];
        }
        return hash;
    }
    public static int SDBMHash(byte[] bytes) {
        int hash = 0;
        int len = bytes.length;
        for (int i = 0; i < len; i++) {
            hash = bytes[i] + (hash << 6) + (hash << 16) - hash;
        }
        return hash;
    }
    public static int PJWHash(byte[] bytes) {
        long BitsInUnsignedInt = (4 * 8);
        long ThreeQuarters = ((BitsInUnsignedInt * 3) / 4);
        long OneEighth = (BitsInUnsignedInt / 8);
        long HighBits = (long) (0xFFFFFFFF) << (BitsInUnsignedInt - OneEighth);
        int hash = 0;
        long test = 0;
        for (int i = 0; i < bytes.length; i++) {
            hash = (hash << OneEighth) + bytes[i];
            if ((test = hash & HighBits) != 0) {
                hash = (int) ((hash ^ (test >> ThreeQuarters)) & (~HighBits));
            }
        }
        return hash;
    }
}
{% endhighlight %}

直接运行代码，可以得到：
{% highlight java %}
Bloom Filter Initialize ...
Bloom Filter Ready
False Positive Probability : 4.169085162009671E-5
Parse 9900000 items, Time : 17288ms , find 100 new items.
Average : 582352 items/second
{% endhighlight %}


