/*
 Copyright (c) 2012-2024, CKSource Holding sp. z o.o. All rights reserved.
 For licensing, see LICENSE.md
 */

/**
 * Responsible for preprocess core, generate build and generate core.
 *
 * @class
 * @param {String} srcDir
 * @param {String} dstDir
 */
CKBuilder.builder = function( srcDir, dstDir ) {
	/**
	 * Build configuration.
	 *
	 * @property {Object} config
	 */
	var config = {};

	/**
	 * The main target skin file.
	 *
	 * @type {java.io.File}
	 */
	var targetSkinFile;

	/**
	 * The main source skin file.
	 *
	 * @type {java.io.File}
	 */
	var sourceSkinFile;

	/**
	 * The main language file.
	 *
	 * @type {java.io.File}
	 */
	var languageFile;

	/**
	 * The list of "core" scripts.
	 * "Helper" variable used to mark script as loaded in "coreScriptsSorted".
	 *
	 * @type {Object}
	 */
	var coreScripts = {};

	/**
	 * The list of "core" scripts, sorted by the loading order.
	 *
	 * @type {Array}
	 */
	var coreScriptsSorted = [];

	/**
	 * The hash map with the list of plugins to include in ckeditor.js.
	 * The key is the name of the plugin.
	 * The value indicates whether the plugin is included in ckeditor.js (true).
	 *
	 * @type {Object}
	 */
	var pluginNames = {};

	/**
	 * The list of plugin files to include in ckeditor.js, sorted by the loading order.
	 *
	 * @type {Object}
	 */
	var sourcePluginFilesSorted = [];

	/**
	 * The list of plugin files to include in ckeditor.js, sorted by the loading order.
	 *
	 * @type {Object}
	 */
	var targetPluginFilesSorted = [];

	/**
	 * Paths to extra files to be included in ckeditor.js, defined by the "js" property.
	 *
	 * @type {Object}
	 */
	var extraCoreJavaScriptFiles = null;

	/**
	 * The extra code to be included in ckeditor.js, defined by the "js" property,
	 *
	 * @type {Object}
	 */
	var extraCoreJavaScriptCode = {};

	/**
	 * The list of plugin names to include in ckeditor.js, sorted by the loading order.
	 *
	 * @type {Array}
	 */
	var pluginNamesSorted = [];

	/**
	 * The "scripts" definition in the loader file.
	 *
	 * @type {Array}
	 */
	var loaderScripts;

	/**
	 * Source location with CKEditor source files.
	 *
	 * @type {java.io.File}
	 */
	var sourceLocation = new File( srcDir );

	/**
	 * Target location where the release will be built.
	 *
	 * @type {java.io.File}
	 */
	var targetLocation = new File( dstDir, 'ckeditor' );

	/**
	 * Checks for some required files/folders and throws an error in case of missing items.
	 */
	function validateSourceFolder() {
		if ( !sourceLocation.exists() )
			CKBuilder.error( 'Source folder does not exist: ' + srcDir );
		if ( !sourceLocation.isDirectory() )
			CKBuilder.error( 'Source folder is not a directory: ' + srcDir );
		var requiredFiles = [
			'lang/' + ( config.language || CKBuilder.DEFAULT_LANGUAGE ) + '.js',
			'core/loader.js',
			'ckeditor.js',
			'lang',
			'plugins'
		];
		if ( config.skin )
			requiredFiles.push( 'skins/' + config.skin + '/skin.js' );

		for ( var i = 0; i < requiredFiles.length; i++ ) {
			var file = new File( sourceLocation, requiredFiles[ i ] );
			if ( !file.exists() )
				throw( 'The source directory is not invalid. The following file is missing: ' + file.getAbsolutePath() );
		}
	}

	/**
	 * Initializes all variables required during the build process.
	 */
	function init() {
		if ( config.skin ) {
			sourceSkinFile = new File( sourceLocation, 'skins/' + ( config.skin ) + '/skin.js' );
			targetSkinFile = new File( targetLocation, 'skins/' + ( config.skin ) + '/skin.js' );
		}
		languageFile = new File( targetLocation, 'lang/' + ( config.language || CKBuilder.DEFAULT_LANGUAGE ) + '.js' );
		var loaderFile = new File( sourceLocation, 'core/loader.js' );

		/*
		 * Execute script loader.js in core directory and read
		 * CKEDITOR.loader.scripts property
		 */
		loaderScripts = ( function() {
			var code = 'var CKEDITOR = { basePath : \'/ckeditor/\' }; ' + CKBuilder.io.readFile( loaderFile ),
				cx = Context.enter(),
				scope = cx.initStandardObjects();

			try {
				cx.evaluateString( scope, code, loaderFile.getName(), 1, null );
				return scope.CKEDITOR.loader.scripts;
			} catch ( e ) {
				throw( 'Invalid JavaScript file: ' + loaderFile.getAbsolutePath() + '.\nError: ' + e.message );
			}
		}() );

		if ( !loaderScripts )
			throw( 'Unable to get required scripts from loader: ' + loaderFile.getAbsolutePath() );

		if ( CKBuilder.options.debug )
			print( 'Reading core files from loader' );

		getCoreScripts( 'ckeditor' );
		getCoreScripts( '_bootstrap' );

		if ( CKBuilder.options.debug )
			print( 'Checking plugins dependency' );

		findAllRequiredPlugins( getPluginsFromBuildConfig() );
	}

	/**
	 * Generates arrays with the list of core files to include.
	 *
	 * @param {String} scriptName
	 */
	function getCoreScripts( scriptName ) {
		// Check if the script has already been loaded.
		if ( scriptName === 'ckeditor_base' || scriptName in coreScripts )
			return;

		// Get the script dependencies list.
		var dependencies = loaderScripts[ scriptName ];
		if ( !dependencies )
			throw( 'The script name"' + scriptName + '" is not defined.' );

		// Mark as loaded
		coreScripts[ scriptName ] = true;

		// Load all dependencies first.
		for ( var i = 0; i < dependencies.length; i++ )
			getCoreScripts( dependencies[ i ] );

		if ( CKBuilder.options.debug > 1 )
			print( 'Found core script to load: core/' + scriptName + '.js' );

		var file = new File( sourceLocation, 'core/' + scriptName + '.js' );
		coreScriptsSorted.push( file );
	}

	/**
	 * Returns an array with plugins enabled in the builder configuration file.
	 *
	 * @returns {Array}
	 */
	function getPluginsFromBuildConfig() {
		var plugins = [];

		for ( var plugin in config.plugins ) {
			if ( config.plugins[ plugin ] )
				plugins.push( plugin );
		}

		return plugins;
	}

	/**
	 * Generates arrays with the list of all plugins to include.
	 *
	 * @param {Array} plugins
	 */
	function findAllRequiredPlugins( plugins ) {
		var pluginFile;

		for ( var i = 0; i < plugins.length; i++ ) {
			if ( plugins[ i ] in pluginNames )
				continue;

			pluginFile = new File( sourceLocation, 'plugins/' + plugins[ i ] + '/plugin.js' );
			if ( !pluginFile.exists() )
				throw( 'Plugin does not exist: ' + plugins[ i ] + '. Unable to open: ' + pluginFile.getPath() );
			else {
				var required = CKBuilder.plugin.getRequiredPlugins( pluginFile );
				if ( required.length ) {
					pluginNames[ plugins[ i ] ] = false;
					findAllRequiredPlugins( required );
				}

				// Previous call to findAllRequiredPlugins() could have added our plugin to the array.
				if ( !( plugins[ i ] in pluginNames ) || !pluginNames[ plugins[ i ] ] ) {
					pluginNames[ plugins[ i ] ] = true;
					sourcePluginFilesSorted.push( File( sourceLocation, 'plugins/' + plugins[ i ] + '/plugin.js' ) );
					targetPluginFilesSorted.push( File( targetLocation, 'plugins/' + plugins[ i ] + '/plugin.js' ) );
					pluginNamesSorted.push( plugins[ i ] );
				}
			}
		}
	}

	/**
	 * Delete unused files in the destination folder.
	 */
	function deleteUnusedFiles() {
		CKBuilder.io.deleteDirectory( new File( targetLocation, 'core' ) );

		for ( var i = 0; i < targetPluginFilesSorted.length; i++ ) {
			var empty = true,
				parentDir = targetPluginFilesSorted[ i ].getParentFile(),
				dirList = parentDir.list();

			for ( var j = 0; j < dirList.length; j++ ) {
				if ( String( dirList[ j ] ) === 'icons' )
					CKBuilder.io.deleteDirectory( new File( parentDir, dirList[ j ] ) ); else if ( String( dirList[ j ] ) === 'lang' )
					CKBuilder.io.deleteDirectory( new File( parentDir, dirList[ j ] ) ); else if ( String( dirList[ j ] ) === 'plugin.js' )
					CKBuilder.io.deleteFile( new File( parentDir, dirList[ j ] ) ); else
					empty = false;
			}

			if ( empty )
				CKBuilder.io.deleteDirectory( parentDir );
		}
	}

	/**
	 * Remove unused plugins (not included in the build configuration file) from the plugins folder.
	 * Executed only when skip-omitted-in-build-config is enabled.
	 */
	function filterPluginFolders() {
		var pluginsFolder = new File( targetLocation, 'plugins' );

		if ( !pluginsFolder.exists() )
			return;

		var requiredPlugins = CKBuilder.options.requirePlugins ? CKBuilder.options.requirePlugins.split( ',' ) : [],
			dirList = pluginsFolder.list();

		for ( var i = 0; i < dirList.length; i++ ) {
			if ( !pluginNames[ dirList[ i ] ] && !includes( requiredPlugins, dirList[ i ] ) ) {
				if ( CKBuilder.options.debug > 1 )
					print( 'Removing unused plugin: ' + dirList[ i ] );
				CKBuilder.io.deleteDirectory( File( pluginsFolder, dirList[ i ] ) );
			}
		}
	}

	/**
	 * Check if an array contains given element.
	 * Alias for Array.prototype.includes method.
	 *
	 * @param {Array} array
	 * @param {String} element
	 *
	 * @returns {Boolean}
	 */
	function includes( array, element ) {
		for ( var i = 0; i < array.length; i++ ) {
			if ( array[ i ] == element ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Remove unused skins (not included in the build configuation file) from the skins folder.
	 * Executed only when skip-omitted-in-build-config is enabled.
	 * @param {String} selectedSkin
	 */
	function filterSkinsFolders( selectedSkin ) {
		var skinsFolder = new File( targetLocation, 'skins' );
		if ( !skinsFolder.exists() )
			return;

		var dirList = skinsFolder.list();
		for ( var i = 0; i < dirList.length; i++ ) {
			if ( String( dirList[ i ] ) !== selectedSkin ) {
				if ( CKBuilder.options.debug > 1 )
					print( 'Removing unused skin: ' + dirList[ i ] );
				CKBuilder.io.deleteDirectory( File( skinsFolder, dirList[ i ] ) );
			}
		}
	}

	/**
	 * Build skins in the skins folder.
	 * @private
	 */
	function buildSkins() {
		var skinsLocation = new File( targetLocation, 'skins' ),
			pluginsLocation = new File( sourceLocation, 'plugins' );

		if ( !skinsLocation.exists() )
			return;

		var dirList = skinsLocation.list();
		for ( var i = 0; i < dirList.length; i++ ) {
			var skinLocation = new File( skinsLocation, dirList[ i ] );
			if ( skinLocation.isDirectory() ) {
				if ( CKBuilder.options.debug > 1 )
					print( 'Building skin: ' + dirList[ i ] );

				var outputFile = new File( skinLocation, 'icons.png' ),
					outputCssFile = new File( skinLocation, 'editor.css' );
				CKBuilder.image.createFullSprite( pluginsLocation, skinLocation, outputFile, outputCssFile, pluginNamesSorted );

				outputFile = new File( skinLocation, 'icons_hidpi.png' );
				CKBuilder.image.createFullSprite( pluginsLocation, skinLocation, outputFile, outputCssFile, pluginNamesSorted, true );

				CKBuilder.css.mergeCssFiles( skinLocation );
				var iconsDir = new File( skinLocation, 'icons' );
				if ( iconsDir.exists )
					CKBuilder.io.deleteDirectory( File( skinLocation, 'icons' ) );
			}
		}
	}

	/**
	 * Copies files form source to the target location.
	 * The following actions are additionally executed:
	 *  - line endings are fixed
	 *  - directives are processed
	 *  - JS files are minified
	 *
	 * @private
	 */
	function copyFiles( context ) {
		var flags = {},
			coreLocation = new File( sourceLocation, 'core' );

		CKBuilder.io.copy( sourceLocation, targetLocation, function( sourceLocation, targetLocation ) {
				if ( CKBuilder.config.isIgnoredPath( sourceLocation, config.ignore ) )
					return -1;

				if ( extraCoreJavaScriptFiles && extraCoreJavaScriptFiles[ sourceLocation.getAbsolutePath() ] )
					return -1;

				if ( sourceLocation.isFile() ) {
					if ( context === 'build' && 'languages' in config ) {
						try {
							// Find the "lang" folder inside plugins' folders and ignore language files that are not selected
							if ( String( sourceLocation.getParentFile().getName() ) === 'lang' && String( sourceLocation.getParentFile().getParentFile().getParentFile().getName() ) === 'plugins' && File( sourceLocation.getParentFile().getParentFile(), 'plugin.js' ).exists() ) {
								var fileName = String( sourceLocation.getName() ),
									langFile = fileName.match( /^([a-z]{2}(?:-[a-z]+)?)\.js$/ );

								if ( langFile ) {
									var langCode = langFile[ 1 ];
									if ( !config.languages[ langCode ] )
										return -1;
								}
							}
						} catch ( e ) {
						}
					}
					var copied = CKBuilder.tools.fixLineEndings( sourceLocation, targetLocation );
					if ( copied ) {
						CKBuilder.tools.updateCopyrights( targetLocation );

						var flag = CKBuilder.tools.processDirectives( targetLocation );
						if ( flag.LEAVE_UNMINIFIED )
							flags[ targetLocation.getAbsolutePath() ] = flag;

						return 1;
					}
				} else {
					if ( coreLocation.getAbsolutePath().equals( sourceLocation.getAbsolutePath() ) )
						return -1;

					// No plugins specified, special case to be able to build core only
					if ( !pluginNamesSorted.length && String( sourceLocation.getName() ) === "plugins" )
						return -1;

					// No skins specified, special case to be able to build core only
					if ( typeof config.skin !== 'undefined' && !config.skin && String( sourceLocation.getName() ) === "skins" )
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

					if ( context === 'build' && 'languages' in config && String( targetLocation.getName() ) === 'plugin.js' ) {
						try {
							if ( String( targetLocation.getParentFile().getParentFile().getName() ) === 'plugins' && File( targetLocation.getParentFile(), "lang" ).exists() ) {
								var result = CKBuilder.plugin.updateLangProperty( targetLocation, config.languages );
								// Something went wrong...
								if ( result === false )
									print( "WARNING: it was impossible to update the lang property in " + targetLocation.getAbsolutePath() );
							}
						} catch ( e ) {
						}
					}

					if ( CKBuilder.options.debug )
						print( "Minifying: " + targetLocation.getPath() );

					CKBuilder.javascript.minify( targetLocation );
				}
			} );
	}

	/**
	 * Creates sprite image from icons provided by plugins.
	 *
	 * @returns {String} Returns JavaScript code that registers created icons.
	 * @private
	 */
	function createPluginsSpriteImage() {
		var iconsCode = "";
		if ( !pluginNamesSorted.length )
			return "";

		print( "Generating plugins sprite image" );
		var sourcePluginsLocation = new File( sourceLocation, "plugins" ),
			targetPluginsLocation = new File( targetLocation, "plugins" );
		if ( !targetPluginsLocation.exists() )
			targetPluginsLocation.mkdirs();

		var outputFile = new File( targetPluginsLocation, "icons.png" ),
			outputFileHidpi = new File( targetPluginsLocation, "icons_hidpi.png" ),
			iconsOffset = CKBuilder.image.createFullSprite( sourcePluginsLocation, null, outputFile, null, pluginNamesSorted ),
			iconsOffsetHidpi = CKBuilder.image.createFullSprite( sourcePluginsLocation, null, outputFileHidpi, null, pluginNamesSorted, true );

		if ( iconsOffset )
			iconsCode = "(function() {" + "var setIcons = function(icons, strip) {" + "var path = CKEDITOR.getUrl( 'plugins/' + strip );" + "icons = icons.split( ',' );" + "for ( var i = 0; i < icons.length; i++ )" + "CKEDITOR.skin.icons[ icons[ i ] ] = { path: path, offset: -icons[ ++i ], bgsize : icons[ ++i ] };" + "};" + "if (CKEDITOR.env.hidpi) " + "setIcons('" + iconsOffsetHidpi + "','icons_hidpi.png');" + "else " + "setIcons('" + iconsOffset + "','icons.png');" + "})();";

		return iconsCode;
	}

	/**
	 * Creates ckeditor.js.
	 *
	 * @param {Object} config
	 * @param {String} extraCode JavaScript code to include in ckeditor.js
	 * @param {Boolean} apply7588 Whether to include patch for #7588
	 * @param {String} context (build|preprocess) In build,
	 * @private
	 */
	function createCore( config, extraCode, apply7588, context ) {
		var ckeditorjs = "",
			patch7588 = 'if(window.CKEDITOR&&window.CKEDITOR.dom)return;';

		if ( extraCoreJavaScriptCode && extraCoreJavaScriptCode.start )
			ckeditorjs += extraCoreJavaScriptCode.start.join( "\n" );

		ckeditorjs += CKBuilder.io.readFile( File( sourceLocation, "core/ckeditor_base.js" ) ) + "\n";
		ckeditorjs += CKBuilder.io.readFiles( coreScriptsSorted, "\n" );

		if ( extraCoreJavaScriptCode && extraCoreJavaScriptCode.aftercore )
			ckeditorjs += extraCoreJavaScriptCode.aftercore.join( "\n" );

		if ( sourceSkinFile )
			ckeditorjs += CKBuilder.io.readFile( sourceSkinFile ) + "\n";

		if ( pluginNamesSorted.length > 0 ) {
			var configEntry = "CKEDITOR.config.plugins='" + pluginNamesSorted.join( "," ) + "';";
			ckeditorjs += CKBuilder.io.readFiles( sourcePluginFilesSorted, "\n" ) + "\n" + configEntry;
		}
		// When the core is created for the preprocessed version of CKEditor, then it makes no sense to
		// specify an empty "config.plugins", because config.plugins will be later set by the online builder.
		else if ( 'build' === context )
			ckeditorjs += "CKEDITOR.config.plugins='';";

		if ( config.language )
			ckeditorjs += CKBuilder.io.readFile( languageFile ) + "\n" ;

		ckeditorjs = CKBuilder.tools.processDirectivesInString( ckeditorjs );
		ckeditorjs = CKBuilder.tools.processCoreDirectivesInString( ckeditorjs );
		ckeditorjs = CKBuilder.tools.removeLicenseInstruction( ckeditorjs );

		if ( extraCode )
			ckeditorjs += extraCode + "\n";

		if ( 'build' === context && config.languages ) {
			var langs = [];
			for ( var lang in config.languages ) {
				if ( config.languages[ lang ] )
					langs.push( '"' + lang + '":1' );
			}

			if ( langs.length )
				ckeditorjs += "CKEDITOR.lang.languages={" + langs.join( ',' ) + "};";
		}

		// https://dev.ckeditor.com/ticket/7588
		if ( apply7588 )
			ckeditorjs = CKBuilder.utils.wrapInFunction( patch7588 + ckeditorjs );

		if ( extraCoreJavaScriptCode && extraCoreJavaScriptCode.end )
			ckeditorjs += extraCoreJavaScriptCode.end.join( "" );

		var targetFile = File( targetLocation, "ckeditor.js" );
		CKBuilder.io.saveFile( targetFile, ckeditorjs, true );

		if ( !CKBuilder.options.leaveJsUnminified ) {
			print( "Minifying ckeditor.js" );
			CKBuilder.javascript.minify( targetFile );
		}
		CKBuilder.io.saveFile( targetFile, CKBuilder.utils.copyright( CKBuilder.options.leaveJsUnminified ? "\r\n" : "\n" ) + CKBuilder.io.readFile( targetFile ), true );
		print( "Created ckeditor.js (" + parseInt( targetFile.length() / 1024, 10 ) + "KB)" );
	}

	/**
	 * Reads configuration file and returns configuration object.
	 *
	 * @returns {Object}
	 * @private
	 */
	function readConfig() {
		var configPath = CKBuilder.options.buildConfig || 'build-config.js',
			configFile = new File( configPath );

		if ( !configFile.exists() )
			CKBuilder.error( 'The build configuration file was not found: ' + configPath + "\nRun:\n    java -jar ckbuilder.jar SRC --generate-build-config" );
		config = CKBuilder.config.read( configFile );

		if ( config.js ) {
			extraCoreJavaScriptFiles = {};
			extraCoreJavaScriptCode = { start: [], aftercore: [], end: [] };

			var instruction,
				regexInstruction = Pattern.compile( '^(.*),(aftercore|end|start)$', Pattern.DOTALL );

			for ( var i = 0; i < config.js.length; i++ ) {
				var matcher = regexInstruction.matcher( config.js[ i ] ),
					file,
					filePath;

				if ( matcher.find() ) {
					filePath = matcher.group( 1 );
					instruction = matcher.group( 2 );
				} else {
					filePath = config.js[ i ];
					instruction = 'end';
				}
				file = new File( filePath );
				if ( !file.exists() )
					CKBuilder.error( "File not found: " + file.getAbsolutePath() + "\nCheck the build configuration file." );

				extraCoreJavaScriptFiles[ file.getAbsolutePath() ] = true;

				if ( CKBuilder.options.debug )
					print( 'Adding extra file [' + instruction + ']: ' + filePath );

				extraCoreJavaScriptCode[ instruction ].push( CKBuilder.io.readFile( file ) );
			}
		}

		return config;
	}

	return {
		/**
		 * Preprocess CKEditor core.
		 *
		 * @static
		 */
		preprocess: function() {
			var time = new Date(),
				config = readConfig();

			config.plugins = {};
			config.skin = '';
			config.language = false;

			validateSourceFolder();
			CKBuilder.tools.prepareTargetFolder( File( dstDir ) );
			init();
			print( "Copying files (relax, this may take a while)" );
			copyFiles( 'preprocess' );
			time = CKBuilder.utils.printUsedTime( time );

			print( "Merging language files" );
			var langFolder = new File( targetLocation, 'lang' );
			CKBuilder.lang.mergeAll( sourceLocation, langFolder, {}, config.languages );
			time = CKBuilder.utils.printUsedTime( time );

			print( "Processing lang folder" );
			var children = langFolder.list();
			for ( var i = 0; i < children.length; i++ ) {
				if ( children[ i ].match( /^([a-z]{2}(?:-[a-z]+)?)\.js$/ ) ) {
					var langFile = new File( langFolder, children[ i ] ),
						translation = CKBuilder.lang.loadLanguageFile( langFile ).translation,
						pseudoObject = JSON.stringify( translation ).replace( /^\{(.*)\}$/, '$1' );

					CKBuilder.io.saveFile( langFile, pseudoObject, true );
				}
			}

			print( "Building ckeditor.js" );
			createCore( config, "", false, 'preprocess' );

			print( "Cleaning up target folder" );
			deleteUnusedFiles();
			CKBuilder.utils.printUsedTime( time );
		},

		/**
		 * Creates ckeditor.js and icons.png in the target folder.
		 *
		 * @static
		 */
		generateCore: function() {
			var time = new Date(),
				config = readConfig();

			validateSourceFolder();
			init();

			config.language = false;
			var iconsCode = createPluginsSpriteImage();
			print( "Building ckeditor.js" );
			var extraCode = '';
			if ( config.skin )
				extraCode = "CKEDITOR.config.skin='" + config.skin + "';";
			createCore( config, extraCode + iconsCode, true, 'build' );
			CKBuilder.utils.printUsedTime( time );
		},

		/**
		 * Creates CKEditor build in the specified folder.
		 *
		 * @static
		 */
		generateBuild: function() {
			var time = new Date(),
				startTime = time,
				config = readConfig();

			validateSourceFolder();
			CKBuilder.tools.prepareTargetFolder( File( dstDir ) );
			init();
			print( "Copying files (relax, this may take a while)" );
			copyFiles( 'build' );
			if ( !CKBuilder.options.all ) {
				filterPluginFolders();
				if ( config.skin )
					filterSkinsFolders( config.skin );
			}
			time = CKBuilder.utils.printUsedTime( time );

			print( "Merging language files" );
			CKBuilder.lang.mergeAll( sourceLocation, File( targetLocation, 'lang' ), pluginNames, config.languages );
			time = CKBuilder.utils.printUsedTime( time );

			var iconsCode = createPluginsSpriteImage();
			print( "Building ckeditor.js" );
			var extraCode = '';
			if ( config.skin )
				extraCode = "CKEDITOR.config.skin='" + config.skin + "';";
			createCore( config, extraCode + iconsCode, true, 'build' );
			time = CKBuilder.utils.printUsedTime( time );

			print( "Building skins" );
			buildSkins();
			if ( targetSkinFile )
				CKBuilder.io.deleteFile( targetSkinFile );
			time = CKBuilder.utils.printUsedTime( time );

			CKBuilder.samples.mergeSamples( targetLocation );

			print( "Cleaning up target folder" );
			deleteUnusedFiles();
			time = CKBuilder.utils.printUsedTime( time );

			// get information about release directory
			var info = CKBuilder.io.getDirectoryInfo( targetLocation );

			if ( !CKBuilder.options.noZip || !CKBuilder.options.noTar )
				print( "\nCreating compressed files...\n" );

			var normalize = function( version ) {
				return String( version ).toLowerCase().replace( / /g, "_" ).replace( /\(\)/g, "" );
			};

			if ( !CKBuilder.options.noZip ) {
				var zipFile = new File( targetLocation.getParentFile(), "ckeditor_" + normalize( CKBuilder.options.version ) + ".zip" );
				CKBuilder.io.zipDirectory( targetLocation, targetLocation, zipFile, "ckeditor" );
				print( "    Created " + zipFile.getName() + "...: " + zipFile.length() + " bytes (" + Math.round( zipFile.length() / info.size * 100 ) + "% of original)" );
			}
			if ( !CKBuilder.options.noTar ) {
				var tarFile = new File( targetLocation.getParentFile(), "ckeditor_" + normalize( CKBuilder.options.version ) + ".tar.gz" );
				CKBuilder.io.targzDirectory( targetLocation, targetLocation, tarFile, "ckeditor" );
				print( "    Created " + tarFile.getName() + ": " + tarFile.length() + " bytes (" + Math.round( tarFile.length() / info.size * 100 ) + "% of original)" );
			}
			CKBuilder.utils.printUsedTime( time );

			print( "\n==========================" );
			print( "Release process completed:\n" );
			print( "    Number of files: " + info.files );
			print( "    Total size.....: " + info.size + " bytes" );
			CKBuilder.utils.printUsedTime( startTime );
			print( "" );
		}
	};
};
