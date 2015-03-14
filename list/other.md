---
layout: default
title: 杂记
comments: true
---
### 一些乱七八糟的无法分类的东西

<ul>
　{% for post in site.categories.other %}
　　<li><a href="{{ post.url }}">{{ post.title }}</a></li>
　{% endfor %}
</ul>
