/*
 Copyright (c) 2012-2014, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md
 */

( function() {
	var regexLib = {
		eol: Pattern.compile( '(?:\\x09|\\x20)+$' ),
		eof: Pattern.compile( '(?:\\x09|\\x20|\\r|\\n)+$' ),
		Remove: Pattern.compile( '(?m-s:^.*?%REMOVE_START%).*?(?m-s:%REMOVE_END%.*?$)', Pattern.DOTALL ),
		RemoveCore: Pattern.compile( '(?m-s:^.*?%REMOVE_START_CORE%).*?(?m-s:%REMOVE_END_CORE%.*?$)', Pattern.DOTALL ),
		RemoveLine: Pattern.compile( '.*%REMOVE_LINE%.*(?:\\r\\n|\\r|\\n)?' ),
		RemoveLineCore: Pattern.compile( '.*%REMOVE_LINE_CORE%.*(?:\\r\\n|\\r|\\n)?' ),
		Timestamp: Pattern.compile( '%TIMESTAMP%' ),
		CopyrightComment: Pattern.compile( '/\\*[\\s\\*]*Copyright[\\s\\S]+?\\*/(?:\\r\\n|\\r|\\n)', Pattern.DOTALL | Pattern.CASE_INSENSITIVE ),
		LicenseComment: Pattern.compile( '/\\*[\\s\\*]*\\@license[\\s\\S]+?\\*/(?:\\r\\n|\\r|\\n)', Pattern.DOTALL ),
		Rev: Pattern.compile( '%REV%' ),
		Version: Pattern.compile( '%VERSION%' ),
		license: Pattern.compile( '\\@license( )?', Pattern.DOTALL )
	};

	var lineEndings = {
		"cgi": "\n",
		"pl": "\n",
		"sh": "\n",
		"readme": "\r\n",
		"afp": "\r\n",
		"afpa": "\r\n",
		"ascx": "\r\n",
		"asp": "\r\n",
		"aspx": "\r\n",
		"bat": "\r\n",
		"cfc": "\r\n",
		"cfm": "\r\n",
		"code": "\r\n",
		"command": "\r\n",
		"conf": "\r\n",
		"css": "\r\n",
		"dtd": "\r\n",
		"htaccess": "\r\n",
		"htc": "\r\n",
		"htm": "\r\n",
		"html": "\r\n",
		"js": "\r\n",
		"jsp": "\r\n",
		"lasso": "\r\n",
		"md": "\r\n",
		"php": "\r\n",
		"py": "\r\n",
		"sample": "\r\n",
		"txt": "\r\n",
		"xml": "\r\n"
	};

	/**
	 * @class
	 */
	CKBuilder.tools = {
		/**
		 * Fix line endings in given file. Only selected text files are processed.
		 *
		 * @param {java.io.File} sourceFile
		 * @param {java.io.File} targetFile
		 * @static
		 */
		fixLineEndings: function( sourceFile, targetFile ) {
			var extension = CKBuilder.io.getExtension( sourceFile.getName() ),
				bomExtensions = { asp: 1, js: 1 };

			if ( !lineEndings[ extension ] )
				return false;

			if ( CKBuilder.options.debug > 1 )
				print( "Fixing line endings in: " + targetFile.getAbsolutePath() );

			var buffer = new StringBuffer(),
				inStream = new BufferedReader( new InputStreamReader( new FileInputStream( sourceFile ), "UTF-8" ) ),
				line;

			var firstLine = true;
			while ( ( line = inStream.readLine() ) != null ) {
				if ( firstLine ) {
					var hasBom = line.length() && line.charAt( 0 ) === 65279;
					if ( !hasBom && extension in bomExtensions )
						buffer.append( String.fromCharCode( 65279 ) );
					else if ( hasBom && !( extension in bomExtensions ) )
						line = line.substring( 1 );

					firstLine = false;
				}

				// Strip whitespace characters
				line = regexLib.eol.matcher( line ).replaceAll( "" );
				buffer.append( line );
				buffer.append( lineEndings[ extension ] );
			}

			CKBuilder.io.saveFile( targetFile, regexLib.eof.matcher( buffer.toString() ).replaceAll( lineEndings[ extension ] ) );

			return true;
		},

		/**
		 * Updates copyright headers in text files.
		 *
		 * @param {java.io.File} targetFile
		 */
		updateCopyrights: function( targetFile ) {
			var extension = CKBuilder.io.getExtension( targetFile.getName() ),
				bomExtensions = { asp: 1, js: 1 };

			if ( !lineEndings[ extension ] ) {
				return false;
			}

			text = CKBuilder.io.readFile( targetFile );
			if ( text.indexOf( "Copyright" ) === -1 || text.indexOf( "CKSource" ) === -1 ) {
				return;
			}

			if ( text.indexOf( 'For licensing, see LICENSE.md or http://ckeditor.com/license' ) !== -1 ) {
				text = text.replace( 'For licensing, see LICENSE.md or http://ckeditor.com/license', 'This software is covered by CKEditor Commercial License. Usage without proper license is prohibited.' );
				CKBuilder.io.saveFile( targetFile, text, bomExtensions[ extension ] );
				return;
			}

			if ( text.indexOf( 'For licensing, see LICENSE.md or [http://ckeditor.com/license](http://ckeditor.com/license)' ) !== -1 ) {
				text = text.replace( 'For licensing, see LICENSE.md or [http://ckeditor.com/license](http://ckeditor.com/license)', 'This software is covered by CKEditor Commercial License. Usage without proper license is prohibited.' );
				CKBuilder.io.saveFile( targetFile, text, bomExtensions[ extension ] );
				return;
			}
		},

		/**
		 * Returns the copyright statement found in the text
		 * The Copyright statement starts either with "@license" or with "Copyright".
		 *
		 * @param {String} text
		 * @returns {String}
		 * @static
		 */
		getCopyrightFromText: function( text ) {
			var matcher = regexLib.CopyrightComment.matcher( text );
			if ( matcher.find() )
				return matcher.group( 0 );

			matcher = regexLib.LicenseComment.matcher( text );
			if ( matcher.find() )
				return matcher.group( 0 );

			return "";
		},

		/**
		 * Remove all copyright statements in given string.
		 *
		 * @param {String} text
		 * @returns {String}
		 * @static
		 */
		removeLicenseInstruction: function( text ) {
			return String( regexLib.license.matcher( text ).replaceAll( '' ) );
		},

		/**
		 * Cleans up the target folder.
		 *
		 * @param {java.io.File} targetLocation
		 * @static
		 */
		prepareTargetFolder: function( targetLocation ) {
			if ( targetLocation.exists() ) {
				if ( !CKBuilder.options.overwrite )
					CKBuilder.error( "Target folder already exists: " + targetLocation.getAbsolutePath() );

				print( "Cleaning up target folder" );
				try {
					if ( !CKBuilder.io.deleteDirectory( targetLocation ) )
						throw( "Unable to delete target directory: " + targetLocation.getAbsolutePath() );
				} catch ( e ) {
					throw( "Unable to delete target directory: " + targetLocation.getAbsolutePath() );
				}
			}
			try {
				if ( !targetLocation.mkdirs() )
					throw( "Unable to create target directory: " + targetLocation.getAbsolutePath() );
			} catch ( e ) {
				throw( "Unable to create target directory: " + targetLocation.getAbsolutePath() + "\n" );
			}
		},

		/**
		 * Validate all JS files included in given location using Rhino parser.
		 *
		 * @param {java.io.File} sourceLocation Folder to validate.
		 * @returns {String} An error message with errors, if found any. Empty string if no errors are found.
		 * @static
		 */
		validateJavaScriptFiles: function( sourceLocation ) {
			var dirList = sourceLocation.list(),
				result = "";

			for ( var i = 0; i < dirList.length; i++ ) {
				var f = new File( sourceLocation, dirList[ i ] ),
					error;

				if ( f.isDirectory() ) {
					error = this.validateJavaScriptFiles( f );
					if ( error )
						result += error;
				} else if ( CKBuilder.io.getExtension( f.getName() ) === "js" ) {
					error = this.validateJavaScriptFile( f );
					if ( error )
						result += error + "\n";
				}
			}

			return result;
		},

		/**
		 * Validate all JS files included in given location using Closure Compiler.
		 *
		 * @param {java.io.File} sourceLocation Folder to validate.
		 * @returns {String} An error message with errors, if found any. Empty string if no errors are found.
		 * @static
		 */
		validateJavaScriptFilesUsingCC: function( sourceLocation ) {
			var dirList = sourceLocation.list();
			var result = "";

			for ( var i = 0; i < dirList.length; i++ ) {
				var f = new File( sourceLocation, dirList[ i ] ),
					error;

				if ( f.isDirectory() ) {
					error = this.validateJavaScriptFilesUsingCC( f );
					if ( error )
						result += error;
				} else if ( CKBuilder.io.getExtension( f.getName() ) === "js" ) {
					var code = CKBuilder.io.readFile( f ),
						errors = CKBuilder.javascript.findErrors( code, f.getParentFile().getName() + "/" + f.getName() );

					if ( errors )
						result += errors.join( "\n" );

				}
			}
			return result;
		},

		/**
		 * Validate JS file included in given location using Rhino parser.
		 *
		 * @param {java.io.File} sourceLocation Folder to validate.
		 * @returns {String} An error message with errors, if found any. Empty string if no errors are found.
		 * @static
		 */
		validateJavaScriptFile: function( sourceLocation ) {
			// Setup the compiler environment, error reporter...
			var compilerEnv = new CompilerEnvirons(),
				errorReporter = compilerEnv.getErrorReporter(),

				// Create an instance of the parser...
				parser = new org.mozilla.javascript.Parser( compilerEnv, errorReporter );

			try {
				parser.parse( CKBuilder.io.readFile( sourceLocation ), null, 1 );
				return "";
			} catch ( e ) {
				return sourceLocation.getName() + " (line " + e.lineNumber + "):\n    " + e.message + "";
			}
		},

		/**
		 * Replace CKBuilder directives in given file.
		 * %VERSION%:
		 *     the "version" string passed to the CKReleaser execution command.
		 * %REV%:
		 *     the revision number of the source directory (returned by version control system).
		 * %TIMESTAMP%:
		 *     a four characters string containing the
		 *     concatenation of the "Base 36" value of each of the following components
		 *     of the program execution date and time: year + month + day + hour.
		 * %REMOVE_LINE%:
		 *     removes the line.
		 * %REMOVE_START% and %REMOVE_END%:
		 *     removes all lines starting from %REMOVE_START% to %REMOVE_END%,
		 *     declaration line inclusive.
		 * %LEAVE_UNMINIFIED%
		 *     if set, the resulting object contains LEAVE_UNMINIFIED property set to true.
		 *
		 * @param {java.io.File} file File in which replace the directives
		 * @param {Object} directives (optional) An object with values for placeholders.
		 * @param {Boolean} core Whether to process core directives
		 * @returns {Object} an object with optional set of flags.
		 * @static
		 * Available flags:
		 * LEAVE_UNMINIFIED (Boolean) Indicates whether the file should be minified.
		 */
		processDirectives: function( location, directives, core ) {
			var flags = {},
				text = CKBuilder.io.readFile( location );

			if ( text.indexOf( "%LEAVE_UNMINIFIED%" ) !== -1 )
				flags.LEAVE_UNMINIFIED = true;

			if ( text.indexOf( "%VERSION%" ) !== -1 || text.indexOf( "%REV%" ) !== -1 || text.indexOf( "%TIMESTAMP%" ) !== -1 || text.indexOf( "%REMOVE_START" ) !== -1 || text.indexOf( "%REMOVE_END" ) !== -1 || text.indexOf( "%REMOVE_LINE" ) !== -1 ) {
				var processedText = this.processDirectivesInString( text, directives );
				if ( core )
					processedText = this.processCoreDirectivesInString( processedText );

				if ( text !== processedText ) {
					if ( CKBuilder.options.debug )
						print( "Replaced directives in " + location.getAbsolutePath() );

					CKBuilder.io.saveFile( location, processedText );
				}
			}

			return flags;
		},

		/**
		 * Replace CKBuilder directives in given string.
		 * %VERSION%:
		 *     the "version" string passed to the CKBuilder execution command.
		 * %REV%:
		 *     the revision number of the source directory (returned by version control system).
		 * %TIMESTAMP%:
		 *     a four characters string containing the
		 *     concatenation of the "Base 36" value of each of the following components
		 *     of the program execution date and time: year + month + day + hour.
		 * %REMOVE_LINE%:
		 *     removes the line.
		 * %REMOVE_LINE_CORE%:
		 *     removes the line, but only if file is included in core (merged into ckeditor.js).
		 * %REMOVE_START% and %REMOVE_END%:
		 *     removes all lines starting from %REMOVE_START% to %REMOVE_END%,
		 *     declaration line inclusive.
		 * %REMOVE_START_CORE% and %REMOVE_END_CORE%:
		 *     same as %REMOVE_START% and %REMOVE_END%, but works
		 *     only if file is included in core (merged into ckeditor.js).
		 * @param text {String} Text in which replace the directives
		 * @param directives {Object} (Optional) An object with values for placeholders.
		 * @returns {String} Text
		 * @static
		 */
		processDirectivesInString: function( text, directives ) {
			directives = directives || {};
			directives.version = directives.version || CKBuilder.options.version;
			directives.revision = directives.revision || CKBuilder.options.revision;
			directives.timestamp = directives.timestamp || CKBuilder.options.timestamp;

			if ( text.indexOf( "%VERSION%" ) !== -1 )
				text = String( regexLib.Version.matcher( text ).replaceAll( directives.version ) );

			if ( text.indexOf( "%REV%" ) !== -1 )
				text = String( regexLib.Rev.matcher( text ).replaceAll( directives.revision ) );

			if ( text.indexOf( "%TIMESTAMP%" ) !== -1 )
				text = String( regexLib.Timestamp.matcher( text ).replaceAll( directives.timestamp ) );

			if ( text.indexOf( "%REMOVE_START%" ) !== -1 && text.indexOf( "%REMOVE_END%" ) !== -1 ) {
				text = String( regexLib.Remove.matcher( text ).replaceAll( '%REMOVE_LINE%' ) );
				text = String( regexLib.RemoveLine.matcher( text ).replaceAll( '' ) );
			} else if ( text.indexOf( "%REMOVE_LINE%" ) !== -1 )
				text = String( regexLib.RemoveLine.matcher( text ).replaceAll( '' ) );

			return text;
		},

		/**
		 * Replace CKBuilder "core" directives in given string.
		 * %REMOVE_LINE_CORE%:
		 *     removes the line, but only if file is included in core (merged into ckeditor.js).
		 * %REMOVE_START_CORE% and %REMOVE_END_CORE%:
		 *     same as %REMOVE_START% and %REMOVE_END%, but works
		 *     only if file is included in core (merged into ckeditor.js).
		 * @param {String} text Text in which replace the directives
		 * @returns {String}
		 * @static
		 */
		processCoreDirectivesInString: function( text ) {
			if ( text.indexOf( "%REMOVE_START_CORE%" ) !== -1 && text.indexOf( "%REMOVE_END_CORE%" ) !== -1 ) {
				text = String( regexLib.RemoveCore.matcher( text ).replaceAll( '%REMOVE_LINE_CORE%' ) );
				text = String( regexLib.RemoveLineCore.matcher( text ).replaceAll( '' ) );
			} else if ( text.indexOf( "%REMOVE_LINE_CORE%" ) !== -1 )
				text = String( regexLib.RemoveLineCore.matcher( text ).replaceAll( '' ) );

			return text;
		}
	};
}() );
