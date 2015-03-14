---
layout: default
title: 搜不狐 --- 有关互联网、软件开发的热门话题
---
<!--
<ul>
  <li>[2013-05-13] &nbsp; &nbsp; <a href="/other/2013/05/13/migrate-to-new-site.html">把博客迁移到Github上</a></li>
</ul>
-->

<ul>
　{% for post in site.posts %}
　　<li>[{{ post.date | date: "%Y-%m-%d" }}] &nbsp; &nbsp; <a href="{{ post.url }}">{{ post.title }}</a></li>
　{% endfor %}
</ul>
