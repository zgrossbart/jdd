/*******************************************************************************
 *
 * Copyright 2015-2017 Zack Grossbart
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

// utilites
//
/**
 * Fixing typeof
 * takes value and returns type of value
 * @param  value
 * return typeof value
 */
function getType(value) {
    if ((function() {
        return value && (value !== this);
    }).call(value)) {
        //fallback on 'typeof' for truthy primitive values
        return typeof value;
    }
    return ({}).toString.call(value).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
}

/**
 * Iterate over array of objects and call given callback for each item in the array
 * Optionally may take this as scope
 *
 * @param array
 * @param callback
 * @param optional scope
 */
function forEach(array, callback, scope) {
    for (var idx = 0; idx < array.length; idx++) {
        callback.call(scope, array[idx], idx, array);
    }
}

/**
 * The jdd object handles all of the functions for the main page.  It finds the diffs and manages
 * the interactions of displaying them.
 */

/*global Jdd:true */
function Jdd($parent) {
    return {

        LEFT: 'left',
        RIGHT: 'right',

        EQUALITY: 'eq',
        TYPE: 'type',
        MISSING: 'missing',
        diffs: [],
        requestCount: 0,

        /**
         * Find the differences between the two objects and recurse into their sub objects.
         */
        findDiffs: function(/*Object*/ config1, /*Object*/ data1, /*Object*/ config2, /*Object*/ data2) {
            config1.currentPath.push('/');
            config2.currentPath.push('/');

            var key;
            // no un-used vars
            // var val;

            if (data1.length < data2.length) {
                /*
                 * This means the second data has more properties than the first.
                 * We need to find the extra ones and create diffs for them.
                 */
                for (key in data2) {
                    if (data2.hasOwnProperty(key)) {
                        // no un-used vars
                        // val = data1[key];
                        if (!data1.hasOwnProperty(key)) {
                            this.diffs.push(this.generateDiff(config1, this.generatePath(config1),
                                config2, this.generatePath(config2, '/' + key),
                                'The right side of this object has more items than the left side', this.MISSING));
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
                    // no un-used vars
                    // val = data1[key];

                    config1.currentPath.push(key);

                    if (!data2.hasOwnProperty(key)) {
                        /*
                         * This means that the first data has a property which
                         * isn't present in the second data
                         */
                        this.diffs.push(this.generateDiff(config1, this.generatePath(config1),
                            config2, this.generatePath(config2),
                            'Missing property <code>' + key + '</code> from the object on the right side', this.MISSING));
                    } else {
                        config2.currentPath.push(key);

                        this.diffVal(data1[key], config1, data2[key], config2);
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
                    // no un-used vars
                    // val = data1[key];

                    if (!data1.hasOwnProperty(key)) {
                        this.diffs.push(this.generateDiff(config1, this.generatePath(config1),
                            config2, this.generatePath(config2, key),
                            'Missing property <code>' + key + '</code> from the object on the left side', this.MISSING));
                    }
                }
            }
        },

        /**
         * Generate the differences between two values.  This handles differences of object
         * types and actual values.
         */
        diffVal: function(val1, config1, val2, config2) {

            if (getType(val1) === 'array') {
                this.diffArray(val1, config1, val2, config2);
            } else if (getType(val1) === 'object') {
                if (['array', 'string', 'number', 'boolean', 'null'].indexOf(getType(val2)) > -1) {
                    this.diffs.push(this.generateDiff(config1, this.generatePath(config1),
                        config2, this.generatePath(config2),
                        'Both types should be objects', this.TYPE));
                } else {
                    this.findDiffs(config1, val1, config2, val2);
                }
            } else if (getType(val1) === 'string') {
                if (getType(val2) !== 'string') {
                    this.diffs.push(this.generateDiff(config1, this.generatePath(config1),
                        config2, this.generatePath(config2),
                        'Both types should be strings', this.TYPE));
                } else if (val1 !== val2) {
                    this.diffs.push(this.generateDiff(config1, this.generatePath(config1),
                        config2, this.generatePath(config2),
                        'Both sides should be equal strings', this.EQUALITY));
                }
            } else if (getType(val1) === 'number') {
                if (getType(val2) !== 'number') {
                    this.diffs.push(this.generateDiff(config1, this.generatePath(config1),
                        config2, this.generatePath(config2),
                        'Both types should be numbers', this.TYPE));
                } else if (val1 !== val2) {
                    this.diffs.push(this.generateDiff(config1, this.generatePath(config1),
                        config2, this.generatePath(config2),
                        'Both sides should be equal numbers', this.EQUALITY));
                }
            } else if (getType(val1) === 'boolean') {
                this.diffBool(val1, config1, val2, config2);
            } else if (getType(val1) === 'null' && getType(val2) !== 'null') {
                this.diffs.push(this.generateDiff(config1, this.generatePath(config1),
                    config2, this.generatePath(config2),
                    'Both types should be nulls', this.TYPE));
            }
        },

        /**
         * Arrays are more complex because we need to recurse into them and handle different length
         * issues so we handle them specially in this function.
         */
        diffArray: function(val1, config1, val2, config2) {
            if (getType(val2) !== 'array') {
                this.diffs.push(this.generateDiff(config1, this.generatePath(config1),
                    config2, this.generatePath(config2),
                    'Both types should be arrays', this.TYPE));
                return;
            }

            if (val1.length < val2.length) {
                /*
                 * Then there were more elements on the right side and we need to
                 * generate those differences.
                 */
                for (var i = val1.length; i < val2.length; i++) {
                    this.diffs.push(this.generateDiff(config1, this.generatePath(config1),
                        config2, this.generatePath(config2, '[' + i + ']'),
                        'Missing element <code>' + i + '</code> from the array on the left side', this.MISSING));
                }
            }
            val1.forEach(function(arrayVal, index) {
                if (val2.length <= index) {
                    this.diffs.push(this.generateDiff(config1, this.generatePath(config1, '[' + index + ']'),
                        config2, this.generatePath(config2),
                        'Missing element <code>' + index + '</code> from the array on the right side', this.MISSING));
                } else {
                    config1.currentPath.push('/[' + index + ']');
                    config2.currentPath.push('/[' + index + ']');

                    if (getType(val2) === 'array') {
                        /*
                         * If both sides are arrays then we want to diff them.
                         */
                        this.diffVal(val1[index], config1, val2[index], config2);
                    }
                    config1.currentPath.pop();
                    config2.currentPath.pop();
                }
            }.bind(this));
        },

        /**
         * We handle boolean values specially because we can show a nicer message for them.
         */
        diffBool: function(val1, config1, val2, config2) {
            if (getType(val2) !== 'boolean') {
                this.diffs.push(this.generateDiff(config1, this.generatePath(config1),
                    config2, this.generatePath(config2),
                    'Both types should be booleans', this.TYPE));
            } else if (val1 !== val2) {
                if (val1) {
                    this.diffs.push(this.generateDiff(config1, this.generatePath(config1),
                        config2, this.generatePath(config2),
                        'The left side is <code>true</code> and the right side is <code>false</code>', this.EQUALITY));
                } else {
                    this.diffs.push(this.generateDiff(config1, this.generatePath(config1),
                        config2, this.generatePath(config2),
                        'The left side is <code>false</code> and the right side is <code>true</code>', this.EQUALITY));
                }
            }
        },

        /**
         * Format the object into the output stream and decorate the data tree with
         * the data about this object.
         */
        formatAndDecorate: function(/*Object*/ config, /*Object*/ data) {
            const self = this;
            if (getType(data) === 'array') {
                this.formatAndDecorateArray(config, data);
                return;
            }

            this.startObject(config);
            config.currentPath.push('/');

            var props = this.getSortedProperties(data);

            /*
             * If the first set has more than the second then we will catch it
             * when we compare values.  However, if the second has more then
             * we need to catch that here.
             */
            props.forEach(function(key) {
                config.out += self.newLine(config) + self.getTabs(config.indent) + '"' + self.unescapeString(key) + '": ';
                config.currentPath.push(key);
                config.paths.push({
                    path: self.generatePath(config),
                    line: config.line
                });
                self.formatVal(data[key], config);
                config.currentPath.pop();
            });

            this.finishObject(config);
            config.currentPath.pop();
        },

        /**
         * Format the array into the output stream and decorate the data tree with
         * the data about this object.
         */
        formatAndDecorateArray: function(/*Object*/ config, /*Array*/ data) {
            const self = this;
            this.startArray(config);

            /*
             * If the first set has more than the second then we will catch it
             * when we compare values.  However, if the second has more then
             * we need to catch that here.
             */
            data.forEach(function(arrayVal, index) {
                config.out += self.newLine(config) + self.getTabs(config.indent);
                config.paths.push({
                    path: self.generatePath(config, '[' + index + ']'),
                    line: config.line
                });

                config.currentPath.push('/[' + index + ']');
                self.formatVal(arrayVal, config);
                config.currentPath.pop();
            });

            this.finishArray(config);
            config.currentPath.pop();
        },

        /**
         * Generate the start of the an array in the output stream and push in the new path
         */
        startArray: function(config) {
            config.indent++;
            config.out += '[';

            if (config.paths.length === 0) {
                /*
                 * Then we are at the top of the array and we want to add
                 * a path for it.
                 */
                config.paths.push({
                    path: this.generatePath(config),
                    line: config.line
                });
            }

            if (config.indent === 0) {
                config.indent++;
            }
        },

        /**
         * Finish the array, outdent, and pop off all the path
         */
        finishArray: function(config) {
            if (config.indent === 0) {
                config.indent--;
            }

            this.removeTrailingComma(config);

            config.indent--;
            config.out += this.newLine(config) + this.getTabs(config.indent) + ']';
            if (config.indent !== 0) {
                config.out += ',';
            } else {
                config.out += this.newLine(config);
            }
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
                    path: this.generatePath(config),
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

            this.removeTrailingComma(config);

            config.indent--;
            config.out += this.newLine(config) + this.getTabs(config.indent) + '}';
            if (config.indent !== 0) {
                config.out += ',';
            } else {
                config.out += this.newLine(config);
            }
        },

        /**
         * Format a specific value into the output stream.
         */
        formatVal: function(val, config) {
            const self = this;
            if (getType(val) === 'array') {
                config.out += '[';

                config.indent++;
                val.forEach(function(arrayVal, index) {
                    config.out += self.newLine(config) + self.getTabs(config.indent);
                    config.paths.push({
                        path: self.generatePath(config, '[' + index + ']'),
                        line: config.line
                    });

                    config.currentPath.push('/[' + index + ']');
                    self.formatVal(arrayVal, config);
                    config.currentPath.pop();
                });
                this.removeTrailingComma(config);
                config.indent--;

                config.out += this.newLine(config) + this.getTabs(config.indent) + ']' + ',';
            } else if (getType(val) === 'object') {
                this.formatAndDecorate(config, val);
            } else if (getType(val) === 'string') {
                config.out += '"' + this.unescapeString(val) + '",';
            } else if (getType(val) === 'number') {
                config.out += val + ',';
            } else if (getType(val) === 'boolean') {
                config.out += val + ',';
            } else if (getType(val) === 'null') {
                config.out += 'null,';
            }
        },

        /**
         * When we parse the JSON string we end up removing the escape strings when we parse it
         * into objects.  This results in invalid JSON if we insert those strings back into the
         * generated JSON.  We also need to look out for characters that change the line count
         * like new lines and carriage returns.
         *
         * This function puts those escaped values back when we generate the JSON output for the
         * well known escape strings in JSON.  It handles properties and values.
         *
         * This function does not handle unicode escapes.  Unicode escapes are optional in JSON
         * and the JSON output is still valid with a unicode character in it.
         */
        unescapeString: function(val) {
            if (val) {
                return val.replace('\\', '\\\\')    // Single slashes need to be replaced first
                    .replace(/\"/g, '\\"')     // Then double quotes
                    .replace(/\n/g, '\\n')     // New lines
                    .replace('\b', '\\b')      // Backspace
                    .replace(/\f/g, '\\f')     // Formfeed
                    .replace(/\r/g, '\\r')     // Carriage return
                    .replace(/\t/g, '\\t');    // Horizontal tabs
            } else {
                return val;
            }
        },

        /**
         * Generate a JSON path based on the specific configuration and an optional property.
         */
        generatePath: function(config, prop) {
            var s = '';
            config.currentPath.forEach(function(path) {
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
            var pathObj1 = config1.paths.find(function(path) {
                return path.path === path1;
            });
            var pathObj2 = config2.paths.find(function(path) {
                return path.path === path2;
            });

            if (!pathObj1) {
                throw 'Unable to find line number for (' + msg + '): ' + path1;
            }

            if (!pathObj2) {
                throw 'Unable to find line number for (' + msg + '): ' + path2;
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
            forEach($parent.find('pre'), function(pre) {
                var codeBlock = $('<pre class="codeBlock"></pre>');
                var lineNumbers = $('<div class="gutter"></div>');
                codeBlock.append(lineNumbers);

                var codeLines = $('<div></div>');
                codeBlock.append(codeLines);

                var addLine = function(line, index) {
                    var div = $('<div class="codeLine line' + (index + 1) + '"></div>');
                    lineNumbers.append($('<span class="line-number">' + (index + 1) + '.</span>'));

                    var span = $('<span class="code"></span>');
                    span.text(line);
                    div.append(span);

                    codeLines.append(div);
                };

                var lines = $(pre).text().split('\n');
                lines.forEach(addLine);

                codeBlock.addClass($(pre).attr('class'));
                codeBlock.attr('id', $(pre).attr('id'));

                $(pre).replaceWith(codeBlock);
            });
        },

        /**
         * Format the text edits which handle the JSON input
         */
        formatTextAreas: function() {
            forEach($parent.find('textarea'), function(textarea) {
                var codeBlock = $('<div class="codeBlock"></div>');
                var lineNumbers = $('<div class="gutter"></div>');
                codeBlock.append(lineNumbers);

                var addLine = function(line, index) {
                    lineNumbers.append($('<span class="line-number">' + (index + 1) + '.</span>'));
                };

                var lines = $(textarea).val().split('\n');
                lines.forEach(addLine);

                $(textarea).replaceWith(codeBlock);
                codeBlock.append(textarea);
            });
        },

        handleDiffClick: function(line, side) {
            var diffs = this.diffs.filter(function(diff) {
                if (side === this.LEFT) {
                    return line === diff.path1.line;
                } else if (side === this.RIGHT) {
                    return line === diff.path2.line;
                } else {
                    return line === diff.path1.line || line === diff.path2.line;
                }
            }.bind(this));

            $parent.find('pre.left span.code').removeClass('selected');
            $parent.find('pre.right span.code').removeClass('selected');
            $parent.find('ul.toolbar').text('');
            diffs.forEach(function(diff) {
                $parent.find('pre.left div.line' + diff.path1.line + ' span.code').addClass('selected');
                $parent.find('pre.right div.line' + diff.path2.line + ' span.code').addClass('selected');
            });

            if (side === this.LEFT || side === this.RIGHT) {
                this.currentDiff = this.diffs.findIndex(function(diff) {
                    return diff.path1.line === line;
                });
            }

            if (this.currentDiff === -1) {
                this.currentDiff = this.diffs.findIndex(function(diff) {
                    return diff.path2.line === line;
                });
            }

            var buttons = $('<div id="buttons"><div>');
            var prev = $('<a href="#" title="Previous difference" id="prevButton">&lt;</a>');
            prev.addClass('disabled');
            prev.click(function(e) {
                e.preventDefault();
                this.highlightPrevDiff();
            }.bind(this));
            buttons.append(prev);

            buttons.append('<span id="prevNextLabel"></span>');

            var next = $('<a href="#" title="Next difference" id="nextButton">&gt;</a>');
            next.click(function(e) {
                e.preventDefault();
                this.highlightNextDiff();
            }.bind(this));
            buttons.append(next);

            $parent.find('ul.toolbar').append(buttons);
            this.updateButtonStyles();

            this.showDiffDetails(diffs);
        },

        highlightPrevDiff: function() {
            if (this.currentDiff > 0) {
                this.currentDiff--;
                this.highlightDiff(this.currentDiff);
                this.scrollToDiff(this.diffs[this.currentDiff]);

                this.updateButtonStyles();
            }
        },

        highlightNextDiff: function() {
            if (this.currentDiff < this.diffs.length - 1) {
                this.currentDiff++;
                this.highlightDiff(this.currentDiff);
                this.scrollToDiff(this.diffs[this.currentDiff]);

                this.updateButtonStyles();
            }
        },

        updateButtonStyles: function() {
            $parent.find('#prevButton').removeClass('disabled');
            $parent.find('#nextButton').removeClass('disabled');

            $parent.find('#prevNextLabel').text((this.currentDiff + 1) + ' of ' + (this.diffs.length));

            if (this.currentDiff === 1) {
                $parent.find('#prevButton').addClass('disabled');
            } else if (this.currentDiff === this.diffs.length - 1) {
                $parent.find('#nextButton').addClass('disabled');
            }
        },

        /**
         * Highlight the diff at the specified index
         */
        highlightDiff: function(index) {
            this.handleDiffClick(this.diffs[index].path1.line, this.BOTH);
        },

        /**
         * Show the details of the specified diff
         */
        showDiffDetails: function(diffs) {
            diffs.forEach(function(diff) {
                var li = $('<li></li>');
                li.html(diff.msg);
                $parent.find('ul.toolbar').append(li);

                li.click(function() {
                    this.scrollToDiff(diff);
                }.bind(this));

            }.bind(this));
        },

        /**
         * Scroll the specified diff to be visible
         */
        scrollToDiff: function(diff) {
            $('html, body').animate({
                scrollTop: $parent.find('pre.left div.line' + diff.path1.line + ' span.code').offset().top
            }, 0);
        },

        /**
         * Process the specified diff
         */
        processDiffs: function() {
            var left = [];
            var right = [];
            this.diffs.forEach(function(diff) {
                $parent.find('pre.left div.line' + diff.path1.line + ' span.code').addClass(diff.type).addClass('diff');
                if (left.indexOf(diff.path1.line) === -1) {
                    $parent.find('pre.left div.line' + diff.path1.line + ' span.code').click(function() {
                        this.handleDiffClick(diff.path1.line, this.LEFT);
                    }.bind(this));
                    left.push(diff.path1.line);
                }

                $parent.find('pre.right div.line' + diff.path2.line + ' span.code').addClass(diff.type).addClass('diff');
                if (right.indexOf(diff.path2.line) === -1) {
                    $parent.find('pre.right div.line' + diff.path2.line + ' span.code').click(function() {
                        this.handleDiffClick(diff.path2.line, this.RIGHT);
                    }.bind(this));
                    right.push(diff.path2.line);
                }
            }.bind(this));

            this.diffs = this.diffs.sort(function(a, b) {
                return a.path1.line - b.path1.line;
            });

        },

        /**
         * Validate the input against the JSON parser
         */
        validateInput: function(json, side) {
            try {
                jsl.parser.parse(json);

                if (side === this.LEFT) {
                    $parent.find('#errorLeft').text('').hide();
                    $parent.find('#textarealeft').removeClass('error');
                } else {
                    $parent.find('#errorRight').text('').hide();
                    $parent.find('#textarearight').removeClass('error');
                }

                return true;
            } catch (parseException) {
                if (side === this.LEFT) {
                    $parent.find('#errorLeft').text(parseException.message).show();
                    $parent.find('#textarealeft').addClass('error');
                } else {
                    $parent.find('#errorRight').text(parseException.message).show();
                    $parent.find('#textarearight').addClass('error');
                }
                return false;
            }
        },

        /**
         * Handle the file uploads
         */
        handleFiles: function(files, side) {
            var reader = new FileReader();

            reader.onload = (function() {
                return function(e) {
                    if (side === this.LEFT) {
                        $parent.find('#textarealeft').val(e.target.result);
                    } else {
                        $parent.find('#textarearight').val(e.target.result);
                    }
                };
            })(files[0]);

            reader.readAsText(files[0]);
        },

        setupNewDiff: function() {
            $parent.find('div.initContainer').show();
            $parent.find('div.diffcontainer').hide();
            $parent.find('div.diffcontainer pre').text('');
            $parent.find('ul.toolbar').text('');
        },

        /**
         * Generate the report section with the diff
         */
        generateReport: function() {
            var report = $parent.find('#report');

            report.text('');

            var newDiff = $('<button>Perform a new diff</button>');
            report.append(newDiff);
            newDiff.click(function() {
                this.setupNewDiff();
            }.bind(this));

            if (this.diffs.length === 0) {
                report.append('<span>The two files were semantically  identical.</span>');
                return;
            }

            var typeCount = 0;
            var eqCount = 0;
            var missingCount = 0;
            this.diffs.forEach(function(diff) {
                if (diff.type === this.EQUALITY) {
                    eqCount++;
                } else if (diff.type === this.MISSING) {
                    missingCount++;
                } else if (diff.type === this.TYPE) {
                    typeCount++;
                }
            }.bind(this));

            var title = $('<div class="reportTitle"></div>');
            if (this.diffs.length === 1) {
                title.text('Found ' + (this.diffs.length) + ' difference');
            } else {
                title.text('Found ' + (this.diffs.length) + ' differences');
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
                        $parent.find('span.code.diff.missing').addClass('missing_off').removeClass('missing');
                    } else {
                        $parent.find('span.code.diff.missing_off').addClass('missing').removeClass('missing_off');
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
                        $parent.find('span.code.diff.type').addClass('type_off').removeClass('type');
                    } else {
                        $parent.find('span.code.diff.type_off').addClass('type').removeClass('type_off');
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
                        $parent.find('span.code.diff.eq').addClass('eq_off').removeClass('eq');
                    } else {
                        $parent.find('span.code.diff.eq_off').addClass('eq').removeClass('eq_off');
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

            if (this.requestCount !== 0) {
                /*
                 * This means we have a pending request and we just need to wait for that to finish.
                 */
                return;
            }

            $('body').addClass('progress');
            $parent.find('#compare').prop('disabled', true);

            var loadUrl = function(id, errId) {
                if ($parent.find('#' + id).val().trim().substring(0, 4).toLowerCase() === 'http') {
                    this.requestCount++;
                    $.post('proxy.php',
                        {
                            'url': $parent.find('#' + id).val().trim()
                        }, function(responseObj) {
                            if (responseObj.error) {
                                $parent.find('#' + errId).text(responseObj.result).show();
                                $parent.find('#' + id).addClass('error');
                                $('body').removeClass('progress');
                                $parent.find('#compare').prop('disabled', false);
                            } else {
                                $parent.find('#' + id).val(responseObj.content);
                                this.requestCount--;
                                this.compare();
                            }
                        }, 'json');
                    return true;
                } else {
                    return false;
                }
            };

            if (loadUrl('textarealeft', 'errorLeft')) {
                return;
            }

            if (loadUrl('textarearight', 'errorRight')) {
                return;
            }

            /*
             * We'll start by running the text through JSONlint since it gives
             * much better error messages.
             */
            var leftValid = this.validateInput($parent.find('#textarealeft').val(), this.LEFT);
            var rightValid = this.validateInput($parent.find('#textarearight').val(), this.RIGHT);

            if (!leftValid || !rightValid) {
                $('body').removeClass('progress');
                $parent.find('#compare').prop('disabled', false);
                return;
            }

            $parent.find('div.initContainer').hide();
            $parent.find('div.diffcontainer').show();

            this.diffs = [];

            var left = JSON.parse($parent.find('#textarealeft').val());
            var right = JSON.parse($parent.find('#textarearight').val());


            var config = this.createConfig();
            this.formatAndDecorate(config, left);
            $parent.find('#out').text(config.out);

            var config2 = this.createConfig();
            this.formatAndDecorate(config2, right);
            $parent.find('#out2').text(config2.out);

            this.formatPRETags();

            config.currentPath = [];
            config2.currentPath = [];

            this.diffVal(left, config, right, config2);
            this.processDiffs();
            this.generateReport();

            //console.log('diffs: ' + JSON.stringify(this.diffs));

            if (this.diffs.length > 0) {
                this.highlightDiff(0);
                this.currentDiff = 0;
                this.updateButtonStyles();
            }

            $('body').removeClass('progress');
            $parent.find('#compare').prop('disabled', false);

            /*
             * We want to switch the toolbar bar between fixed and absolute position when you
             * scroll so you can get the maximum number of toolbar items.
             */
            var toolbarTop = $parent.find('#toolbar').offset().top - 15;
            $(window).scroll(function() {
                if (toolbarTop < $(window).scrollTop()) {
                    $parent.find('#toolbar').css('position', 'fixed').css('top', '10px');
                } else {
                    $parent.find('#toolbar').css('position', 'absolute').css('top', '');
                }
            });

        },

        /**
         * Load in the sample data
         */
        loadSampleData: function() {
            $parent.find('#textarealeft').val('{"Aidan Gillen": {"array": ["Game of Thron\\"es","The Wire"],"string": "some string","int": 2,"aboolean": true, "boolean": true,"object": {"foo": "bar","object1": {"new prop1": "new prop value"},"object2": {"new prop1": "new prop value"},"object3": {"new prop1": "new prop value"},"object4": {"new prop1": "new prop value"}}},"Amy Ryan": {"one": "In Treatment","two": "The Wire"},"Annie Fitzgerald": ["Big Love","True Blood"],"Anwan Glover": ["Treme","The Wire"],"Alexander Skarsgard": ["Generation Kill","True Blood"], "Clarke Peters": null}');
            /*$parent.find('#textarealeft').val('[{  "OBJ_ID": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "b3067a77-875b-4208-9ee3-39128adeb654",  "lastLogon": "0",  "sAMAccountName": "ksmith",  "userPrincipalName": "ksmith@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"},{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]');
            $parent.find('#textarearight').val('{"foo":[{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]}');*/
            $parent.find('#textarearight').val('{"Aidan Gillen": {"array": ["Game of Thrones","The Wire"],"string": "some string","int": "2","otherint": 4, "aboolean": "true", "boolean": false,"object": {"foo": "bar"}},"Amy Ryan": ["In Treatment","The Wire"],"Annie Fitzgerald": ["True Blood","Big Love","The Sopranos","Oz"],"Anwan Glover": ["Treme","The Wire"],"Alexander Skarsg?rd": ["Generation Kill","True Blood"],"Alice Farmer": ["The Corner","Oz","The Wire"]}');
        },

        getParameterByName: function(name) {
            name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
            var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
                results = regex.exec(location.search);
            return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
        }
    }
};

