---
layout: default
title: 生活杂记
comments: true
---
### 生活杂记

<ul>
　{% for post in site.categories.other %}
　　<li><a href="{{ post.url }}">{{ post.title }}</a></li>
　{% endfor %}
</ul>
