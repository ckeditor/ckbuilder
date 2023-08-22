:: Copyright (c) 2012-2023, CKSource Holding sp. z o.o. All rights reserved.
:: For licensing, see LICENSE.md

@echo Off

:: https://www.jshint.com/platforms/
:: To run the script install node and jshint:
:: npm install jshint -g

:: Find files in "src" folder
SETLOCAL EnableDelayedExpansion
SET Files=
FOR /f %%a IN ('dir /b/s ..\src\lib\*.js') do (
	SET Files=!Files! %%a
)
SET Files=!Files! ..\test\test.js

jshint %Files% --show-non-errors
