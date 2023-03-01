# JSONDiff Threat Model

This document is a threat model for JSONDiff.  This covers the software running at [jsondiff.com](https://www.jsondiff.com/) as well as the open source project which can be hosted on other platforms.

## Architecture

JSONDiff is a one page JavaScript application running in a browser.  It doesn't communicate externally, have any data storage, or contain any personal information of any kind.

More information about what data JSONDiff loads while performing differences is available in the [JSONDiff Readme file](../#is-jsondiff-secure).

![JSONDiff architecture image](images/jsondiff_arch.png)

### `proxy.php`

JSONDiff is almost entirely a browser-based application and can be run with a simple HTTP file server or from a local file system.  The one exception is the `proxy.php` file.

This file acts as a simple proxy server to allow JSONDiff to load JSON files from other locations on the Internet.  You can use this project by accessing JSONDiff with an URL like this:

```
https://jsondiff.com/?left=https://jsondiff.com/one.json&right=https://jsondiff.com/two.json
```

This will cause the `proxy.php` service to load the two files specified with the `left` and `right` URL parameters.

### Dependencies

### Deployment

JSONDiff can be deployed to any HTTP server with the ability to serve static files.  It can also be hosted in any container.  A server capable of running PHP is also required if you want to support the extra functionality of the `proxy.php` file.

JSONDiff is currently hosted on the Grid Hosting service offered by [MediaTemple](https://mediatemple.net/).

Deployment is handled by connecting to a file server via sFTP and pushing the new version.  Deployments are currently manual.

JSONDiff also provides two sample Docker files (one for Ubuntu and one for Alpine images).  They are provided as samples and are not considered part of the main deployment of JSONDiff.

### Testing

JSONDiff has a full set of functional tests provided by 

### Monitoring