#!/bin/bash
# Copyright (c) 2012-2022, CKSource Holding sp. z o.o. All rights reserved.
# For licensing, see LICENSE.md

# We need to execute scripts from parent directory...
cd ..

/usr/bin/java -cp lib/rhino/js.jar:lib/apache/commons-cli.jar:lib/javatar/tar.jar:lib/tartool/tartool.jar:lib/closure/compiler.jar org.mozilla.javascript.tools.shell.Main -opt -1 test/test.js

cd test
