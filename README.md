JSON Diff
==================================================

JSON Diff expands on the amazing work by the guys at [jsonlint.com](http://www.jsonlint.com) and provides a semantic compare tool for JSON documents.

I often work with large documents and it's difficult to see the differences between them.  Normal text compare tools work well for finding the differences in JavaScript code, but JSON data can have many differences in the text that don't actually change the data.  

JSON Diff sorts, formats, and compares two JSON documents to find the actual semantic differences instead of just the text ones.

Try it out:  [http://www.jsondiff.com](http://www.jsondiff.com)

Run the built-in unit tests:  [http://www.jsondiff.com/index-test.html](http://www.jsondiff.com/index-test.html)


## Run JSONDiff in a Docker container

You can also run JSONDiff in a Docker container if you want to run it in your data center or just on your laptop.  First [install Docker](https://docs.docker.com/get-docker/) and then open a terminal the run the following commands:

```
docker build -t jdd:v1 .
docker run -i --name jdd -p 127.0.0.1:8080:80/tcp jdd:v1
```