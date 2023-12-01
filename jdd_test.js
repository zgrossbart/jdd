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

/**
 * This is the main test harness for JSONDiff.  It runs unit tests and integrations tests in the browser.
 * To run these tests just access the index-test.html page.  You can run the tests on the live site at
 * http://www.jsondiff.com/index-test.html.
 *
 * Each test follows the same basic pattern:  set the text of the left and right text areas then run the
 * jdd.compare function.  Once the compare completes we examine the JSON data in the jdd.diffs object to 
 * determine if the test completed successfully.  As a last step we clear out the two text areas and call
 * jdd.setupNewDiff to prepare for the next test.
 */

/** 
 * This is the basic compate test.  It does a compare of our sample data and makes sure that we have the 
 * correct number of diffs of each type.  It also checks a few random diffs to make sure they are correct.
 */
QUnit.test('Object compare tests', function (assert) {
    $('#textarealeft').val('{"Aidan Gillen": {"array": ["Game of Thron\\"es","The Wire"],"string": "some string","int": 2,"aboolean": true, "boolean": true, "null": null, "a_null": null, "another_null": "null check", "object": {"foo": "bar","object1": {"new prop1": "new prop value"},"object2": {"new prop1": "new prop value"},"object3": {"new prop1": "new prop value"},"object4": {"new prop1": "new prop value"}}},"Amy Ryan": {"one": "In Treatment","two": "The Wire"},"Annie Fitzgerald": ["Big Love","True Blood"],"Anwan Glover": ["Treme","The Wire"],"Alexander Skarsgard": ["Generation Kill","True Blood"], "Clarke Peters": null}');
    $('#textarearight').val('{"Aidan Gillen": {"array": ["Game of Thrones","The Wire"],"string": "some string","int": "2","otherint": 4, "aboolean": "true", "boolean": false, "null": null, "a_null":88, "another_null": null, "object": {"foo": "bar"}},"Amy Ryan": ["In Treatment","The Wire"],"Annie Fitzgerald": ["True Blood","Big Love","The Sopranos","Oz"],"Anwan Glover": ["Treme","The Wire"],"Alexander Skarsg?rd": ["Generation Kill","True Blood"],"Alice Farmer": ["The Corner","Oz","The Wire"]}');

    jdd.compare();

    // This test makes sure there wasn't a parsing error
    assert.ok(jdd.diffs.length > 0, 'Checking for parsing errors');

    assert.ok(jdd.diffs.length === 20, 'Checking for the correct number of differences');

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

    assert.ok(eqCount === 4, 'Checking unequal values');
    assert.ok(missingCount === 11, 'Checking missing values');
    assert.ok(typeCount === 5, 'Checking incorrect types');

    $('#textarealeft').val('');
    $('#textarearight').val('');
    jdd.setupNewDiff();
});

/** 
 * This test focuses on finding differences between objects and arrays with similar data at the
 * root of the JSON document.
 */
QUnit.test('Array to object compare tests', function (assert) {
    $('#textarealeft').val('[{  "OBJ_ID": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "b3067a77-875b-4208-9ee3-39128adeb654",  "lastLogon": "0",  "sAMAccountName": "ksmith",  "userPrincipalName": "ksmith@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"},{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]');
    $('#textarearight').val('{"foo":[{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]}');

    jdd.compare();

    // This test makes sure there wasn't a parsing error
    assert.ok(jdd.diffs.length > 0, 'Checking for parsing errors');

    assert.ok(jdd.diffs.length === 1, 'Checking for the correct number of differences');

    assert.ok(jdd.diffs[0].type === jdd.TYPE, 'Checking incorrect type');

    $('#textarealeft').val('');
    $('#textarearight').val('');
    jdd.setupNewDiff();
});

/** 
 * This test focuses on comparing arrays and makes sure that we can properly tell the difference
 * between missing and unequal values.
 */
QUnit.test('Array compare tests', function (assert) {
    $('#textarealeft').val('[{  "OBJ_ID": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "b3067a77-875b-4208-9ee3-39128adeb654",  "lastLogon": "0",  "sAMAccountName": "ksmith",  "userPrincipalName": "ksmith@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"},{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]');
    $('#textarearight').val('[{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]');

    jdd.compare();

    // This test makes sure there wasn't a parsing error
    assert.ok(jdd.diffs.length > 0, 'Checking for parsing errors');

    assert.ok(jdd.diffs.length === 7, 'Checking for the correct number of differences');

    var eqCount = 0;
    var missingCount = 0;


    jdd.diffs.forEach(function (diff) {
        if (diff.type === jdd.EQUALITY) {
            eqCount++;
        } else if (diff.type === jdd.MISSING) {
            missingCount++;
        }
    });

    assert.ok(eqCount === 6, 'Checking unequal values');
    assert.ok(missingCount === 1, 'Checking missing values');

    $('#textarealeft').val('');
    $('#textarearight').val('');
    jdd.setupNewDiff();
});

/** 
 * This test works a lot like the array to object compare tests, but it switches the left and right
 * values.  We've had a few bugs that only show up when the difference is on a specific side.
 */
