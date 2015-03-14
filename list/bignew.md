---
layout: default
title: 大牛系列
comments: true
---

### 一些大牛的成长历程

<ul>
　{% for post in site.categories.bignew %}
　　<li><a href="{{ post.url }}">{{ post.title }}</a></li>
　{% endfor %}
</ul>