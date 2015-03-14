---
layout: default
title: Coursera课程批量下载(Python实现)
comments: true
categories: [program]
---

## Coursera课程批量下载(Python实现)

经常在Coursera上看公开课，但是想要下载的时候得一个一个点，太满了，随便一个课程也得有几十个video和subtitle要点...

参考了网上的一些代码片断和curl的用法，用Python写了一个简单的下载器，默认下载字母和video，pdf可以自行修改源码添加（或者修改后给我发pull request...）。

下载部分的代码很简单，就是直接调用curl：

{% highlight python %}
def download(self, url, target):
  if os.path.exists(target):
    print target,' already exist, skip.'
    return
  print 'downloading : ', target
  # -k : allow curl connect ssl websites without certifications.
  # -# : display progress bar.
  # -L : follow redirects
  # -o : output file
  # --cookie : String or file to read cookies from.
  cmd = ['curl', url, '-k', '-#', '-L', '-o', target, '--cookie',
         "csrf_token=%s; session=%s" % (self.course.csrf_token, self.course.session)]
  subprocess.call(cmd)
{% endhighlight %}

注意到下载需要给coursera.com传送session和csrf_token数据，所以我们需要想办法获得这两个数据。

从auth.py中可以看到登陆验证后如何得到session和csrf_token的，请直接点击下面的github链接：

[https://github.com/royguo/CourseraDownloader](https://github.com/royguo/CourseraDownloader)

示例DEMO：

![Coursera Downloader](/images/opensource/3-29/coursera.jpg)