QUnit.test('Object to array compare tests', function (assert) {
    $('#textarealeft').val('{"foo":[{  "OBJ_ID": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "b3067a77-875b-4208-9ee3-39128adeb654",  "lastLogon": "0",  "sAMAccountName": "ksmith",  "userPrincipalName": "ksmith@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"},{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]}');
    $('#textarearight').val('[{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]');

    jdd.compare();

    // This test makes sure there wasn't a parsing error
    assert.ok(jdd.diffs.length > 0, 'Checking for parsing errors');

    assert.ok(jdd.diffs.length === 1, 'Checking for the correct number of differences');

    assert.ok(jdd.diffs[0].type === jdd.TYPE, 'Checking incorrect type');

    $('#textarealeft').val('');
    $('#textarearight').val('');
    jdd.setupNewDiff();
});

/** 
 * These tests cover differences with whitespace in them.  Specifically cases where there are new lines, backspaces, 
 * tabs, and other whitespace characters within the JSON keys and values.  These values are escaped in the JSON source,
 * but show up unescaped in the JSON object.  We need to make sure we add them back and convert the line numbers properly.
 */
QUnit.test('Whitespace formatting tests', function (assert) {
    $('#textarealeft').val('{"newline": "a\\nb","slash": "a\\\\b","quotes": "a\\"b","backspace": "a\\bb","formfeed": "a\\fb","carriagereturn": "a\\rb","tab": "a\\tb","a\\nb": "newline","a\\\\b": "slash","a\\"b": "quotes","a\\bb": "backspace","a\\fb": "formfeed","a\\rb": "carriagereturn","a\\tb": "tab"}');
    $('#textarearight').val('{"newline": "a\\nbx","slash": "a\\\\bx","quotes": "a\\"bx","backspace": "a\\bbx","formfeed": "a\\fbx","carriagereturn": "a\\rbx","tab": "a\\tbx","a\\nb": "newline","a\\\\bx": "slash","a\\"bx": "quotes","a\\bbx": "backspace","a\\fbx": "formfeed","a\\rbx": "carriagereturn","a\\tbx": "tab"}');

    jdd.compare();

    // This test makes sure there wasn't a parsing error
    assert.ok(jdd.diffs.length > 0, 'Checking for parsing errors');

    assert.ok(jdd.diffs.length === 19, 'Checking for the correct number of differences');

    assert.ok(jdd.diffs[0].type === jdd.MISSING, 'Checking missing property');
    assert.ok(jdd.diffs[0].msg === 'Missing property <code>a\\bx</code> from the object on the left side', 'Checking property formatting');

    assert.ok(jdd.diffs[9].type === jdd.MISSING, 'Checking missing property');
    assert.ok(jdd.diffs[9].msg === 'Missing property <code>a\"b</code> from the object on the right side', 'Checking property formatting');

    assert.ok(jdd.diffs[14].type === jdd.EQUALITY, 'Checking missing property');

    assert.ok(jdd.diffs[18].type === jdd.EQUALITY, 'Checking missing property');

    $('#textarealeft').val('');
    $('#textarearight').val('');
    jdd.setupNewDiff();
});

/** 
 * This test tests for null values when compared to arrays on the right side of the compare.
 */
QUnit.test('Null array length tests - right side', function (assert) {
    $('#textarealeft').val('{ "akey": [] }');
    $('#textarearight').val('{ "akey": null }');

    jdd.compare();

    assert.ok(jdd.diffs[0].type === jdd.TYPE, 'Checking correct type');

    $('#textarealeft').val('');
    $('#textarearight').val('');
    jdd.setupNewDiff();
});

/** 
 * This test tests for null values when compared to arrays on the left side of the compare.
 */
QUnit.test('Null array length tests - left side', function (assert) {
    $('#textarealeft').val('{ "akey": null }');
    $('#textarearight').val('{ "akey": [] }');

    jdd.compare();

    assert.ok(jdd.diffs[0].type === jdd.TYPE, 'Checking correct type');

    $('#textarealeft').val('');
    $('#textarearight').val('');
    jdd.setupNewDiff();
});


/** 
 * This test tests for null values when compared to arrays on the right side of the compare.
 */
QUnit.test('Null object length tests - right side', function (assert) {
    $('#textarealeft').val('{ "akey": {} }');
    $('#textarearight').val('{ "akey": null }');

    jdd.compare();

    assert.ok(jdd.diffs[0].type === jdd.TYPE, 'Checking correct type');

    $('#textarealeft').val('');
    $('#textarearight').val('');
    jdd.setupNewDiff();
});

/** 
 * This test tests for null values when compared to arrays on the left side of the compare.
 */
QUnit.test('Null object length tests - left side', function (assert) {
    $('#textarealeft').val('{ "akey": null }');
    $('#textarearight').val('{ "akey": {} }');

    jdd.compare();

    assert.ok(jdd.diffs[0].type === jdd.TYPE, 'Checking correct type');

    $('#textarealeft').val('');
    $('#textarearight').val('');
    jdd.setupNewDiff();
});

