'use strict';

var jdd = {
    formatAndDecorate: function(/*Object*/ config, /*Object*/ data) {
        jdd.startObject(config);
        config.currentPath.push('/');
        
        var props = jdd.getSortedProperties(data);
        
        /*
         * If the first set has more than the second then we will catch it
         * when we compare values.  However, if the second has more then
         * we need to catch that here.
         */
        
        _.each(props, function(key) {
            config.out += jdd.newLine(config) + jdd.getTabs(config.indent) + '"' + key + '": ';
            config.currentPath.push(key);
            config.paths.push({
                path: jdd.generatePath(config),
                line: config.line
            });
            jdd.formatVal(data[key], config);
            config.currentPath.pop();
        });

        jdd.finishObject(config);
        config.currentPath.pop();
    },

    startObject: function(config) {
        config.indent++;
        config.out += '{';
        
        if (config.indent === 0) {
            config.indent++;
        }
    },

    finishObject: function(config) {
        if (config.indent === 0) {
            config.indent--;
        }

        jdd.removeTrailingComma(config);

        config.indent--;
        config.out += jdd.newLine(config) + jdd.getTabs(config.indent) + '}';
        if (config.indent !== 0) {
            config.out += ',';
        } else {
            config.out += jdd.newLine(config);
        }
    },

    formatVal: function(val, config) { 
        if (_.isArray(val)) {
            config.out += '[';
            
            config.indent++;
            _.each(val, function(arrayVal, index) {
                config.out += jdd.newLine(config) + jdd.getTabs(config.indent);
                config.paths.push({
                    path: jdd.generatePath(config, '[' + index + ']'),
                    line: config.line
                });
                jdd.formatVal(arrayVal, config);
            });
            jdd.removeTrailingComma(config);
            config.indent--;

            config.out += jdd.newLine(config) + jdd.getTabs(config.indent) + ']' + ',';
        } else if (_.isObject(val)) {
            jdd.formatAndDecorate(config, val);
        } else if (_.isString(val)) {
            config.out += '"' + val.replace('\"', '\\"') + '",';
        } else if (_.isNumber(val)) {
            config.out += val + ',';
        } else if (_.isBoolean(val)) {
            config.out += val + ',';
        } 
    },

    generatePath: function(config, prop) {
        var s = '';
        _.each(config.currentPath, function(path) {
            s += path;
        });

        if (prop) {
            s += '/' + prop;
        }

        return s;
    },

    newLine: function(config) {
        config.line++;
        return '\n';
    },

    getSortedProperties: function(/*Object*/ obj) {
        var props = [];

        for (var prop in obj) {
            props.push(prop);
        }

        props = props.sort(function(a, b) {
            return a.localeCompare(b);
        });

        return props;
    },

    generateDiff: function(/*int*/ line1, /*int*/ line2, /*String*/ msg) {
        return {
            line1: line1,
            line2: line2,
            msg: msg
        }
    },

    getTabs: function(/*int*/ indent) {
        var s = '';
        for (var i = 0; i < indent; i++) {
            s += '    ';
        }

        return s;
    },

    removeTrailingComma: function(config) {
        /*
         * Remove the trailing comma
         */
        if (config.out.charAt(config.out.length - 1) === ',') {
            config.out = config.out.substring(0, config.out.length - 1);
        }
    },

    createConfig: function() {
        return {
            out: '',
            indent: -1,
            currentPath: [],
            paths: [],
            line: 1
        }
    },

    formatPRETags: function() {
        var pre = document.getElementsByTagName('pre'), pl = pre.length;

        for (var i = 0; i < pl; i++) {
            pre[i].innerHTML = '<span class="line-number"></span>' + pre[i].innerHTML + '<span class="cl"></span>';
            var num = pre[i].innerHTML.split(/\n/).length;
            for (var j = 0; j <= num; j++) {
                var line_num = pre[i].getElementsByTagName('span')[0];
                line_num.innerHTML += '<span>' + (j + 1) + '</span>';
            }
        }
    }
};




jQuery(document).ready(function() {
    //console.log('data: ' + JSON.stringify(DATA));
    var config = jdd.createConfig();

    jdd.formatAndDecorate(config, DATA);
    $('#out').text(config.out);
    console.log('paths: ' + JSON.stringify(config.paths));


    var config2 = jdd.createConfig();

    jdd.formatAndDecorate(config2, DATA2);
    $('#out2').text(config2.out);

    jdd.formatPRETags();
});
