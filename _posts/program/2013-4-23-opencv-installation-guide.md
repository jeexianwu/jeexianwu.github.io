---
layout: default
title: OpenCV installation guide and human face detection demo
comments: true
categories: [program]
---

## OpenCV installation guide and human face detection demo

It's really a lot of pain to install OpenCV on Mac, in order to help others who meet the same issue, here i make an installation guide and a human face detection demo.

Hope this helpful.

### Installation Guide
1. Install `homebrew` and use `brew update` to update it to the latest version.

2. Note that homebrew has moved opencv to another tab `homebrew/science`, so if you don't add this tab to your homebrew, you will not be able to install opencv. Add this tab to your homebrew with `brew tap homebrew/science`.

3. After setup homebrew, you need to make sure your Python is official version (OS X comes with enthought python as default). You can install official python with `brew install python`.

4. Then you should install numpy with `pip install numpy`, and test it with `numpy.test()` in python intercepter.

5. After all these steps, we are able to install opencv with `brew install opencv`(This step may cost you 15 minutes, so get yourself a cup of coffee and take a rest).

6. Note that, if you get brew errors looks like "unable to link ...", you should follow its tips and make sure they are correctly linked.

### Human Face Detection

1, Download a well trained face detection model xml file through Google(With the name `haarcascade_frontalface_alt2.xml`).

2, Create a face_detection.cc file, and paste the code below into it (The header files may different, you should change it if it doesn't fit your environment):

{% highlight cpp %}
#include <stdio.h>
#include <opencv2/opencv.hpp> // for highgui, core etc.
using namespace cv;
// cascade : classifier using to detect haar objects.
// storage : memory to store detected objects.
void DetectAndDraw(CvHaarClassifierCascade* cascade,
                   CvMemStorage* storage,
                   IplImage* img,
                   double scale = 1.3) {
  static CvScalar colors[] = {
    {{0,0,255}},{{0,128,255}},{{0,255,255}},{{0,255,0}},
    {{255,128,0}},{{255,255,0}},{{255,0,0}},{{255,0,255}}
  };  // Just some pretty colors to draw angles.
  printf("Detecting objects ... \n");
  // Detect Objects
  cvClearMemStorage(storage);
  CvSeq* objects = cvHaarDetectObjects(
        img,
        cascade,
        storage,
        scale,
        2,
        0,
        cvSize(30, 30)
      );
  printf("%d objects found !\n", objects ? objects->total:0);
  // Loop found objects and draw angles around them.
  for(int i=0; i<(objects ? objects->total:0); i++) {
    printf("drawing...\n");
    CvRect* r = (CvRect*)cvGetSeqElem(objects, i);
    cvRectangle(
        img,
        cvPoint(r->x, r->y),
        cvPoint(r->x + r->width, r->y + r->height),
        colors[i%8]
        );
  }
  cvNamedWindow("Example");
  cvShowImage("Example", img);
  cvWaitKey(0);
  cvDestroyWindow("Example");
}
int main( int argc, char** argv )
{
  CvMemStorage* storage = cvCreateMemStorage(0);
  const char* cascade_name = "haarcascade_frontalface_alt2.xml";
  CvHaarClassifierCascade* cascade = (CvHaarClassifierCascade*)cvLoad(cascade_name, 0, 0, 0);
  if (!cascade) {
    printf("Load cascade failed !\n");
    exit(-1);
  }
  IplImage* img = cvLoadImage(argv[1]);
  DetectAndDraw(cascade, storage, img);
  // Release allocated memory.
  cvReleaseMemStorage(&storage);
  cvReleaseImage(&img);
  cvReleaseHaarClassifierCascade(&cascade);
  return 0;
}
{% endhighlight %}

3, In order to compile it easily, i use CMake to make it simple. Create a file named CMakeLists.txt with the content bellow:

{% highlight cpp %}
cmake_minimum_required(VERSION 2.8)
project( face_detection )
find_package( OpenCV REQUIRED )
add_executable( face_detection face_detection.cc )
target_link_libraries( face_detection ${OpenCV_LIBS} )
{% endhighlight %}

4, Use `./cmake . && make` will configure and compile the code, and generate a binary file named face_detection. Usage: `./face_detection lena.jpg`.

Here's some output, looks pretty well, of course you could train the detection model yourself.

![face1](/images/tutorial/4-23/face1.jpg)
![face2](/images/tutorial/4-23/face2.jpg)
![face2](/images/tutorial/4-23/face3.jpg)
