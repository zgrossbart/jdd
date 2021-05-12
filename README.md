JSON Diff
==================================================

JSON Diff expands on the amazing work by the team at [jsonlint.com](http://www.jsonlint.com) and provides a semantic compare tool for JSON documents.

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

## Load my JSON data from the Internet

JSONDiff also supports two query paramaters so you can load your JSON data from the Internet instead of having to enter it into the UI.  

| Parameter | Description |
| --- | --- |
| `left` | An URL to the file to compare on the left side of the diff |
| `right` | An URL to the file to compare on the right side of the diff |

These parameters work like this:

```
http://jsondiff.com/?left=http://jsondiff.com/one.json&right=http://jsondiff.com/two.json
```

Each parameter must be a full URL and must be publicly accessible over the Internet.

## Is JSONDiff Secure?

You might notice that [http://www.jsondiff.com](http://www.jsondiff.com) doesn't run with HTTPS and ask, is JSONDiff secure?  The short answer is yes, but you shouldn't take my word for it.  

JSONDiff does all of the comparing in the browser.  It never sends any of your JSON data anywhere and you can run a little experiment to prove it.  

Open the developer tools in your browser and select the Network tab.  You'll see all of the requests your browser sends.  It looks like this:

![Network tools image](network_traffic.png)

Now do a JSON compare with some sample data and watch the requests.  There will be no new requests.  That shows that we don't send your data anywhere.

### What data does JSONDiff load?

JSONDiff loads the following files when it first starts up:

| File | Description |
| --- | --- |
| `index.html` | The main index page for the site |
| `reset.css` | The reset CSS file |
| `throbber.css` | A CSS loading icon |
| `jdd.css` | The CSS file for JSONDiff |
| `jquery.min.js` | jQuery library used in the JSONDiff UI |
| `jsl.format.js` and `jsl.parser.js` | The JSON formatter and parser that JSONDiff uses when doing a compare |
| `jdd.js` | The code that runs JSONDiff |
| `analytics.js` | Google Analytics that we use to see how many people are using JSONDiff.com |
| `favicon.ico` | The JSONDiff icon that shows up in the tab of your browser |

### Why don't you use HTTPS?

The short answer is that we don't need to.  HTTPS protects the traffic being sent between your browser and a server so nobody in the middle can see it.  JSONDiff doesn't send any data so there's nothing to protect.

### What data does JSONDiff send back over the Internet?

It sends nothing.  It just loads the open source files it needs to run and never sends any of the JSON data it is comparing anywhere.

### That still doesn't feel secure enough

If that still doesn't feel secure enough you have some other options.  It's very easy to host JSONDiff for yourself.  You can either run in a JSON container, or run on any web server that supports PHP.  You can even skip the PHP part if you don't want to support loading JSON automatically.  Just drop the JSONDiff files in your web server directory and you're done.