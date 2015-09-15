'use strict';

var jdd = {
    out: '',
    indent: -1,

    formatAndDecorate: function(/*Object*/ data, /*Object*/ decoratedData) {
        if (!jdd.line) {
            jdd.line = 0;
        }

        jdd.indent++;
        jdd.out += '{';
        jdd.line++;

        if (jdd.indent === 0) {
            jdd.indent++;
        }
        _.each(data, function(val, key) {
            jdd.out += '\n' + jdd.getTabs(jdd.indent) + '"' + key + '": ';
            jdd.formatVal(val, decoratedData);
        });
        if (jdd.indent === 0) {
            jdd.indent--;
        }

        jdd.removeTrailingComma();

        jdd.indent--;
        jdd.out += '\n' + jdd.getTabs(jdd.indent) + '}';
        jdd.line++;
        

    },

    formatVal: function(val, decoratedData) { 
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
            jdd.line++;
        } else if (_.isObject(val)) {
            jdd.formatAndDecorate(val, decoratedData);
        } else if (_.isString(val)) {
            jdd.out += '"' + val + '",';
            jdd.line++;
        } else if (_.isNumber(val)) {
            jdd.out += val + ',';
            jdd.line++;
        } else if (_.isBoolean(val)) {
            jdd.out += val + ',';
            jdd.line++;
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
    }

};




jQuery(document).ready(function() {
    //console.log('data: ' + JSON.stringify(DATA));
    jdd.formatAndDecorate(DATA);
    $('#out').text(jdd.out);

    jdd.formatPRETags();
});
