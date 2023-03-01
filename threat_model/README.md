# JSONDiff Threat Model

This document is a threat model for JSONDiff.  This covers the software running at [jsondiff.com](https://www.jsondiff.com/) as well as the open source project which can be hosted on other platforms.

## Architecture

JSONDiff is a one page JavaScript application running in a browser.  It doesn't communicate externally, have any data storage, or contain any personal information of any kind.

More information about what data JSONDiff loads while performing differences is available in the [JSONDiff Readme file](../#is-jsondiff-secure).

![JSONDiff architecture image](images/jsondiff_arch.png)

### `proxy.php`

JSONDiff is almost entirely a browser-based application and can be run with a simple HTTP file server or from a local file system.  The one exception is the `proxy.php` file.

This file acts as a simple proxy server to ensure that 

### Deployment

JSONDiff uses