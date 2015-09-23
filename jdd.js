/******************************************************************************* 
 * 
 * Copyright 2015 Zack Grossbart
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 ******************************************************************************/
'use strict';

var jdd = {

    LEFT: 'left',
    RIGHT: 'right',

    EQUALITY: 'eq',
    TYPE: 'type',
    MISSING: 'missing',
    diffs: [],

    /**
     * Find the differences between the two objects and recurse into their sub objects.
     */
    findDiffs: function(/*Object*/ config1, /*Object*/ data1, /*Object*/ config2, /*Object*/ data2) {
       config1.currentPath.push('/');
       config2.currentPath.push('/');

       var key;
       var val;

       if (data1.length < data2.length) {
           /*
            * This means the second data has more properties than the first.
            * We need to find the extra ones and create diffs for them.
            */
           for (key in data2) {
               if (data2.hasOwnProperty(key)) {
                   val = data1[key];
                   if (!data1.hasOwnProperty(key)) {
                       jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                                                       config2, jdd.generatePath(config2, '/' + key),
                                                       'The right side of this object has more items than the left side', jdd.MISSING));
                   }
               }
           }
       }

       /*
        * Now we're going to look for all the properties in object one and
        * compare them to object two
        */
       for (key in data1) {
           if (data1.hasOwnProperty(key)) {
               val = data1[key];

               config1.currentPath.push(key);
    
               if (!data2.hasOwnProperty(key)) {
                   /*
                    * This means that the first data has a property which
                    * isn't present in the second data
                    */
                   jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                                                   config2, jdd.generatePath(config2),
                                                   'Missing property <code>' + key + '</code> from the object on the right side', jdd.MISSING));
                } else {
                    config2.currentPath.push(key);
                
                    jdd.diffVal(data1[key], config1, data2[key], config2);
                    config2.currentPath.pop();
                }
                config1.currentPath.pop();
           }
       }

       config1.currentPath.pop();
       config2.currentPath.pop();

       /*
        * Now we want to look at all the properties in object two that
        * weren't in object one and generate diffs for them.
        */
       for (key in data2) {
           if (data2.hasOwnProperty(key)) {
               val = data1[key];

               if (!data1.hasOwnProperty(key)) {
                   jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                                                   config2, jdd.generatePath(config2, key),
                                                   'Missing property <code>' + key + '</code> from the object on the left side', jdd.MISSING));
               }
           }
       }
    },

    /**
     * Generate the differences between two values.  This handles differences of object
     * types and actual values.
     */
    diffVal: function(val1, config1, val2, config2) { 

        if (_.isArray(val1)) {
            jdd.diffArray(val1, config1, val2, config2);
        } else if (_.isObject(val1)) {
            if (_.isArray(val2) || _.isString(val2) || _.isNumber(val2) || _.isBoolean(val2)) {
                jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                                                config2, jdd.generatePath(config2),
                                                'Both types should be objects', jdd.TYPE));
            } else {
                jdd.findDiffs(config1, val1, config2, val2);
            }
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
            jdd.diffBool(val1, config1, val2, config2);
        } 
    },

    /**
     * Arrays are more complex because we need to recurse into them and handle different length
     * issues so we handle them specially in this function.
     */
    diffArray: function(val1, config1, val2, config2) {
        if (!_.isArray(val2)) {
           jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                                           config2, jdd.generatePath(config2),
                                           'Both types should be arrays', jdd.TYPE));
        }

        if (val1.length < val2.length) {
            /*
             * Then there were more elements on the right side and we need to 
             * generate those differences.
             */
            for (var i = val1.length; i < val2.length; i++) {
                jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                                                config2, jdd.generatePath(config2, '[' + i + ']'),
                                                'Missing element <code>' + i + '</code> from the array on the left side', jdd.MISSING));
            }
        }
        _.each(val1, function(arrayVal, index) {
            if (val2.length <= index) {
                jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1, '[' + index + ']'),
                                                config2, jdd.generatePath(config2),
                                                'Missing element <code>' + index + '</code> from the array on the right side', jdd.MISSING));
            } else {
                config1.currentPath.push('/[' + index + ']');
                config2.currentPath.push('/[' + index + ']');
                
                jdd.diffVal(val1[index], config1, val2[index], config2);
                config1.currentPath.pop();
                config2.currentPath.pop();
            }
        });
    },

    /**
     * We handle boolean values specially because we can show a nicer message for them.
     */
    diffBool: function(val1, config1, val2, config2) { 
        if (!_.isBoolean(val2)) {
            jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                                            config2, jdd.generatePath(config2),
                                            'Both types should be booleans', jdd.TYPE));
        } else if (val1 !== val2) {
            if (val1) {
                jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                                                config2, jdd.generatePath(config2),
                                                'The left side is <code>true</code> and the right side is <code>false</code>', jdd.EQUALITY));
            } else {
                jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                                                config2, jdd.generatePath(config2),
                                                'The left side is <code>false</code> and the right side is <code>true</code>', jdd.EQUALITY));
            }
        }
    },

    /**
     * Format the object into the output stream and decorate the data tree with 
     * the data about this object.
     */
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

    /**
     * Generate the start of the an object in the output stream and push in the new path
     */
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

    /**
     * Finish the object, outdent, and pop off all the path
     */
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

    /**
     * Format a specific value into the output stream.
     */
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

                config.currentPath.push('/[' + index + ']');
                jdd.formatVal(arrayVal, config);
                config.currentPath.pop();
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

    /**
     * Generate a JSON path based on the specific configuration and an optional property.
     */
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

    /**
     * Add a new line to the output stream
     */
    newLine: function(config) {
        config.line++;
        return '\n';
    },

    /**
     * Sort all the relevant properties and return them in an alphabetical sort by property key
     */
    getSortedProperties: function(/*Object*/ obj) {
        var props = [];

        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                props.push(prop);
            }
        }

        props = props.sort(function(a, b) {
            return a.localeCompare(b);
        });

        return props;
    },

    /**
     * Generate the diff and verify that it matches a JSON path
     */
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
        };
    },

    /**
     * Get the current indent level
     */
    getTabs: function(/*int*/ indent) {
        var s = '';
        for (var i = 0; i < indent; i++) {
            s += '    ';
        }

        return s;
    },

    /**
     * Remove the trailing comma from the output.
     */
    removeTrailingComma: function(config) {
        /*
         * Remove the trailing comma
         */
        if (config.out.charAt(config.out.length - 1) === ',') {
            config.out = config.out.substring(0, config.out.length - 1);
        }
    },

    /**
     * Create a config object for holding differences
     */
    createConfig: function() {
        return {
            out: '',
            indent: -1,
            currentPath: [],
            paths: [],
            line: 1
        };
    },

    /**
     * Format the output pre tags.
     */
    formatPRETags: function() {
        _.each($('pre'), function(pre) {
            var codeBlock = $('<pre class="codeBlock"></pre>');
            var lineNumbers = $('<div class="gutter"></div>');
            codeBlock.append(lineNumbers);

            var codeLines = $('<div></div>');
            codeBlock.append(codeLines);

            var addLine = function(line, index) {
                var div = $('<div class="codeLine line' + (index + 1) + '"></div>');
                lineNumbers.append($('<span class="line-number">' + (index + 1) + '.</span>'));

                var span = $('<span class="code"></span');
                span.text(line);
                div.append(span);

                codeLines.append(div);
            };

            var lines = $(pre).text().split('\n');
            _.each(lines, addLine);
            
            codeBlock.addClass($(pre).attr('class'));
            codeBlock.attr('id', $(pre).attr('id'));

            $(pre).replaceWith(codeBlock);
        });
    },

    /**
     * Format the text edits which handle the JSON input
     */
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
            if (side === jdd.LEFT) {
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

        jdd.currentDiff = _.findIndex(jdd.diffs, function(diff) {
            return diff.path1.line === line;
        });

        if (jdd.currentDiff === 0) {
            jdd.currentDiff = 1;
        } else if (jdd.currentDiff === -1) {
            jdd.currentDiff = _.findIndex(jdd.diffs, function(diff) {
                return diff.path2.line === line;
            });
        }

        var buttons = $('<div id="buttons"><div>');
        var prev = $('<a href="#" title="Previous difference" id="prevButton">&lt;</a>');
        prev.addClass('disabled');
        prev.click(function(e) {
            e.preventDefault();
            jdd.highlightPrevDiff();
        });
        buttons.append(prev);

        buttons.append('<span id="prevNextLabel"></span>');

        var next = $('<a href="#" title="Next difference" id="nextButton">&gt;</a>');
        next.click(function(e) {
            e.preventDefault();
            jdd.highlightNextDiff();
        });
        buttons.append(next);

        $('ul.toolbar').append(buttons);
        jdd.updateButtonStyles();

        jdd.showDiffDetails(diffs);
    },

    highlightPrevDiff: function() {
        if (jdd.currentDiff > 1) {
            jdd.currentDiff--;
            jdd.highlightDiff(jdd.currentDiff);
            jdd.scrollToDiff(jdd.diffs[jdd.currentDiff]);

            jdd.updateButtonStyles();
        }
    },

    highlightNextDiff: function() {
        if (jdd.currentDiff < jdd.diffs.length - 1) {
            jdd.currentDiff++;
            jdd.highlightDiff(jdd.currentDiff);
            jdd.scrollToDiff(jdd.diffs[jdd.currentDiff]);

            jdd.updateButtonStyles();
        }
    },

    updateButtonStyles: function() {
        $('#prevButton').removeClass('disabled');
        $('#nextButton').removeClass('disabled');

        $('#prevNextLabel').text(jdd.currentDiff + ' of ' + (jdd.diffs.length - 1));
        
        if (jdd.currentDiff === 1) {
            $('#prevButton').addClass('disabled');
        } else if (jdd.currentDiff === jdd.diffs.length - 1) {
            $('#nextButton').addClass('disabled');
        }
    },

    /**
     * Highlight the diff at the specified index
     */
    highlightDiff: function(index) {
        jdd.handleDiffClick(jdd.diffs[index].path1.line, jdd.LEFT);
    },

    /**
     * Show the details of the specified diff
     */
    showDiffDetails: function(diffs) {
         _.each(diffs, function(diff) {
             var li = $('<li></li>');
             li.html(diff.msg);
             $('ul.toolbar').append(li);

             li.click(function() {
                 jdd.scrollToDiff(diff);
             });

         });
    },

    /**
     * Scroll the specified diff to be visible
     */
    scrollToDiff: function(diff) {
        $('html, body').animate({
            scrollTop: $('pre.left div.line' + diff.path1.line + ' span.code').offset().top
        }, 0);
    },

    /**
     * Process the specified diff
     */
    processDiffs: function() {
         var left = [];
         var right = [];

        _.each(jdd.diffs, function(diff, index) {
            $('pre.left div.line' + diff.path1.line + ' span.code').addClass(diff.type).addClass('diff');
            if (_.indexOf(left, diff.path1.line) === -1) {
                $('pre.left div.line' + diff.path1.line + ' span.code').click(function() {
                    jdd.handleDiffClick(diff.path1.line, jdd.LEFT);
                });
                left.push(diff.path1.line);
            }

            $('pre.right div.line' + diff.path2.line + ' span.code').addClass(diff.type).addClass('diff');
            if (_.indexOf(right, diff.path2.line) === -1) {
                $('pre.right div.line' + diff.path2.line + ' span.code').click(function() {
                    jdd.handleDiffClick(diff.path2.line, jdd.RIGHT);
                });
                right.push(diff.path2.line);
            }
        });

        jdd.diffs = jdd.diffs.sort(function(a, b) {
            return a.path1.line - b.path1.line;
        });

    },

    /**
     * Validate the input against the JSON parser
     */
    validateInput: function(json, side) {
         try {
            var result = jsl.parser.parse(json);

            if (side === jdd.LEFT) {
                $('#errorLeft').text('').hide();
                $('#textarealeft').removeClass('error');
            } else {
                $('#errorRight').text('').hide();
                $('#textarearight').removeClass('error');
            }

            return true;
        } catch (parseException) {
            if (side === jdd.LEFT) {
                $('#errorLeft').text(parseException.message).show();
                $('#textarealeft').addClass('error');
            } else {
                $('#errorRight').text(parseException.message).show();
                $('#textarearight').addClass('error');
            }
            return false;
        }
    },

    /**
     * Handle the file uploads
     */
    handleFiles: function(files, side) {
        var reader = new FileReader();

        reader.onload = (function(theFile) {
            return function(e) {
                if (side === jdd.LEFT) {
                    $('#textarealeft').val(e.target.result);
                } else {
                    $('#textarearight').val(e.target.result);
                }
            };
        })(files[0]);
        
        reader.readAsText(files[0]);
    },

    /**
     * Generate the report section with the diff
     */
    generateReport: function() {
         var report = $('#report');

        report.text('');

        var newDiff = $('<button>Perform a new diff</button>');
        report.append(newDiff);
        newDiff.click(function() {
            $('div.initContainer').show();
            $('div.diffcontainer').hide();
            $('div.diffcontainer pre').text('');
            $('ul.toolbar').text('');
        });

        if (jdd.diffs.length === 0) {
            report.append('<span>The two files were semantically  identical.</span>');
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

        var title = $('<div class="reportTitle"></div>');
        if (jdd.diffs.length === 1) {
            title.text('Found ' + (jdd.diffs.length - 1) + ' difference');
        } else {
            title.text('Found ' + (jdd.diffs.length - 1) + ' differences');
        }
        
        report.prepend(title);

        var filterBlock = $('<span class="filterBlock">Show:</span>');

        /*
         * The missing checkbox
         */
        if (missingCount > 0) {
            var missing = $('<label><input id="showMissing" type="checkbox" name="checkbox" value="value" checked="true"></label>');
            if (missingCount === 1) {
                missing.append(missingCount + ' missing property');
            } else {
                missing.append(missingCount + ' missing properties');
            }
            missing.children('input').click(function() {
                if (!$(this).prop('checked')) {
                    $('span.code.diff.missing').addClass('missing_off').removeClass('missing');
                } else {
                    $('span.code.diff.missing_off').addClass('missing').removeClass('missing_off');
                }
            });
            filterBlock.append(missing);
        }

        /*
         * The types checkbox
         */
        if (typeCount > 0) {
            var types = $('<label><input id="showTypes" type="checkbox" name="checkbox" value="value" checked="true"></label>');
            if (typeCount === 1) {
                types.append(typeCount + ' incorrect type');
            } else {
                types.append(typeCount + ' incorrect types');
            }
    
            types.children('input').click(function() {
                if (!$(this).prop('checked')) {
                    $('span.code.diff.type').addClass('type_off').removeClass('type');
                } else {
                    $('span.code.diff.type_off').addClass('type').removeClass('type_off');
                }
            });
            filterBlock.append(types);
        }

        /*
         * The equals checkbox
         */
        if (eqCount > 0) {
            var eq = $('<label><input id="showEq" type="checkbox" name="checkbox" value="value" checked="true"></label>');
            if (eqCount === 1) {
                eq.append(eqCount + ' unequal value');
            } else {
                eq.append(eqCount + ' unequal values');
            }
            eq.children('input').click(function() {
                if (!$(this).prop('checked')) {
                    $('span.code.diff.eq').addClass('eq_off').removeClass('eq');
                } else {
                    $('span.code.diff.eq_off').addClass('eq').removeClass('eq_off');
                }
            });
            filterBlock.append(eq);
        }

        report.append(filterBlock);


    },

    /**
     * Implement the compare button and complete the compare process
     */
    compare: function() {

        $('body').addClass('progress');
        $('compate').attr('disabled', 'true');

        /*
         * We'll start by running the text through JSONlint since it gives
         * much better error messages.
         */
         var leftValid = jdd.validateInput($('#textarealeft').val(), jdd.LEFT);
         var rightValid = jdd.validateInput($('#textarearight').val(), jdd.RIGHT);

        if (!leftValid || !rightValid) {
            $('body').removeClass('progress');
            $('compate').attr('disabled', '');
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

        //console.log('diffs: ' + JSON.stringify(jdd.diffs));

        if (jdd.diffs.length > 0) {
            jdd.highlightDiff(0);
            jdd.currentDiff = 1;
        }

        $('body').removeClass('progress');
        $('compate').attr('disabled', '');

        /*
         * We want to switch the toolbar bar between fixed and absolute position when you 
         * scroll so you can get the maximum number of toolbar items.
         */
        var toolbarTop = $('#toolbar').offset().top - 15;
        $(window).scroll(function() {
            if (toolbarTop < $(window).scrollTop()) {
                $('#toolbar').css('position', 'fixed').css('top', '10px');
            } else {
                $('#toolbar').css('position', 'absolute').css('top', '');
            }
        });

    },

    /**
     * Load in the sample data
     */
    loadSampleData: function() {
         $('#textarealeft').val('{"Aidan Gillen": {"array": ["Game of Thron\\"es","The Wire"],"string": "some string","int": 2,"aboolean": true, "boolean": true,"object": {"foo": "bar","object1": {"new prop1": "new prop value"},"object2": {"new prop1": "new prop value"},"object3": {"new prop1": "new prop value"},"object4": {"new prop1": "new prop value"}}},"Amy Ryan": {"one": "In Treatment","two": "The Wire"},"Annie Fitzgerald": ["Big Love","True Blood"],"Anwan Glover": ["Treme","The Wire"],"Alexander Skarsgard": ["Generation Kill","True Blood"]}');
         $('#textarearight').val('{"Aidan Gillen": {"array": ["Game of Thrones","The Wire"],"string": "some string","int": "2","otherint": 4, "aboolean": "true", "boolean": false,"object": {"foo": "bar"}},"Amy Ryan": ["In Treatment","The Wire"],"Annie Fitzgerald": ["True Blood","Big Love","The Sopranos","Oz"],"Anwan Glover": ["Treme","The Wire"],"Alexander Skarsg?rd": ["Generation Kill","True Blood"],"Alice Farmer": ["The Corner","Oz","The Wire"]}');
    }
};



jQuery(document).ready(function() {
    $('#compare').click(function() {
        jdd.compare();
    });

    $('#sample').click(function(e) {
        e.preventDefault();
        jdd.loadSampleData();
    });

    $(document).keydown(function(event) {
        if (event.keyCode === 78 || event.keyCode === 39) {
            /*
             * The N key or right arrow key
             */
            jdd.highlightNextDiff();
        } else if (event.keyCode === 80 || event.keyCode === 37) {
            /*
             * The P key or left arrow key
             */
            jdd.highlightPrevDiff();
        }
    });
});
