#!/bin/sh

# Copyright (c) 2012-2024, CKSource Holding sp. z o.o. All rights reserved.
# For licensing, see LICENSE.md

# Runs jshint on source files.

jshint -c .jshintrc --show-non-errors ../../src/*.js ../../src/*/*.js
