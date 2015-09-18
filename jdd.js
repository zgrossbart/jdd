'use strict';

var jdd = {

    EQUALITY: 'eq',
    TYPE: 'type',
    MISSING: 'missing',

    diffs: [],

    findDiffs: function(/*Object*/ config1, /*Object*/ data1, /*Object*/ config2, /*Object*/ data2) {
       config1.currentPath.push('/');
       config2.currentPath.push('/');
       if (data1.length < data2.length) {
           /*
            * This means the second data has more properties than the first.
            * We need to find the extra ones and create diffs for them.
            */
           _.each(data2, function(val, key) {
               if (!data1.hasOwnProperty(key)) {
                   jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                                                   config2, jdd.generatePath(config2, '/' + key),
                                                   'Wrong number of items', jdd.MISSING));
               }
           });
       }

       /*
        * Now we're going to look for all the properties in object one and
        * compare them to object two
        */
       _.each(data1, function(val, key) {
           config1.currentPath.push(key);

           if (!data2.hasOwnProperty(key)) {
               /*
                * This means that the first data has a property which
                * isn't present in the second data
                */
               jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                                               config2, jdd.generatePath(config2),
                                               'Missing property (' + key + ') from right side', jdd.MISSING));
            } else {
                config2.currentPath.push(key);
            
                jdd.diffVal(data1[key], config1, data2[key], config2);
                config2.currentPath.pop();
            }
            config1.currentPath.pop();
       });

       config1.currentPath.pop();
       config2.currentPath.pop();

       /*
        * Now we want to look at all the properties in object two that
        * weren't in object one and generate diffs for them.
        */
       _.each(data2, function(val, key) {
           if (!data1.hasOwnProperty(key)) {
               jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                                               config2, jdd.generatePath(config2, key),
                                               'Missing property (' + key + ') from left side', jdd.MISSING));
           }

       });

    },

    diffVal: function(val1, config1, val2, config2) { 

        if (_.isArray(val1)) {
            if (!_.isArray(val2)) {
               jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                                               config2, jdd.generatePath(config2),
                                               'Both types should be arrays', jdd.TYPE));
            }
            _.each(val1, function(arrayVal, index) {
                config1.currentPath.push('/[' + index + ']');
                config2.currentPath.push('/[' + index + ']');
                jdd.diffVal(val1[index], config1, val2[index], config2);
                config1.currentPath.pop();
                config2.currentPath.pop();
            });
        } else if (_.isObject(val1)) {
            if (!_.isObject(val2)) {
               jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                                               config2, jdd.generatePath(config2),
                                               'Both types should be objects', jdd.TYPE));
            }

            jdd.findDiffs(config1, val1, config2, val2);
        } else if (_.isString(val1)) {
            if (!_.isString(val2)) {
                jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                                                config2, jdd.generatePath(config2),
                                               'Both types should be strings', jdd.TYPE));
            } else if (val1 !== val2) {
                jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                                                config2, jdd.generatePath(config2),
                                               'Both sides should be equal strings', jdd.EQUALITY));
            }
        } else if (_.isNumber(val1)) {
            if (!_.isNumber(val2)) {
                jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                                                config2, jdd.generatePath(config2),
                                               'Both types should be numbers', jdd.TYPE));
            } else if (val1 !== val2) {
                jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                                                config2, jdd.generatePath(config2),
                                               'Both sides should be equal numbers', jdd.EQUALITY));
            }
        } else if (_.isBoolean(val1)) {
            if (!_.isBoolean(val2)) {
                jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                                                config2, jdd.generatePath(config2),
                                                'Both types should be booleans', jdd.TYPE));
            } else if (val1 !== val2) {
                jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                                                config2, jdd.generatePath(config2),
                                                'Both sides should be equal booleans', jdd.EQUALITY));
            }
        } 
    },

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

        if (config.paths.length === 0) {
            /*
             * Then we are at the top of the object and we want to add 
             * a path for it.
             */
            config.paths.push({
                path: jdd.generatePath(config),
                line: config.line
            });
        }
        
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

        if (s.length === 0) {
            return '/';
        } else {
            return s;
        }
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

    generateDiff: function(config1, path1, config2, path2, /*String*/ msg, type) {
        if (path1 !== '/' && path1.charAt(path1.length - 1) === '/') {
            path1 = path1.substring(0, path1.length - 1);
        }

        if (path2 !== '/' && path2.charAt(path2.length - 1) === '/') {
            path2 = path2.substring(0, path2.length - 1);
        }

        var pathObj1 = _.find(config1.paths, function(path) {
            return path.path === path1;
        });

        var pathObj2 = _.find(config2.paths, function(path) {
            return path.path === path2;
        });

        if (!pathObj1) {
            throw 'Unable to find line number for(' + msg + '): ' + path1;
        }

        if (!pathObj2) {
            throw 'Unable to find line number for(' + msg + '): ' + path2;
        }

        return {
            path1: pathObj1,
            path2: pathObj2,
            type: type,
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
        _.each($('pre'), function(pre) {
            var codeBlock = $('<pre class="codeBlock"></pre>');
            var lineNumbers = $('<div class="gutter"></div>');
            codeBlock.append(lineNumbers);

            var codeLines = $('<div></div>');
            codeBlock.append(codeLines);

            var addLine = function(line, index) {
                var div = $('<div class="codeLine line' + (index + 1) + '"></div>')
                lineNumbers.append($('<span class="line-number">' + (index + 1) + '.</span>'));

                var span = $('<span class="code"></span');
                span.text(line);
                div.append(span);

                codeLines.append(div);
            };

            var lines = $(pre).text().split('\n');
            _.each(lines, addLine);
            
            codeBlock.addClass($(pre).attr('class'));

            $(pre).replaceWith(codeBlock);
        });
    },

    formatTextAreas: function() {
        _.each($('textarea'), function(textarea) {
            var codeBlock = $('<div class="codeBlock"></div>');
            var lineNumbers = $('<div class="gutter"></div>');
            codeBlock.append(lineNumbers);

            var addLine = function(line, index) {
                lineNumbers.append($('<span class="line-number">' + (index + 1) + '.</span>'));
            };

            var lines = $(textarea).val().split('\n');
            _.each(lines, addLine);
            
            $(textarea).replaceWith(codeBlock);
            codeBlock.append(textarea);
        });
    },

    handleDiffClick: function (line, side) {
        var diffs = _.filter(jdd.diffs, function(diff) {
            if (side === 'left') {
                return line === diff.path1.line;
            } else {
                return line === diff.path2.line;
            }
        });

        $('pre.left span.code').removeClass('selected');
        $('pre.right span.code').removeClass('selected');
        $('ul.toolbar').text('');

        _.each(diffs, function(diff) {
            $('pre.left div.line' + diff.path1.line + ' span.code').addClass('selected');
            $('pre.right div.line' + diff.path2.line + ' span.code').addClass('selected');
        });

        jdd.showDiffDetails(diffs);
    },

    showDiffDetails: function(diffs) {
         _.each(diffs, function(diff) {
             var li = $('<li></li>');
             li.text(diff.msg);
             $('ul.toolbar').append(li);
         });
    },

    processDiffs: function() {
         var left = [];
         var right = [];

        _.each(jdd.diffs, function(diff, index) {
            $('pre.left div.line' + diff.path1.line + ' span.code').addClass(diff.type).addClass('diff');
            if (_.indexOf(left, diff.path1.line) === -1) {
                $('pre.left div.line' + diff.path1.line + ' span.code').click(function() {
                    jdd.handleDiffClick(diff.path1.line, 'left');
                });
                left.push(diff.path1.line);
            }

            $('pre.right div.line' + diff.path2.line + ' span.code').addClass(diff.type).addClass('diff');
            if (_.indexOf(right, diff.path2.line) === -1) {
                $('pre.right div.line' + diff.path2.line + ' span.code').click(function() {
                    jdd.handleDiffClick(diff.path2.line, 'right');
                });
                right.push(diff.path2.line);
            }


        });
    },

    validateInput: function(json, side) {
         try {
            var result = jsl.parser.parse(json);

            if (side === 'left') {
                $('#errorLeft').text('').hide();
                $('#textarealeft').removeClass('error');
            } else {
                $('#errorRight').text('').hide();
                $('#textarearight').removeClass('error');
            }

            return true;
        } catch (parseException) {
            if (side === 'left') {
                $('#errorLeft').text(parseException.message).show();
                $('#textarealeft').addClass('error');
            } else {
                $('#errorRight').text(parseException.message).show();
                $('#textarearight').addClass('error');
            }
            return false;
        }
    },

    handleFiles: function(files, side) {
        var reader = new FileReader();

        reader.onload = (function(theFile) {
            return function(e) {
                if (side === 'left') {
                    $('#textarealeft').val(e.target.result);
                } else {
                    $('#textarearight').val(e.target.result);
                }
            };
        })(files[0]);
        
        reader.readAsText(files[0]);
    },

    generateReport: function() {
         var report = $('#report');

        report.text('');
        if (jdd.diffs.length === 0) {
            report.text('The two files were semantically  identical');
            return;
        }

        var typeCount = 0;
        var eqCount = 0;
        var missingCount = 0;

        _.each(jdd.diffs, function(diff) {
            if (diff.type === jdd.EQUALITY) {
                eqCount++;
            } else if (diff.type === jdd.MISSING) {
                missingCount++;
            } else if (diff.type === jdd.TYPE) {
                typeCount++;
            }
        });

        var title = $('<h3></h3>');
        title.text('There were ' + jdd.diffs.length + ' differences');
        report.prepend(title);

        var filterBlock = $('<span class="filterBlock">Show:</span>');

        /*
         * The missing checkbox
         */
        var missing = $('<label><input id="showMissing" type="checkbox" name="checkbox" value="value" checked="true">' + missingCount + ' missing properties</label>');
        missing.children('input').click(function() {
            if (!$(this).prop('checked')) {
                $('span.code.diff.missing').addClass('missing_off').removeClass('missing');
            } else {
                $('span.code.diff.missing_off').addClass('missing').removeClass('missing_off');
            }
        });
        filterBlock.append(missing);

        /*
         * The types checkbox
         */
        var types = $('<label><input id="showTypes" type="checkbox" name="checkbox" value="value" checked="true">' + typeCount + ' incorrect types</label>');
        types.children('input').click(function() {
            if (!$(this).prop('checked')) {
                $('span.code.diff.type').addClass('type_off').removeClass('type');
            } else {
                $('span.code.diff.type_off').addClass('type').removeClass('type_off');
            }
        });
        filterBlock.append(types);

        /*
         * The equals checkbox
         */
        var eq = $('<label><input id="showEq" type="checkbox" name="checkbox" value="value" checked="true">' + eqCount + ' unequal Values</label>');
        eq.children('input').click(function() {
            if (!$(this).prop('checked')) {
                $('span.code.diff.eq').addClass('eq_off').removeClass('eq');
            } else {
                $('span.code.diff.eq_off').addClass('eq').removeClass('eq_off');
            }
        });
        filterBlock.append(eq);

        report.append(filterBlock);


    },

    compare: function() {

        /*
         * We'll start by running the text through JSONlint since it gives
         * much better error messages.
         */
        if (!jdd.validateInput($('#textarealeft').val(), 'left')) {
            return;
        }

        if (!jdd.validateInput($('#textarearight').val(), 'right')) {
            return;
        }

        $('div.initContainer').hide();
        $('div.diffcontainer').show();

        jdd.diffs = [];

        

        var left = JSON.parse($('#textarealeft').val());
        var right = JSON.parse($('#textarearight').val());

        
        var config = jdd.createConfig();
        jdd.formatAndDecorate(config, left);
        $('#out').text(config.out);
        
        var config2 = jdd.createConfig();
        jdd.formatAndDecorate(config2, right);
        $('#out2').text(config2.out);
    
        jdd.formatPRETags();
    
        config.currentPath = [];
        config2.currentPath = [];
    
        jdd.findDiffs(config, left, config2, right);
        jdd.processDiffs();
        jdd.generateReport();

    }
};




jQuery(document).ready(function() {
    //console.log('data: ' + JSON.stringify(DATA));
    
    //console.log('diffs: ' + JSON.stringify(jdd.diffs));

    $('#compare').click(function() {
        jdd.compare();
    });

   // jdd.formatTextAreas();
});
