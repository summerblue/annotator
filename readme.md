
合并以下两个开源类库：

- 标记 https://github.com/dvnc/annotator
- 高亮 https://github.com/julmot/mark.js/

以此来实现标记高亮文章内容。

对比常见的 [XPATH 记录位置](https://github.com/alienzhou/web-highlighter/blob/master/README.zh_CN.md) ：

优点是能更加精准定位到高亮内容，而不会出现 DOM 改变后，内容错误标记的情况。

缺点是页面会出现重复的标示，不过这个可以通过提示用户增加标示字数来解决。

太少字数的内容、或者出现频率太高的内容，其实也没必要标示。所以从实际使用上来讲也不会是个大问题。

讨论请前往：

- https://learnku.com/lk/t/47094
- https://learnku.com/articles/47096