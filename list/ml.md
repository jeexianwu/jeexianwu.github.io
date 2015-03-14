---
layout: default
title: 机器学习和基础数学
comments: true
---
## 机器学习和基础数学 ##

<ul>
　{% for post in site.categories.ml %}
　　<li><a href="{{ post.url }}">{{ post.title }}</a></li>
　{% endfor %}
</ul>
