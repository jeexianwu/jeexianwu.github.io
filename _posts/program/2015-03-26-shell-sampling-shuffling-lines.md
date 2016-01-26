---
layout: default
title: linux shell sampling and shuffling lines 取样和打乱行
comments: true
categories: [program]
---


##1. sampling

sort -R file | sed -n '3,10p'

shuf -n N input > output


##2. shuffling

- sort -R

- cat file | shuf