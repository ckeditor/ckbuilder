:: Copyright (c) 2012-2021, CKSource - Frederico Knabben. All rights reserved.
:: For licensing, see LICENSE.md

:: Creates CKBuilder jar file (in the "bin" directory).

@echo off

if "%ANT_HOME%"=="" goto noAntHome
if "%JAVA_HOME%"=="" goto noJavaHome
call "%ANT_HOME%\bin\ant.bat" jar
call "%ANT_HOME%\bin\ant.bat" clean
goto end

:noAntHome
echo ANT_HOME environment variable is not set
goto end

:noJavaHome
echo JAVA_HOME environment variable is not set

:end
