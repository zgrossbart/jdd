'use strict';

var jdd = {
    formatAndDecorate: function(/*Object*/ config, /*Object*/ data) {
        jdd.startObject(config);
        
        var props = jdd.getSortedProperties(data);
        
        /*
         * If the first set has more than the second then we will catch it
         * when we compare values.  However, if the second has more then
         * we need to catch that here.
         */
        
        _.each(props, function(key) {
            config.out += '\n' + jdd.getTabs(config.indent) + '"' + key + '": ';
            jdd.formatVal(data[key], config);
        });

        jdd.finishObject(config);
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
        config.out += '\n' + jdd.getTabs(config.indent) + '}';
        if (config.indent !== 0) {
            config.out += ',';
        } else {
            config.out += '\n';
        }
    },

    formatVal: function(val, config) { 
        if (_.isArray(val)) {
            config.out += '[';

            config.indent++;
            _.each(val, function(arrayVal) {
                config.out += '\n' + jdd.getTabs(config.indent);
                jdd.formatVal(arrayVal, config);
            });
            jdd.removeTrailingComma(config);
            config.indent--;

            config.out += '\n' + jdd.getTabs(config.indent) + ']' + ',';
        } else if (_.isObject(val)) {
            jdd.formatAndDecorate(config, val);
        } else if (_.isString(val)) {
            config.out += '"' + val + '",';
        } else if (_.isNumber(val)) {
            config.out += val + ',';
        } else if (_.isBoolean(val)) {
            config.out += val + ',';
        } 
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
    var config = {
        out: '',
        indent: -1
    };

    jdd.formatAndDecorate(config, DATA);
    $('#out').text(config.out);


    var config2 = {
        out: '',
        indent: -1
    };

    jdd.formatAndDecorate(config2, DATA2);
    $('#out2').text(config2.out);

    jdd.formatPRETags();
});
