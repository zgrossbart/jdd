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

JSONDiff has the following external dependencies:

#### Runtime

* [jQuery](https://jquery.com/) (loaded from the Google APIs CDN to improve performance)
* Google Analytics
* [Google AdSense](https://adsense.google.com/)

#### Test time

* [qUnit](https://qunitjs.com/)

All of these dependencies are currently hard-coded.  There is no build process for JSONDiff.

### Deployment

JSONDiff can be deployed to any HTTP server with the ability to serve static files.  It can also be hosted in any container.  A server capable of running PHP is also required if you want to support the extra functionality of the `proxy.php` file.

JSONDiff is currently hosted on the Grid Hosting service offered by [MediaTemple](https://mediatemple.net/).

Deployment is handled by connecting to a file server via sFTP and pushing the new version.  Deployments are currently manual.

JSONDiff also provides two sample Docker files (one for Ubuntu and one for Alpine images).  They are provided as samples and are not considered part of the main deployment of JSONDiff.

### Testing

JSONDiff has a full set of functional tests powered by the [qUnit](https://qunitjs.com/) framework.  These tests can be accessed and run on the [index-test.html](https://www.jsondiff.com/index-test.html) page.  Accessing this page will execute a live set of tests every time the page is loaded.

These tests cover the basic functionality of the JSONDiff tool, the functionality of the `proxy.php` service, and other edge cases.  Whenever a bug is found and fixed in JSONDiff a corresponding test case is added.

### Monitoring

JSONDiff is monitored with the [JSONDiff Upptime project](https://zgrossbart.github.io/jdd-upptime/).  This project provides periodic monitoring of the deployment at JSONDiff.com.  When errors are detected an issue is generated and the site administrators are notified via email.

## Threats

JSONDiff is a static application with no data storage.  That means large threats areas don't apply to the application.

### Threats to data

JSONDiff doesn't load or store any data as any part of operation.  As a result it doesn't supply encryption in transit or encryption at rest because there's no data to encrypt.

The `proxy.php` service will load data from other sites, but that service has no special access and can only load data that is already publicly available on the Internet.  This service will load data encryped with SSL if the location of that data is specified to use SSL.

All data served by the `proxy.php` file is encrypted with SSL.

### Coding threats

JSONDiff uses a protected main branch and requires pull requests when merging code.  Those pull requests do not require multiple reviewers since there is only one committer on the project.

**Potential threat** - The code for JSONDiff is not peer reviewed before merging into the main branch.  This threat is mitigated by making all source code for JSONDiff open source and available for inspection by any third-party.

**Potential threat** - JSONDiff doesn't contain any static code analysis as part of the build process.  This threat is mitigated by the manual use of 