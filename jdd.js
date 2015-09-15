'use strict';

var jdd = {
    out: '',
    indent: -1,

    formatAndDecorate: function(/*Object*/ data) {
        jdd.indent++;
        jdd.out += '{';
        
        if (jdd.indent === 0) {
            jdd.indent++;
        }

        var props = [];

        for (var prop in data) {
            props.push(prop);
        }

        props = props.sort(function(a, b) {
            return a.localeCompare(b);
        });
        
        _.each(props, function(key) {
            jdd.out += '\n' + jdd.getTabs(jdd.indent) + '"' + key + '": ';
            jdd.formatVal(data[key]);
        });
        if (jdd.indent === 0) {
            jdd.indent--;
        }

        jdd.removeTrailingComma();

        jdd.indent--;
        jdd.out += '\n' + jdd.getTabs(jdd.indent) + '}';
        if (jdd.indent !== 0) {
            jdd.out += ',';
        } else {
            jdd.out += '\n';
        }
    },

    formatVal: function(val) { 
        if (_.isArray(val)) {
            jdd.out += '[';

            jdd.indent++;
            _.each(val, function(arrayVal) {
                jdd.out += '\n' + jdd.getTabs(jdd.indent);
                jdd.formatVal(arrayVal);
            });
            jdd.removeTrailingComma();
            jdd.indent--;

            jdd.out += '\n' + jdd.getTabs(jdd.indent) + ']' + ',';
        } else if (_.isObject(val)) {
            jdd.formatAndDecorate(val);
        } else if (_.isString(val)) {
            jdd.out += '"' + val + '",';
        } else if (_.isNumber(val)) {
            jdd.out += val + ',';
        } else if (_.isBoolean(val)) {
            jdd.out += val + ',';
        } 
    },

    getTabs: function(/*int*/ indent) {
        var s = '';
        for (var i = 0; i < indent; i++) {
            s += '    ';
        }

        return s;
    },

    removeTrailingComma: function() {
        /*
         * Remove the trailing comma
         */
        if (jdd.out.charAt(jdd.out.length - 1) === ',') {
            jdd.out = jdd.out.substring(0, jdd.out.length - 1);
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
    }, 
    reset: function() {
         jdd.indent = -1;
         jdd.out = '';
    }

};




jQuery(document).ready(function() {
    //console.log('data: ' + JSON.stringify(DATA));
    jdd.formatAndDecorate(DATA);
    $('#out').text(jdd.out);

    jdd.reset();

    jdd.formatPRETags();
});
