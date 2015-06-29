/*
 Copyright (c) 2012-2014, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md
 */

importClass( java.io.File );
importClass( java.lang.System );
importPackage( java.util.regex );
importClass( java.util.regex.Pattern );
importClass( java.util.regex.Matcher );

importClass( com.google.javascript.jscomp.CompilationLevel );
importClass( com.google.javascript.jscomp.Compiler );
importClass( com.google.javascript.jscomp.CompilerOptions );
importClass( com.google.javascript.jscomp.SourceFile );

( function() {

	/**
	 * Compile JavaScript file.
	 *
	 * @param {java.io.File} file
	 * http://closure-compiler.googlecode.com/svn/trunk/javadoc/index.html
	 * @member CKBuilder.javascript
	 * @private
	 * @returns {String}
	 */
	function compileFile( file ) {
		var compiler = new Compiler();
		compiler.setLoggingLevel( java.util.logging.Level.WARNING );

		// http://closure-compiler.googlecode.com/svn/trunk/javadoc/index.html
		// http://closure-compiler.googlecode.com/svn/trunk/javadoc/com/google/javascript/jscomp/CompilerOptions.html
		var options = new CompilerOptions();

		// Otherwise strings in language files are escaped as \u1234 making them larger
		options.outputCharset = 'UTF-8';

		// This is required in order to compile JS files with JSC_TRAILING_COMMA errors
		options.setWarningLevel( com.google.javascript.jscomp.DiagnosticGroups.INTERNET_EXPLORER_CHECKS, CKBuilder.options.noIeChecks ? com.google.javascript.jscomp.CheckLevel.OFF : com.google.javascript.jscomp.CheckLevel.WARNING );

		CompilationLevel.SIMPLE_OPTIMIZATIONS.setOptionsForCompilationLevel( options );

		// To get the complete set of externs, the logic in
		// CompilerRunner.getDefaultExterns() should be used here.
		var extern = SourceFile.fromCode( "externs.js", "function PACKAGER_RENAME() {}" ),

			// The dummy input name "input.js" is used here so that any warnings or
			// errors will cite line numbers in terms of input.js.
			input = SourceFile.fromCode( file.getName(), CKBuilder.io.readFile( file ) ),

			// compile() returns a Result, but it is not needed here.
			result = compiler.compile( extern, input, options );

		if ( result.success )
			return compiler.toSource();
		else
			throw( "Unable to compile file: " + file.getAbsolutePath() );
	}

	/**
	 * Handle javascript files. Minify them, remove white spaces and find errors.
	 *
	 * @class
	 */
	CKBuilder.javascript = {
		/**
		 * Finds errors in given code.
		 *
		 * @param {String} code JavaScript code
		 * @param fileName The name of the file from which the code has been taken (used only to build error messages).
		 * @returns {Array|null}
		 * @static
		 */
		findErrors: function( code, fileName ) {
			var compiler = new Compiler();
			compiler.setLoggingLevel( java.util.logging.Level.OFF );

			var options = new CompilerOptions();
			options.outputCharset = 'UTF-8';
			CompilationLevel.SIMPLE_OPTIMIZATIONS.setOptionsForCompilationLevel( options );

			// To get the complete set of externs, the logic in
			// CompilerRunner.getDefaultExterns() should be used here.
			var extern = SourceFile.fromCode( "externs.js", "function PACKAGER_RENAME() {}" ),

				// The dummy input name "input.js" is used here so that any warnings or
				// errors will cite line numbers in terms of input.js.
				input = SourceFile.fromCode( fileName || "input.js", code );

			// compile() returns a Result, but it is not needed here.
			compiler.compile( extern, input, options );

			var arr = [],
				errors = compiler.getErrors();
			for ( var i = 0; i < errors.length; i++ ) {
				// There are simply too many errors of this kind in various libraries :(
				/* jshint eqeqeq: false */
				if ( 'JSC_TRAILING_COMMA' != errors[ i ].getType().key )
					arr.push( errors[ i ].toString() );
				/* jshint eqeqeq: true */
			}

			return arr.length ? arr : null;
		},

		/**
		 * Removes white space characters from given code (removes comments and extra whitespace in the input JS).
		 *
		 * @param {String} code JavaScript code
		 * @param {String} fileName The name of the file from which the code has been taken (used only to build error messages).
		 * @returns {String}
		 * @static
		 */
		removeWhiteSpace: function( code, fileName ) {
			var compiler = new Compiler();
			//compiler.setLoggingLevel(java.util.logging.Level.OFF);
			compiler.setLoggingLevel( java.util.logging.Level.SEVERE );
			// compiler.setLoggingLevel( java.util.logging.Level.WARNING );

			var options = new CompilerOptions();

			// This is required in order to compile JS files with JSC_TRAILING_COMMA errors
			options.setWarningLevel( com.google.javascript.jscomp.DiagnosticGroups.INTERNET_EXPLORER_CHECKS, CKBuilder.options.noIeChecks ? com.google.javascript.jscomp.CheckLevel.OFF : com.google.javascript.jscomp.CheckLevel.WARNING );

			// Otherwise strings in language files are escaped as \u1234 making them larger
			options.outputCharset = 'UTF-8';
			CompilationLevel.WHITESPACE_ONLY.setOptionsForCompilationLevel( options );

				// To get the complete set of externs, the logic in
				// CompilerRunner.getDefaultExterns() should be used here.
			var extern = SourceFile.fromCode( "externs.js", "function PACKAGER_RENAME() {}" ),

				// The dummy input name "input.js" is used here so that any warnings or
				// errors will cite line numbers in terms of input.js.
				input = SourceFile.fromCode( fileName || "input.js", code ),
				result = compiler.compile( extern, input, options );

			if ( result.success )
				return compiler.toSource(); else
				throw( "Unable to compile file: " + fileName );
		},

		/**
		 * Minify and save specified file.
		 *
		 * @param {java.io.File} file
		 * @static
		 */
		minify: function( file ) {
			if ( CKBuilder.io.getExtension( file.getName() ) !== "js" )
				throw( "Not a JavaScript file: " + file.getAbsolutePath() );

			CKBuilder.io.saveFile( file, compileFile( file ), true );
		}
	};

}() );
