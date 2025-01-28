/*
 Copyright (c) 2012-2025, CKSource Holding sp. z o.o. All rights reserved.
 For licensing, see LICENSE.md
 */

( function() {
	var regexLib = {
		// requires : [ 'dialogui' ]
		requiresArray: Pattern.compile( '^\\s*requires\\s*:\\s*\\[\\s*(.*?)\\s*\\]' ),
		requiresString: Pattern.compile( '^\\s*requires\\s*:\\s*([\'"])\\s*((?:[a-z0-9-_]+|\\s*,\\s*)+?)\\1\\s*' ),
		// lang : 'af,ar,bg'
		langString: Pattern.compile( '^(\\s*lang\\s*:\\s*)([\'"])(\\s*(?:[a-z-_]+|\\s*,\\s*)+?)(\\2\\s*.*$)' ),
		// matches both CKEDITOR.plugins.add( pluginName AND CKEDITOR.plugins.add( 'pluginName'
		// can be used to detect where "CKEDITOR.plugins.add" is located in code
		pluginsAdd: Pattern.compile( 'CKEDITOR.plugins.add\\s*\\(\\s*([\'"]?)([a-zA-Z0-9-_]+)\\1', Pattern.DOTALL ),
		// matches CKEDITOR.plugins.liststyle =
		pluginsDef: Pattern.compile( 'CKEDITOR.plugins.[a-z-_0-9]+\\s*=\\s*', Pattern.DOTALL ),
		// matches only CKEDITOR.plugins.add( 'pluginName'
		// can be used to find the real plugin name, because the name is not stored in a variable but in a string
		pluginsAddWithStringName: Pattern.compile( 'CKEDITOR.plugins.add\\s*\\(\\s*([\'"])([a-zA-Z0-9-_]+)\\1', Pattern.DOTALL ),
		pluginName: Pattern.compile( 'var\\s+pluginName\\s*=\\s*([\'"])([a-zA-Z0-9-_]+)\\1', Pattern.DOTALL ),
		validPluginProps: Pattern.compile( '(^\\s*icons\\s*:\\s*|^\\s*requires\\s*:\\s*|^\\s*lang\\s*:\\s*|^\\s*$|^\\s*//)', Pattern.DOTALL ),
		blockComments: Pattern.compile( "/\\*[^\\r\\n]*[\\r\\n]+(.*?)[\\r\\n]+[^\\r\\n]*\\*+/", Pattern.DOTALL )
	};

	/**
	 * Finds the plugin name in given file (plugin.js).
	 *
	 * @param {java.io.File} file
	 * @returns {String|null}
	 * @member CKBuilder.plugin
	 * @private
	 */
	function findPluginNameInPluginDefinition( file ) {
		var pluginName = null,
			code = CKBuilder.io.readFile( file );

		code = CKBuilder.javascript.removeWhiteSpace( code, file.getParentFile().getName() + "/plugin.js" );
		var matcher = regexLib.pluginsAddWithStringName.matcher( code );
		if ( matcher.find() )
			pluginName = matcher.group( 2 );
		else {
			matcher = regexLib.pluginName.matcher( code );
			if ( matcher.find() )
				pluginName = matcher.group( 2 );
		}

		return ( pluginName === null ? pluginName : String( pluginName ) );
	}

	/**
	 * Finds the correct plugin.js in given directory.
	 *
	 * @param {java.io.File} dir
	 * @returns {Boolean|String} Path to the right plugin.js file or false.
	 * @member CKBuilder.plugin
	*/
	function findCorrectPluginFile( dir ) {
		var pluginFiles = CKBuilder.utils.findFilesInDirectory( 'plugin.js', dir ),
			result = false;

		if ( pluginFiles.length === 1 )
			result = pluginFiles[ 0 ];

		// let's exclude plugin.js located in the _source or dev folders
		else if ( pluginFiles.length > 1 ) {
			var tmpArray = [];
			for ( var i = 0; i < pluginFiles.length; i++ ) {
				if ( !pluginFiles[ i ].match( /(\/|\\)(?:_source|dev)\1/i ) )
					tmpArray.push( pluginFiles[ i ] );
			}

			if ( tmpArray.length === 1 )
				result = tmpArray[ 0 ];
		}

		return result;
	}

	/**
	 * Handle plugins. Validate them and preprocess.
	 *
	 * @class
	 */
	CKBuilder.plugin = {
		/**
		 * Returns an array with plugins required by this plugin.
		 *
		 * @param {java.io.File} file Plugin file
		 * @returns {Array}
		 * @static
		 */
		getRequiredPlugins: function( file ) {
			if ( CKBuilder.options.debug > 1 )
				print( "Getting required plugins from " + file.getPath() );

			var text = String( CKBuilder.io.readFile( file ) ),
				// Remove comments
				matcher = regexLib.blockComments.matcher( text );

			if ( matcher.find() )
				text = matcher.replaceAll( '' );

			var lines = text.split( "\n" ),
				pluginsAddFound = false,
				checkValidPluginProps = false,
				invalidLinesCounter = 0;

			for ( var i = 0; i < lines.length; i++ ) {
				if ( !pluginsAddFound ) {
					matcher = regexLib.pluginsAdd.matcher( lines[ i ] );
					if ( matcher.find() )
						pluginsAddFound = true;
					else {
						matcher = regexLib.pluginsDef.matcher( lines[ i ] );
						if ( matcher.find() )
							pluginsAddFound = true;
					}
					if ( pluginsAddFound )
						invalidLinesCounter = 0;
				}

				var requires;
				if ( pluginsAddFound ) {
					matcher = regexLib.requiresArray.matcher( lines[ i ] );
					if ( matcher.find() ) {
						requires = String( matcher.group( 1 ) );
						if ( CKBuilder.options.debug > 1 )
							print( "Found: " + matcher.group( 1 ) );
						return requires.replace( /['" ]/g, '' ).split( "," );
					}

					matcher = regexLib.requiresString.matcher( lines[ i ] );
					if ( matcher.find() ) {
						requires = String( matcher.group( 2 ) );
						if ( CKBuilder.options.debug > 1 )
							print( "Found: " + matcher.group( 2 ) );
						return requires.replace( /['" ]/g, '' ).split( "," );
					}

					if ( checkValidPluginProps ) {
						matcher = regexLib.validPluginProps.matcher( lines[ i ] );
						if ( !matcher.find() )
							invalidLinesCounter++;
						if ( invalidLinesCounter > 5 ) {
							pluginsAddFound = false;
							checkValidPluginProps = false;
						}
					}
					// we're in the same line where plugin definition has started, start checking from another line
					else
						checkValidPluginProps = true;
				}
			}
			return [];
		},

		/**
		 * Updates lang property in file.
		 *
		 * @param {java.io.File} sourceLocation
		 * @param {Object} languages
		 * @returns {Array|Boolean}
		 * @static
		 */
		updateLangProperty: function( sourceLocation, languages ) {
			var text = String( CKBuilder.io.readFile( sourceLocation ) ),
				lines = text.split( "\n" ),
				pluginsAddFound = false,
				checkValidPluginProps = false,
				langPropertyChanged = false,
				invalidLinesCounter = 0,
				validLanguages;

			for ( var i = 0; i < lines.length; i++ ) {
				var matcher;
				if ( !pluginsAddFound ) {
					matcher = regexLib.pluginsAdd.matcher( lines[ i ] );

					if ( matcher.find() )
						pluginsAddFound = true;
					else {
						matcher = regexLib.pluginsDef.matcher( lines[ i ] );
						if ( matcher.find() )
							pluginsAddFound = true;
					}
					if ( pluginsAddFound )
						invalidLinesCounter = 0;
				}

				if ( pluginsAddFound ) {
					matcher = regexLib.langString.matcher( lines[ i ] );
					if ( matcher.find() ) {
						var pluginLanguages = String( matcher.group( 3 ) ).replace( /['" ]/g, '' ).split( "," );

						validLanguages = [];

						for ( var langCode in languages ) {
							if ( languages[ langCode ] && pluginLanguages.indexOf( langCode ) !== -1 )
								validLanguages.push( langCode );

						}
						// better to change the lang property only if we're able to find some matching language files...
						if ( validLanguages.length ) {
							if ( validLanguages.length !== pluginLanguages.length ) {
								lines[ i ] = matcher.group( 1 ) + matcher.group( 2 ) + validLanguages.join( ',' ) + matcher.group( 4 );
								langPropertyChanged = true;
							} else
								return true;

						}
					}
					if ( checkValidPluginProps ) {
						matcher = regexLib.validPluginProps.matcher( lines[ i ] );
						if ( !matcher.find() )
							invalidLinesCounter++;

						if ( invalidLinesCounter > 5 ) {
							pluginsAddFound = false;
							checkValidPluginProps = false;
						}
					}
					// We're in the same line where plugin definition has started, start checking from another line.
					else
						checkValidPluginProps = true;
				}
			}
			if ( langPropertyChanged ) {
				if ( CKBuilder.options.debug > 1 )
					print( "Updated lang property in " + sourceLocation.getPath() );

				CKBuilder.io.saveFile( sourceLocation, lines.join( "\r\n" ), true );
				return validLanguages;
			}

			return false;
		},

		/**
		 * Checks specified plugin for errors.
		 *
		 * @param {java.io.File|String} plugin Path to the plugin (or the java.io.File object pointing to a plugin file).
		 * @param {Object=} options
		 * @param {Boolean=} options.exitOnError
		 * @param {String=} options.pluginName
		 * @returns {String}
		 * @static
		 */
		verify: function( plugin, options ) {
			var errors = "",
				workingDirObj = CKBuilder.io.prepareWorkingDirectoryIfNeeded( plugin ),
				workingDir = workingDirObj.directory;

			if ( CKBuilder.options.skipPluginValidation > 1 ) {
				print( "Skipping JS files validation" );
				return "OK";
			}

			if ( CKBuilder.options.debug > 1 )
				print( "Validating JS files" );

			if ( CKBuilder.options.skipPluginValidation < 1 ) {
				errors += CKBuilder.tools.validateJavaScriptFiles(workingDir);
				errors += CKBuilder.tools.validateJavaScriptFilesUsingCC(workingDir);
			}

			if ( !errors ) {
				var pluginPath = findCorrectPluginFile( workingDir );
				if ( !pluginPath ) {
					// check why findCorrectPluginFile() returned false
					var pluginPaths = CKBuilder.utils.findFilesInDirectory( 'plugin.js', workingDir );
					if ( pluginPaths.length > 1 ) {
						var tmpArray = [],
							workingDirPath = workingDir.getAbsolutePath();

						for ( var i = 0; i < pluginPaths.length; i++ ) {
							pluginPaths[ i ] = String( pluginPaths[ i ].replace( workingDirPath, '' ) ).replace( /\\/g, '/' );
							if ( !pluginPaths[ i ].match( /(\/|\\)(?:_source|dev)\1/i ) )
								tmpArray.push( pluginPaths[ i ] );
						}
						if ( !tmpArray.length )
							errors += "Could not find plugin.js:\n" + pluginPaths.join( "\n" ) + "\n";
						else if ( tmpArray.length > 1 )
							errors += "Found more than one plugin.js:\n" + pluginPaths.join( "\n" ) + "\n";
					} else
						errors += "Unable to locate plugin.js" + "\n";
				} else {
					if ( options && options.pluginName ) {
						var pluginName = findPluginNameInPluginDefinition( new File( pluginPath ) );
						if ( pluginName && pluginName !== options.pluginName )
							errors += "The plugin name defined inside plugin.js (" + pluginName + ") does not match the expected plugin name (" + options.pluginName + ")" + "\n";
					}
				}
			}

			workingDirObj.cleanUp();

			if ( errors && options && options.exitOnError )
				System.exit( 500 );

			return errors ? errors : "OK";
		},

		/**
		 * Preprocesses the specified plugin and saves in an optimized form in the target folder.
		 *
		 * @param {String} plugin Path to the plugin
		 * @param {String} dstDir Path to the destination folder
		 * @static
		 */
		preprocess: function( plugin, dstDir ) {
			var workingDirObj = CKBuilder.io.prepareWorkingDirectoryIfNeeded( plugin ),
				workingDir = workingDirObj.directory;

			if ( this.verify( workingDir, { exitOnError: false } ) !== "OK" ) {
				workingDirObj.cleanUp();
				throw( "The plugin is invalid" );
			}

			var pluginPath = findCorrectPluginFile( workingDir );
			if ( !pluginPath ) {
				workingDirObj.cleanUp();
				throw( "The plugin file (plugin.js) was not found in " + workingDir.getCanonicalPath() );
			}

			var pluginFile = new File( pluginPath ),
				targetFolder = new File( dstDir );

			try {
				targetFolder.mkdirs();
			} catch ( e ) {
				workingDirObj.cleanUp();
				throw( "Unable to create target directory: " + targetFolder.getAbsolutePath() + "\nError: " + e.getMessage() );
			}

			var flags = {},
				rootFolder = pluginFile.getParentFile();

			CKBuilder.io.copy( rootFolder, targetFolder, function( sourceLocation, targetLocation ) {
					if ( sourceLocation.isFile() ) {
						// Manifest file is converted later to a "php.ini" format and saved as manifest.mf
						if ( String( sourceLocation.getAbsolutePath() ) === String( File( rootFolder, "manifest.js" ).getAbsolutePath() ) )
							return -1;

						var copied = CKBuilder.tools.fixLineEndings( sourceLocation, targetLocation );
						if ( copied ) {
							// Do not process any directives
							if ( CKBuilder.options.leaveJsUnminified )
								return 1;

							var flag = CKBuilder.tools.processDirectives( targetLocation, null, true );
							if ( flag.LEAVE_UNMINIFIED )
								flags[ targetLocation.getAbsolutePath() ] = flag;

							return 1;
						}
					} else {
						if ( !CKBuilder.options.leaveJsUnminified && String( sourceLocation.getAbsolutePath() ) === String( File( rootFolder, "lang" ).getAbsolutePath() ) )
							return -1;
					}
					return 0;
				}, function( targetLocation ) {
					if ( CKBuilder.options.leaveJsUnminified )
						return;

					if ( CKBuilder.io.getExtension( targetLocation.getName() ) === 'js' ) {
						var targetPath = targetLocation.getAbsolutePath();
						if ( flags[ targetPath ] && flags[ targetPath ].LEAVE_UNMINIFIED ) {
							if ( CKBuilder.options.debug > 1 )
								print( "Leaving unminified: " + targetLocation.getPath() );

							CKBuilder.io.saveFile( targetLocation, CKBuilder.tools.removeLicenseInstruction( CKBuilder.io.readFile( targetLocation ) ), true );
							return;
						}
						// remove @license information from files that will go into ckeditor.js (plugin.js)
						if ( String( targetPath ) === String( File( targetFolder, "plugin.js" ).getAbsolutePath() ) ) {
							if ( CKBuilder.options.debug > 2 )
								print( "Removing license information from " + targetPath );
							CKBuilder.io.saveFile( targetLocation, CKBuilder.tools.removeLicenseInstruction( CKBuilder.io.readFile( targetLocation ) ), true );
						}

						if ( CKBuilder.options.debug )
							print( "Minifying: " + targetLocation.getPath() );

						CKBuilder.javascript.minify( targetLocation );
					}
				} );

			var langFolder = new File( rootFolder, "lang" ),
				targetLangFolder = new File( targetFolder, "lang" );
			if ( !CKBuilder.options.leaveJsUnminified && langFolder.exists() ) {
				targetLangFolder.mkdir();
				var translations = {};
				print( "Processing lang folder" );
				translations.en = CKBuilder.lang.loadLanguageFile( new File( langFolder, "en.js" ) ).translation;
				var children = langFolder.list();
				for ( var i = 0; i < children.length; i++ ) {
					var langFile = children[ i ].match( /^([a-z]{2}(?:-[a-z]+)?)\.js$/ );
					if ( langFile ) {
						var langCode = langFile[ 1 ];
						translations[ langCode ] = CKBuilder.utils.merge( translations.en, CKBuilder.lang.loadLanguageFile( new File( langFolder, children[ i ] ) ).translation );
						var pseudoObject = JSON.stringify( translations[ langCode ] ).replace( /^\{(.*)\}$/, '$1' );
						CKBuilder.io.saveFile( File( targetLangFolder, children[ i ] ), pseudoObject, true );
					}
				}
			}

			workingDirObj.cleanUp();
		}
	};

}() );
