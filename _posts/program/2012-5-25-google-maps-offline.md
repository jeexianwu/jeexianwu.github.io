---
layout: default
title: 离线版Google Maps (V3)
comments: true
categories: [program]
---
## 离线版Google Maps V3
2012-5-25
---

### 前言
---
目前越来越多的内部应用也逐渐涉及到地图服务，如某铁路系统内部的服务网点图、某电信公司的客户分布地，这些应用不在仅仅需要简单的标注，也需要一些数据交互，如最短距离、具体坐标，详细到街道的地图信息。

这类内部应用可能禁止访问互联网，而自己做一个地图或者购买商业地图改造，成本都比较高，这时候Google Maps离线版会是一个很好的选择。

前段时间看到[liongis](http://www.cnblogs.com/liongis/archive/2011/04/28/2032316.html)把Google Maps的js库完整的下载了下来，正好拿来使用，附加自己的具体实现，完成了一个基本的可用离线Maps。


Github地址： [https://github.com/royguo/GoogleMapsOffline](https://github.com/royguo/GoogleMapsOffline)

### Google Maps 本地文件结构
---
下载下来的Google Maps库结构很简洁，非常的模块化，有利于后期的升级：

![](/images/opensource/5-25/google-maps-js.png)

上图中的layers.js、marker.js等就是对应不同的API功能。

图中的expotile文件夹保存的是下载下来的地图Tiles，就是一块一块的那一坨图片，全部都是png格式，结构也很明显：

![](/images/opensource/5-25/google-maps-tiles.png)

最外层0~21是地图的zoom level，在往下一层如1711、1712等，是google地图使用的“墨卡托投影”的x轴坐标，最后一层就是y轴坐标。

### 实现缓存地图
---
结构明确之后，我们要做的就是先实现缓存地图的功能（总不能上来就把所有地图下载下来，要按需所取，数量级太大了），按照墨卡托坐标的方式，每一个Tile的下一个zoom level是四个子Tile，这样相当于一个四叉树，整体数量成几何级数增长。

我们要实现的功能为：

![](/images/opensource/5-25/cache-maps.png)

即，点击一个Tile的时候，把它的坐标取出来，然后点击cache，计算需要缓存多少图片，把墨卡托坐标发送给后台，开始多线程下载即可。

### 关键代码
---
Javascript取出Tile的时候，覆盖Google自带的函数，为每一个Tile添加border，方便点击、查看：

{% highlight javascript %}
CoordMapType.prototype.getTile = function(coord, zoom, ownerDocument) {
    // map images border
    var div = ownerDocument.createElement('DIV');
    div.innerHTML = 'x = ' + coord.x + ", y = " + coord.y + ", zoom = " + zoom;
    div.style.width = this.tileSize.width + 'px';
    div.style.height = this.tileSize.height + 'px';
    div.style.fontSize = '10';
    div.style.borderStyle = 'solid';
    div.style.borderWidth = '1px';
    div.style.borderColor = '#AAAAAA';
    //appaend locations
    if (map.mapTypeId != 'local') {
        downloading_count = downloading_count + 1;
        if(downloading_count > 0){
            $("#progress-bar").show();
        }
        $.post("/Application/cacheImage", {
            x : coord.x,
            y : coord.y,
            zoom : zoom
        }, function(json) {
            downloading_count = downloading_count - 1;
            if(downloading_count <= 0){
                $("#progress-bar").hide();
            }
        });
    }
    return div;
};
{% endhighlight %}

后台Java下载主要源代码：

{% highlight java %}
public class TileDownloader extends Job {
 public int x;
 public int y;
 public int zoom;
 public int zoomMax;
 public int count = 0;
public TileDownloader(int x, int y, int zoom, int zoomMax) {
 this.x = x;
 this.y = y;
 this.zoom = zoom;
 this.zoomMax = zoomMax;
 }
@Override
 public void doJob() {
 Logger.info("begin to download Google Maps Tile");
 recursionDownload(x, y, zoom);
 Logger.info("finish downloading Google Maps Tile");
 }
/**
 * 269019 389774 269018 389773 20
 * <p>
 * 538038 779548 538036 779546 21 /
 */
 public void recursionDownload(int x, int y, int zoom) {
 if (zoom > this.zoomMax) return;
 for (int i = 0; i < 2; i++) {
 for (int j = 0; j < 2; j++) {
 recursionDownload(x * 2 + i, y * 2 + j, zoom + 1);
 }
 }
 // download current image
 downloadImage(x, y, zoom);
 Logger.info("Image downloading, count = " + ++count + ", zoom = " + zoom + " , x = " + x
 + ", y = " + y);
 }
public void downloadImage(int x, int y, int zoom) {
 String url =
 "http://mt1.googleapis.com/vt?lyrs=m@174000000>src=apiv3>hl=zh-CN>x=" + x + ">s=>y=" + y
 + ">z=" + zoom + ">s=Gali>style=api%7Csmartmaps";
 String path = Utils.getApplicationPath("public", "maps", "expotile", zoom + "", x + "");
 File dir = new File(path);
 if (!dir.exists()) {
 dir.mkdirs();
 }
 File image = new File(path + y + ".png");
 try {
 if (!image.exists() || ImageIO.read(image) == null) {
 HttpResponse response = WS.url(url).get();
 InputStream is = response.getStream();
 FileOutputStream fos = new FileOutputStream(image);
 byte[] bytes = new byte[1024];
 while (is.read(bytes) > -1) {
 fos.write(bytes);
 }
 is.close();
 fos.flush();
 fos.close();
 }
 } catch (Exception e) {
 e.printStackTrace();
 }
 }
}
{% endhighlight %}

其中下面的路径表示google的tiles图片下载路径：

    String url ="http://mt1.googleapis.com/vt?lyrs=m@174000000>src=apiv3>hl=zh-CN>x=" + x + ">s=>y=" + y+ ">z=" + zoom + ">s=Gali>style=api%7Csmartmaps";

源码直接从Github下载即可