QUnit.test('Escaped quotes test', function (assert) {
    $('#textarealeft').val('{"link": "<a href=\\\"http://google.com/\\\">Google</a>"}');
    $('#textarearight').val('{"link": "<a href=\\\"http://googlex.com/\\\">Google</a>"}');

    jdd.compare();
    assert.ok(jdd.diffs[0].type === jdd.EQUALITY, 'Checking correct type');
    assert.ok($('pre.right div.line2 span').text().trim() === '"link": "<a href=\\\"http://googlex.com/\\\">Google</a>"', 'Checking escaped quotes');
    assert.ok($('pre.left div.line2 span').text().trim() === '"link": "<a href=\\\"http://google.com/\\\">Google</a>"', 'Checking escaped quotes');

    $('#textarealeft').val('');
    $('#textarearight').val('');
    jdd.setupNewDiff();
});

QUnit.test('Slashes in keys test', function (assert) {
    try {
        $('#textarealeft').val('{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {".vscode/": true,"foo": "bar"}}');
        $('#textarearight').val('{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {".slash/": true,"foo": "bar"}}');

        jdd.compare();
        assert.ok(jdd.diffs[0].type === jdd.MISSING, 'Checking correct type');

        $('#textarealeft').val('');
        $('#textarearight').val('');
        jdd.setupNewDiff();
    } catch (err) {
        console.error(err);
    }
});

QUnit.test('Slashes in values test', function (assert) {
    try {
        $('#textarealeft').val('{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {"bas":".vscode/","foo": "bar"}}');
        $('#textarearight').val('{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {"bas":".slash/","foo": "bar"}}');

        jdd.compare();
        assert.ok(jdd.diffs[0].type === jdd.EQUALITY, 'Checking correct type');

        $('#textarealeft').val('');
        $('#textarearight').val('');
        jdd.setupNewDiff();
    } catch (err) {
        console.error(err);
    }
});

QUnit.test('Proxy test', function (assert) {
    try {
        var done = assert.async();

        $.post('proxy.php',
            {
                'url': 'https://jsondiff.com/one.json'
            }, function (responseObj) {
                if (responseObj.error) {
                    console.err(responseObj.error);
                    assert.ok(false, 'Failed to load proxy file');
                } else {
                    assert.ok(true, 'Loaded proxy file');
                    var obj = JSON.parse(responseObj.content);
                    assert.ok(obj['Aidan Gillen'].string === 'some string', 'Completed parsing and received correct values.');
                }
                
                done();
            }, 'json');
    } catch (err) {
        console.error(err);
    }
});

/** 
 * This test tests the base64 decoding functionality of using data URLs.
 */
QUnit.test('Base64 test', function (assert) {
    try {
        $('#textarealeft').val('data:base64,eyJmb28iOiAxfQ==');
        $('#textarearight').val('data:base64,eyJmb28iOiAyfQ==');

        jdd.compare();
        // This test makes sure there wasn't a parsing error
        assert.ok(jdd.diffs.length > 0, 'Checking for parsing errors');
        assert.ok(jdd.diffs.length === 1, 'Checking for the correct number of differences');

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

        assert.ok(eqCount === 1, 'Checking unequal values');

        $('#textarealeft').val('');
        $('#textarearight').val('');
        jdd.setupNewDiff();
    } catch (err) {
        console.error(err);
    }
});

/** 
 * This test tests the base64 decoding functionality of using data URLs.
 */
QUnit.test('Base64 test - JSON mimetype', function (assert) {
    try {
        $('#textarealeft').val('data:application/json;base64,eyJmb28iOiAxfQ==');
        $('#textarearight').val('data:application/json;base64,eyJmb28iOiAyfQ==');

        jdd.compare();
        // This test makes sure there wasn't a parsing error
        assert.ok(jdd.diffs.length > 0, 'Checking for parsing errors');
        assert.ok(jdd.diffs.length === 1, 'Checking for the correct number of differences');

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

        assert.ok(eqCount === 1, 'Checking unequal values');

        $('#textarealeft').val('');
        $('#textarearight').val('');
        jdd.setupNewDiff();
    } catch (err) {
        console.error(err);
    }
});

/** 
 * This test tests the base64 decoding functionality of using data URLs.
 */
QUnit.test('Base64 test - plain text mimetype', function (assert) {
    try {
        $('#textarealeft').val('data:text/plain;base64,eyJmb28iOiAxfQ==');
        $('#textarearight').val('data:text/plain;base64,eyJmb28iOiAyfQ==');

        jdd.compare();
        // This test makes sure there wasn't a parsing error
        assert.ok(jdd.diffs.length > 0, 'Checking for parsing errors');
        assert.ok(jdd.diffs.length === 1, 'Checking for the correct number of differences');

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

        assert.ok(eqCount === 1, 'Checking unequal values');

        $('#textarealeft').val('');
        $('#textarearight').val('');
        jdd.setupNewDiff();
    } catch (err) {
        console.error(err);
    }
});


QUnit.done(function () {
    $('div.initContainer').hide();
    $('div.diffContainer').hide();
});
