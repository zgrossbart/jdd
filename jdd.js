/*******************************************************************************
 *
 * Copyright 2015-2019 Zack Grossbart
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
    if ((function () { return value && (value !== this); }).call(value)) {
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
/*global jdd:true */
var jdd = {

    LEFT: 'left',
    RIGHT: 'right',

    EQUALITY: 'eq',
    TYPE: 'type',
    MISSING: 'missing',
    diffs: [],
    SEPARATOR: '/',
    requestCount: 0,

    /**
     * Find the differences between the two objects and recurse into their sub objects.
     */
    findDiffs: function (/*Object*/ config1, /*Object*/ data1, /*Object*/ config2, /*Object*/ data2) {
        config1.currentPath.push(jdd.SEPARATOR);
        config2.currentPath.push(jdd.SEPARATOR);

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
                        jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                            config2, jdd.generatePath(config2, jdd.SEPARATOR + key),
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
                // no un-used vars
                // val = data1[key];

                config1.currentPath.push(key.replace(jdd.SEPARATOR, '#'));
                if (!data2.hasOwnProperty(key)) {
                    /*
                     * This means that the first data has a property which
                     * isn't present in the second data
                     */
                    jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                        config2, jdd.generatePath(config2),
                        'Missing property <code>' + key + '</code> from the object on the right side', jdd.MISSING));
                } else {
                    config2.currentPath.push(key.replace(jdd.SEPARATOR, '#'));

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
                // no un-used vars
                // val = data1[key];

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
    diffVal: function (val1, config1, val2, config2) {

        if (getType(val1) === 'array') {
            jdd.diffArray(val1, config1, val2, config2);
        } else if (getType(val1) === 'object') {
            if (['array', 'string', 'number', 'boolean', 'null'].indexOf(getType(val2)) > -1) {
                jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                    config2, jdd.generatePath(config2),
                    'Both types should be objects', jdd.TYPE));
            } else {
                jdd.findDiffs(config1, val1, config2, val2);
            }
        } else if (getType(val1) === 'string') {
            if (getType(val2) !== 'string') {
                jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                    config2, jdd.generatePath(config2),
                    'Both types should be strings', jdd.TYPE));
            } else if (val1 !== val2) {
                jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                    config2, jdd.generatePath(config2),
                    'Both sides should be equal strings', jdd.EQUALITY));
            }
        } else if (getType(val1) === 'number') {
            if (getType(val2) !== 'number') {
                jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                    config2, jdd.generatePath(config2),
                    'Both types should be numbers', jdd.TYPE));
            } else if (val1 !== val2) {
                jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                    config2, jdd.generatePath(config2),
                    'Both sides should be equal numbers', jdd.EQUALITY));
            }
        } else if (getType(val1) === 'boolean') {
            jdd.diffBool(val1, config1, val2, config2);
        } else if (getType(val1) === 'null' && getType(val2) !== 'null') {
            jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                config2, jdd.generatePath(config2),
                'Both types should be nulls', jdd.TYPE));
        }
    },

    /**
     * Arrays are more complex because we need to recurse into them and handle different length
     * issues so we handle them specially in this function.
     */
    diffArray: function (val1, config1, val2, config2) {
        if (getType(val2) !== 'array') {
            jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1),
                config2, jdd.generatePath(config2),
                'Both types should be arrays', jdd.TYPE));
            return;
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
        val1.forEach(function (arrayVal, index) {
            if (val2.length <= index) {
                jdd.diffs.push(jdd.generateDiff(config1, jdd.generatePath(config1, '[' + index + ']'),
                    config2, jdd.generatePath(config2),
                    'Missing element <code>' + index + '</code> from the array on the right side', jdd.MISSING));
            } else {
                config1.currentPath.push(jdd.SEPARATOR + '[' + index + ']');
                config2.currentPath.push(jdd.SEPARATOR + '[' + index + ']');

                if (getType(val2) === 'array') {
                    /*
                     * If both sides are arrays then we want to diff them.
                     */
                    jdd.diffVal(val1[index], config1, val2[index], config2);
                }
                config1.currentPath.pop();
                config2.currentPath.pop();
            }
        });
    },

    /**
     * We handle boolean values specially because we can show a nicer message for them.
     */
    diffBool: function (val1, config1, val2, config2) {
        if (getType(val2) !== 'boolean') {
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
    formatAndDecorate: function (/*Object*/ config, /*Object*/ data) {
        if (getType(data) === 'array') {
            jdd.formatAndDecorateArray(config, data);
            return;
        }

        jdd.startObject(config);
        config.currentPath.push(jdd.SEPARATOR);

        var props = jdd.getSortedProperties(data);

        /*
         * If the first set has more than the second then we will catch it
         * when we compare values.  However, if the second has more then
         * we need to catch that here.
         */
        props.forEach(function (key) {
            config.out += jdd.newLine(config) + jdd.getTabs(config.indent) + '"' + jdd.unescapeString(key) + '": ';
            config.currentPath.push(key.replace(jdd.SEPARATOR, '#'));
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
     * Format the array into the output stream and decorate the data tree with
     * the data about this object.
     */
    formatAndDecorateArray: function (/*Object*/ config, /*Array*/ data) {
        jdd.startArray(config);

        /*
         * If the first set has more than the second then we will catch it
         * when we compare values.  However, if the second has more then
         * we need to catch that here.
         */
        data.forEach(function (arrayVal, index) {
            config.out += jdd.newLine(config) + jdd.getTabs(config.indent);
            config.paths.push({
                path: jdd.generatePath(config, '[' + index + ']'),
                line: config.line
            });

            config.currentPath.push(jdd.SEPARATOR + '[' + index + ']');
            jdd.formatVal(arrayVal, config);
            config.currentPath.pop();
        });

        jdd.finishArray(config);
        config.currentPath.pop();
    },

    /**
     * Generate the start of the an array in the output stream and push in the new path
     */
    startArray: function (config) {
        config.indent++;
        config.out += '[';

        if (config.paths.length === 0) {
            /*
             * Then we are at the top of the array and we want to add
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
     * Finish the array, outdent, and pop off all the path
     */
    finishArray: function (config) {
        if (config.indent === 0) {
            config.indent--;
        }

        jdd.removeTrailingComma(config);

        config.indent--;
        config.out += jdd.newLine(config) + jdd.getTabs(config.indent) + ']';
        if (config.indent !== 0) {
            config.out += ',';
        } else {
            config.out += jdd.newLine(config);
        }
    },

    /**
     * Generate the start of the an object in the output stream and push in the new path
     */
    startObject: function (config) {
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
    finishObject: function (config) {
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
    formatVal: function (val, config) {
        if (getType(val) === 'array') {
            config.out += '[';

            config.indent++;
            val.forEach(function (arrayVal, index) {
                config.out += jdd.newLine(config) + jdd.getTabs(config.indent);
                config.paths.push({
                    path: jdd.generatePath(config, '[' + index + ']'),
                    line: config.line
                });

                config.currentPath.push(jdd.SEPARATOR + '[' + index + ']');
                jdd.formatVal(arrayVal, config);
                config.currentPath.pop();
            });
            jdd.removeTrailingComma(config);
            config.indent--;

            config.out += jdd.newLine(config) + jdd.getTabs(config.indent) + ']' + ',';
        } else if (getType(val) === 'object') {
            jdd.formatAndDecorate(config, val);
        } else if (getType(val) === 'string') {
            config.out += '"' + jdd.unescapeString(val) + '",';
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
    unescapeString: function (val) {
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
    generatePath: function (config, prop) {
        var s = '';
        config.currentPath.forEach(function (path) {
            s += path;
        });

        if (prop) {
            s += jdd.SEPARATOR + prop.replace(jdd.SEPARATOR, '#');
        }

        if (s.length === 0) {
            return jdd.SEPARATOR;
        } else {
            return s;
        }
    },

    /**
     * Add a new line to the output stream
     */
    newLine: function (config) {
        config.line++;
        return '\n';
    },

    /**
     * Sort all the relevant properties and return them in an alphabetical sort by property key
     */
    getSortedProperties: function (/*Object*/ obj) {
        var props = [];

        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                props.push(prop);
            }
        }

        props = props.sort(function (a, b) {
            return a.localeCompare(b);
        });

        return props;
    },

    /**
     * Generate the diff and verify that it matches a JSON path
     */
    generateDiff: function (config1, path1, config2, path2, /*String*/ msg, type) {
        if (path1 !== jdd.SEPARATOR && path1.charAt(path1.length - 1) === jdd.SEPARATOR) {
            path1 = path1.substring(0, path1.length - 1);
        }

        if (path2 !== jdd.SEPARATOR && path2.charAt(path2.length - 1) === jdd.SEPARATOR) {
            path2 = path2.substring(0, path2.length - 1);
        }
        var pathObj1 = config1.paths.find(function (path) {
            return path.path === path1;
        });
        var pathObj2 = config2.paths.find(function (path) {
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
    getTabs: function (/*int*/ indent) {
        var s = '';
        for (var i = 0; i < indent; i++) {
            s += '    ';
        }

        return s;
    },

    /**
     * Remove the trailing comma from the output.
     */
    removeTrailingComma: function (config) {
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
    createConfig: function () {
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
    formatPRETags: function () {
        document.querySelectorAll('pre').forEach(function(pre) {
            var lineNumbers = '<div class="gutter">';
            var codeLines = '<div>';

            // This is used to encode text as fast as possible
            var lineDiv = document.createElement('div');
            var lineText = document.createTextNode('');
            lineDiv.appendChild(lineText);

            var addLine = function (line, index) {
              lineNumbers += '<span class="line-number">' + (index + 1) + '.</span>';

              lineText.nodeValue = line;

              codeLines +=
                '<div class="codeLine line' +
                (index + 1) +
                '"><span class="code">' +
                lineDiv.innerHTML +
                '</span></div>';
            };

            var lines = pre.textContent.split('\n');
            lines.forEach(addLine);

            // Combine it all together
            codeLines += '</div>';
            lineNumbers += '</div>';

            var codeBlockElement = '<pre id="'+ pre.id +'" class="codeBlock ' + pre.classList.toString() + '">' + lineNumbers + codeLines + '</pre>';
            pre.outerHTML = codeBlockElement;
        });
    },

    handleDiffClick: function (line, side) {
        var diffs = jdd.diffs.filter(function (diff) {
            if (side === jdd.LEFT) {
                return line === diff.path1.line;
            } else if (side === jdd.RIGHT) {
                return line === diff.path2.line;
            } else {
                return line === diff.path1.line || line === diff.path2.line;
            }
        });

        document.querySelectorAll('pre.left span.code').forEach(function(val) {
            val.classList.remove('selected');
        });

        document.querySelectorAll('pre.right span.code').forEach(function(val) {
            val.classList.remove('selected');
        });

        document.querySelector('ul.toolbar').replaceChildren();
        diffs.forEach(function (diff) {
            document.querySelector('pre.left div.line' + diff.path1.line + ' span.code').classList.add('selected');
            document.querySelector('pre.right div.line' + diff.path2.line + ' span.code').classList.add('selected');
        });

        if (side === jdd.LEFT || side === jdd.RIGHT) {
            jdd.currentDiff = jdd.diffs.findIndex(function (diff) {
                return diff.path1.line === line;
            });
        }

        if (jdd.currentDiff === -1) {
            jdd.currentDiff = jdd.diffs.findIndex(function (diff) {
                return diff.path2.line === line;
            });
        }

        var buttons = '<div id="buttons">';
        var prev = '<a href="#" title="Previous difference" id="prevButton" class="disabled">&lt;</a>';
        buttons += prev;
        buttons += '<span id="prevNextLabel"></span>';
        var next = '<a href="#" title="Next difference" id="nextButton">&gt;</a>';
        buttons += next;
        buttons += '<div>';

        document.querySelector('ul.toolbar').insertAdjacentHTML('beforeend', buttons);

        document.getElementById('prevButton').addEventListener('click', function (event) {
            event.preventDefault();
            jdd.highlightPrevDiff();
        });

        document.getElementById('nextButton').addEventListener('click', function (event) {
            event.preventDefault();
            jdd.highlightNextDiff();
        });

        jdd.updateButtonStyles();

        jdd.showDiffDetails(diffs);
    },

    highlightPrevDiff: function () {
        if (jdd.currentDiff > 0) {
            jdd.currentDiff--;
            jdd.highlightDiff(jdd.currentDiff);
            jdd.scrollToDiff(jdd.diffs[jdd.currentDiff]);

            jdd.updateButtonStyles();
        }
    },

    highlightNextDiff: function () {
        if (jdd.currentDiff < jdd.diffs.length - 1) {
            jdd.currentDiff++;
            jdd.highlightDiff(jdd.currentDiff);
            jdd.scrollToDiff(jdd.diffs[jdd.currentDiff]);

            jdd.updateButtonStyles();
        }
    },

    updateButtonStyles: function () {
        document.getElementById('prevButton').classList.remove('disabled');
        document.getElementById('nextButton').classList.remove('disabled');

        document.getElementById('prevNextLabel').textContent = (jdd.currentDiff + 1) + ' of ' + (jdd.diffs.length);

        if (jdd.currentDiff === 1) {
            document.getElementById('prevButton').classList.add('disabled');
        } else if (jdd.currentDiff === jdd.diffs.length - 1) {
            document.getElementById('nextButton').classList.add('disabled');
        }
    },

    /**
     * Highlight the diff at the specified index
     */
    highlightDiff: function (index) {
        jdd.handleDiffClick(jdd.diffs[index].path1.line, jdd.BOTH);
    },

    /**
     * Show the details of the specified diff
     */
    showDiffDetails: function (diffs) {
        diffs.forEach(function (diff, index) {
            var li = '<li>' + diff.msg + '</li>';
            document.querySelector('ul.toolbar').insertAdjacentHTML('beforeend', li);

            document.querySelectorAll('ul.toolbar li')[index].addEventListener('click', function(){
                jdd.scrollToDiff(diff); 
            });
        });
    },

    /**
     * Scroll the specified diff to be visible
     */
    scrollToDiff: function (diff) {
        var elementOffsetTop= document.querySelector('pre.left div.line' + diff.path1.line + ' span.code').getBoundingClientRect().top + window.scrollY - document.documentElement.clientTop;
        window.scrollTo({
            'behavior': 'smooth',
            'left': 0,
            'top': elementOffsetTop
          });
    },

    /**
     * Process the specified diff
     */
    processDiffs: function () {
        var left = [];
        var right = [];

        // Cache the lines for fast lookup
        var leftLineLookup = {};
        var rightLineLookup = {};

        // We can use the index to save lookup up the parents class
        document.querySelectorAll('pre.left span.code').forEach(function(val, index) {
            leftLineLookup[index + 1] = val;
        });

        document.querySelectorAll('pre.right span.code').forEach(function(val, index) {
            rightLineLookup[index + 1] = val;
        });

        jdd.diffs.forEach(function (diff) {
            leftLineLookup[diff.path1.line].classList.add(diff.type, 'diff');
            if (left.indexOf(diff.path1.line) === -1) {
                leftLineLookup[diff.path1.line].addEventListener('click', function () {
                    jdd.handleDiffClick(diff.path1.line, jdd.LEFT);
                });
                left.push(diff.path1.line);
            }

            rightLineLookup[diff.path2.line].classList.add(diff.type, 'diff');
            if (right.indexOf(diff.path2.line) === -1) {
                rightLineLookup[diff.path2.line].addEventListener('click', function () {
                    jdd.handleDiffClick(diff.path2.line, jdd.RIGHT);
                });
                right.push(diff.path2.line);
            }
        });

        jdd.diffs = jdd.diffs.sort(function (a, b) {
            return a.path1.line - b.path1.line;
        });

    },

    /**
     * Validate the input against the JSON parser
     */
    validateInput: function (json, side) {
        try {
            jsl.parser.parse(json);

            if (side === jdd.LEFT) {
                document.getElementById('errorLeft').replaceChildren();
                document.getElementById('errorLeft').style.display='none';
                document.getElementById('textarealeft').classList.remove('error');
            } else {
                document.getElementById('errorRight').replaceChildren();
                document.getElementById('errorRight').style.display='none';
                document.getElementById('textarearight').classList.remove('error');
            }

            return true;
        } catch (parseException) {
            if (side === jdd.LEFT) {
                document.getElementById('errorLeft').textContent = parseException.message;
                document.getElementById('errorLeft').style.display='block';
                document.getElementById('textarealeft').classList.add('error');
            } else {
                document.getElementById('errorRight').textContent = parseException.message;
                document.getElementById('errorRight').style.display='block';
                document.getElementById('textarearight').classList.add('error');
            }
            return false;
        }
    },

    /**
     * Handle the file uploads
     */
    handleFiles: function (files, side) {
        var reader = new FileReader();

        reader.onload = (function () {
            return function (event) {
                if (side === jdd.LEFT) {
                    document.getElementById('textarealeft').value = event.target.result;
                } else {
                    document.getElementById('textarearight').value = event.target.result;
                }
            };
        })(files[0]);

        reader.readAsText(files[0]);
    },

    setupNewDiff: function () {
        document.querySelector('.initContainer').style.display = 'block';
        document.querySelector('.diffcontainer').style.display = 'none';
        document.querySelectorAll('.diffcontainer pre').forEach(function (elem) {
            elem.replaceChildren();
        });
        document.querySelector('.toolbar').replaceChildren();
    },

    /**
     * Generate the report section with the diff
     */
    generateReport: function () {
        var report = document.getElementById('report');

        report.replaceChildren();

        report.insertAdjacentHTML('beforeend', '<button>Perform a new diff</button>');
        // TODO: add a class/id name to button and use that to select and add event
        report.querySelector('button').addEventListener('click', function () {
            jdd.setupNewDiff();
        });

        if (jdd.diffs.length === 0) {
            report.insertAdjacentHTML('beforeend', '<span>The two files were semantically  identical.</span>');
            return;
        }

        var typeCount = 0;
        var eqCount = 0;
        var missingCount = 0;
        jdd.diffs.forEach(function (diff) {
            if (diff.type === jdd.EQUALITY) {
                eqCount++;
            } else if (diff.type === jdd.MISSING) {
                missingCount++;
            } else if (diff.type === jdd.TYPE) {
                typeCount++;
            }
        });

        var title = '<div class="reportTitle">Found ' + jdd.diffs.length + ' difference';
        if (jdd.diffs.length > 1) {
            title += 's';
        }
        title += '</div>';

        report.insertAdjacentHTML('afterbegin', title);

        var filterBlock = '<span class="filterBlock">Show:';

        /*
         * The missing checkbox
         */
        if (missingCount > 0) {
            var missing = '<label><input id="showMissing" type="checkbox" name="checkbox" value="value" checked="true">' + missingCount;
            if (missingCount === 1) {
                missing += ' missing property';
            } else {
                missing += ' missing properties';
            }
            filterBlock += missing + '</label>';
        }

        /*
         * The types checkbox
         */
        if (typeCount > 0) {
            var types = '<label><input id="showTypes" type="checkbox" name="checkbox" value="value" checked="true">' + typeCount + ' incorrect type';
            if (typeCount > 1) {
                types += 's';
            }
            filterBlock += types + '</label>';
        }

        /*
         * The equals checkbox
         */
        if (eqCount > 0) {
            var eq = '<label><input id="showEq" type="checkbox" name="checkbox" value="value" checked="true">' + eqCount + ' unequal value';
            if (eqCount > 1) {
                eq += 's';
            }
            filterBlock += eq + '</label>';
        }
        filterBlock += '</span>';
        report.insertAdjacentHTML('beforeend', filterBlock);

        // The missing checkbox event
        if (missingCount > 0) {
            document.querySelector('#showMissing').addEventListener('change', function (event) {
                if (!event.target.checked) {
                    document.querySelectorAll('span.code.diff.missing').forEach(function (element) {
                        element.classList.toggle('missing_off');
                        element.classList.toggle('missing');
                    });
                } else {
                    document.querySelectorAll('span.code.diff.missing_off').forEach(function (element) {
                        element.classList.toggle('missing');
                        element.classList.toggle('missing_off');
                    });
                }    
            });
        }
        
        // The types checkbox event
        if (typeCount > 0) {
            document.querySelector('#showTypes').addEventListener('change', function (event) {
                if (!event.target.checked) {
                    document.querySelectorAll('span.code.diff.type').forEach(function (element) {
                        element.classList.toggle('type_off');
                        element.classList.toggle('type');
                    });
                } else {
                    document.querySelectorAll('span.code.diff.type_off').forEach(function (element) {
                        element.classList.toggle('type');
                        element.classList.toggle('type_off');
                    });
                }    
            });
        }
        
        // The equals checkbox event
        if (eqCount > 0) {
            document.querySelector('#showEq').addEventListener('change', function(event){
                if (!event.target.checked) {
                    document.querySelectorAll('span.code.diff.eq').forEach(function (element) {
                        element.classList.toggle('eq_off');
                        element.classList.toggle('eq');
                    });
                } else {
                    document.querySelectorAll('span.code.diff.eq_off').forEach(function (element) {
                        element.classList.toggle('eq');
                        element.classList.toggle('eq_off');
                    });
                }    
            });
        }
    },

    /**
     * Implement the compare button and complete the compare process
     */
    compare: function () {

        if (jdd.requestCount !== 0) {
            /*
             * This means we have a pending request and we just need to wait for that to finish.
             */
            return;
        }

        document.body.classList.add('progress');
        document.getElementById('compare').disabled = true;
        jdd.diffs = [];

        var loadUrl = function (id, errId) {
            if (document.getElementById(id).value.trim().substring(0, 4).toLowerCase() === 'http') {
                jdd.requestCount++;

                fetch('https://jsondiff.com/proxy.php', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        'url': document.getElementById(id).value.trim()
                    })
                  })
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (responseObj) {
                    if (responseObj.error) {
                        document.getElementById(errId).textContent = responseObj.result;
                        document.getElementById(errId).style.display = 'block';
                        document.getElementById(id).classList.add('error');
                        document.body.classList.remove('progress');
                        document.getElementById('compare').disabled = false;
                    } else {
                        document.getElementById(id).value = responseObj.content;
                        jdd.requestCount--;
                        jdd.compare();
                    }
                });
                return true;
            } else if (document.getElementById(id).value.trim().substring(0, 5).toLowerCase() === 'data:') {
                /*
                 * This section handles data urls.  This feature allows the user to encode their
                 * JSON as an URL parameter and pass it directly to JSONDiff.
                 */
                var val = document.getElementById(id).value.trim();
                try {
                    if (val.length >= 14 && val.substring(5,12) === 'base64,') {
                        /*
                         * This means the URL didn't specify a mimetype like this:
                         * data:base64,eyJmb28iOiAxfQ==
                         */
                        document.getElementById(id).value = atob(val.substring(12));
                        return false;
                    } else if (val.length >= 14 && val.substring(5,29) === 'application/json;base64,') {
                        /*
                         * This means the URL specified the JSON mimetype like this
                         * data:application/json;base64,eyJmb28iOiAxfQ==
                         */
                        document.getElementById(id).value = atob(val.substring(29));
                        return false;
                    } else if (val.length >= 14 && val.substring(5,23) === 'text/plain;base64,') {
                        /*
                         * This means the URL specified the plain text mimetype like this
                         * data:text/plain;base64,eyJmb28iOiAxfQ==
                         */
                        document.getElementById(id).value = atob(val.substring(23));
                        return false;
                    } else {
                        /*
                         * This means they either didn't encode the value properly or specified a mimetype
                         * that we don't support.
                         */
                        document.getElementById(errId).textContent = 'The value was not properly base64 encoded or has an unsupported mimetype';
                        document.getElementById(errId).style.display = 'block';
                        document.getElementById(id).classList.add('error');
                        document.body.classList.remove('progress');
                        document.getElementById('compare').disabled = false;
                    }
                } catch(err) {
                    document.getElementById(errId).textContent = err;
                    document.getElementById(errId).style.display = 'block';
                    document.getElementById(id).classList.add('error');
                    document.body.classList.remove('progress');
                    document.getElementById('compare').disabled = false;
                    return true;
                }
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
        var leftValid = jdd.validateInput(document.getElementById('textarealeft').value, jdd.LEFT);
        var rightValid = jdd.validateInput(document.getElementById('textarearight').value, jdd.RIGHT);
        var compareElement = document.getElementById('#compare');

        if (!leftValid || !rightValid) {
            document.body.classList.remove('progress');    
            if(compareElement){
                compareElement.disabled = false;
            }
            return;
        }

        document.querySelector('.initContainer').style.display='none';

        var left = JSON.parse(document.getElementById('textarealeft').value);
        var right = JSON.parse(document.getElementById('textarearight').value);


        var config = jdd.createConfig();
        jdd.formatAndDecorate(config, left);
        document.getElementById('out').textContent = config.out;

        var config2 = jdd.createConfig();
        jdd.formatAndDecorate(config2, right);
        document.getElementById('out2').textContent = config2.out;

        jdd.formatPRETags();

        config.currentPath = [];
        config2.currentPath = [];

        jdd.diffVal(left, config, right, config2);
        jdd.processDiffs();
        jdd.generateReport();

        document.querySelector('.diffcontainer').style.display = 'block';

        //console.log('diffs: ' + JSON.stringify(jdd.diffs));

        if (jdd.diffs.length > 0) {
            jdd.highlightDiff(0);
            jdd.currentDiff = 0;
            jdd.updateButtonStyles();
        }

        document.body.classList.remove('progress');
        document.getElementById('compare').disabled = false;
        /*
         * We want to switch the toolbar bar between fixed and absolute position when you
         * scroll so you can get the maximum number of toolbar items.
         */
        var toolbarTop = document.getElementById('toolbar').getBoundingClientRect().top - 15;
        window.addEventListener('scroll', function() {
            if (toolbarTop < ((document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop)) {
                document.getElementById('toolbar').style.position='fixed';
                document.getElementById('toolbar').style.top='10px';
            } else {
                document.getElementById('toolbar').style.position='absolute';
                document.getElementById('toolbar').style.top='';
            }
        });

    },

    /**
     * Load in the sample data
     */
    loadSampleData: function () {
        document.getElementById('textarealeft').value='{"Aidan Gillen": {"array": ["Game of Thron\\"es","The Wire"],"string": "some string","int": 2,"aboolean": true, "boolean": true,"object": {"foo": "bar","object1": {"new prop1": "new prop value"},"object2": {"new prop1": "new prop value"},"object3": {"new prop1": "new prop value"},"object4": {"new prop1": "new prop value"}}},"Amy Ryan": {"one": "In Treatment","two": "The Wire"},"Annie Fitzgerald": ["Big Love","True Blood"],"Anwan Glover": ["Treme","The Wire"],"Alexander Skarsgard": ["Generation Kill","True Blood"], "Clarke Peters": null}';
        /*$('#textarealeft').val('[{  "OBJ_ID": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "b3067a77-875b-4208-9ee3-39128adeb654",  "lastLogon": "0",  "sAMAccountName": "ksmith",  "userPrincipalName": "ksmith@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"},{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]');
        $('#textarearight').val('{"foo":[{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]}');*/
        document.getElementById('textarearight').value='{"Aidan Gillen": {"array": ["Game of Thrones","The Wire"],"string": "some string","int": "2","otherint": 4, "aboolean": "true", "boolean": false,"object": {"foo": "bar"}},"Amy Ryan": ["In Treatment","The Wire"],"Annie Fitzgerald": ["True Blood","Big Love","The Sopranos","Oz"],"Anwan Glover": ["Treme","The Wire"],"Alexander Skarsg?rd": ["Generation Kill","True Blood"],"Alice Farmer": ["The Corner","Oz","The Wire"]}';
    },

    getParameterByName: function (name) {
        var params = new URLSearchParams(!!window.location.hash ? window.location.hash.substring(1) : window.location.search);
        return params.has(name) ? params.get(name) : '';
    }
};



document.addEventListener('DOMContentLoaded', function() {        
    document.getElementById('compare').addEventListener('click', function () {
        jdd.compare();
    });

    if (jdd.getParameterByName('left')) {
        document.getElementById('textarealeft').value=jdd.getParameterByName('left');
    }

    if (jdd.getParameterByName('right')) {
        document.getElementById('textarearight').value=jdd.getParameterByName('right');
    }

    if (jdd.getParameterByName('left') && jdd.getParameterByName('right')) {
        jdd.compare();
    }


    document.getElementById('sample').addEventListener('click',function (event) {
        event.preventDefault();
        jdd.loadSampleData();
    });

    document.addEventListener('keydown', function (event) {
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

// polyfills

// Array.prototype.find
// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
        value: function (predicate) {
            // 1. Let O be ? ToObject(this value).
            if (this === null) {
                throw new TypeError('"this" is null or not defined');
            }

            var o = Object(this);

            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;

            // 3. If IsCallable(predicate) is false, throw a TypeError exception.
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }

            // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
            var thisArg = arguments[1];

            // 5. Let k be 0.
            var k = 0;

            // 6. Repeat, while k < len
            while (k < len) {
                // a. Let Pk be ! ToString(k).
                // b. Let kValue be ? Get(O, Pk).
                // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                // d. If testResult is true, return kValue.
                var kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) {
                    return kValue;
                }
                // e. Increase k by 1.
                k++;
            }

            // 7. Return undefined.
            return undefined;
        },
        configurable: true,
        writable: true
    });
}

// Array.prototype.findIndex
// https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
if (!Array.prototype.findIndex) {
    Object.defineProperty(Array.prototype, 'findIndex', {
        value: function (predicate) {
            // 1. Let O be ? ToObject(this value).
            if (this === null) {
                throw new TypeError('"this" is null or not defined');
            }

            var o = Object(this);

            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;

            // 3. If IsCallable(predicate) is false, throw a TypeError exception.
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }

            // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
            var thisArg = arguments[1];

            // 5. Let k be 0.
            var k = 0;

            // 6. Repeat, while k < len
            while (k < len) {
                // a. Let Pk be ! ToString(k).
                // b. Let kValue be ? Get(O, Pk).
                // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                // d. If testResult is true, return k.
                var kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) {
                    return k;
                }
                // e. Increase k by 1.
                k++;
            }

            // 7. Return -1.
            return -1;
        },
        configurable: true,
        writable: true
    });
}
