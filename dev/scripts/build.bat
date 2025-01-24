:: Copyright (c) 2012-2025, CKSource Holding sp. z o.o. All rights reserved.
:: For licensing, see LICENSE.md

:: Builds CKEditor release using the source version of CKBuilder (useful for debugging issues in CKBuilder).

echo ""
echo "Starting CKBuilder..."

set SCRIPTDIR=%CD%

cd %SCRIPTDIR%\ckeditor

for /f "delims=" %%a in ('git rev-parse --verify --short HEAD') do @set rev=%%a

:: Move to the CKBuilder root folder.
cd ../../..

java -cp lib/apache/commons-cli.jar;lib/rhino/js.jar;lib/javatar/tar.jar;lib/closure/compiler.jar ^
org.mozilla.javascript.tools.shell.Main -opt -1 src/ckbuilder.js ^
--build %SCRIPTDIR%/ckeditor %SCRIPTDIR%/release --build-config %SCRIPTDIR%/ckeditor/dev/builder/build-config.js --overwrite --version=DEV --revision=%rev% %*

cd %SCRIPTDIR%

echo ""
echo "Release created in the \"release\" directory."
