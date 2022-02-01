/*
 Copyright (c) 2012-2022, CKSource Holding sp. z o.o. All rights reserved.
 For licensing, see LICENSE.md
 */

importClass( java.io.BufferedWriter );
importClass( java.io.FileWriter );
importClass( java.io.FileOutputStream );
importClass( java.io.FileInputStream );

( function() {
	/**
	 * Looking through directory and search subdirectories.
	 * When second parameter provided also filter subdirectories which contains file provided in parameter.
	 *
	 * @param {java.io.File} rootDir
	 * @param {String=} requiredFile If parameter provided also check whether directory contains file
	 * @returns {Object} Hash map of 1
	 * @member CKBuilder.config
	 */
	function getSubfolders( rootDir, requiredFile ) {
		if ( !rootDir.exists() || !rootDir.isDirectory() )
			return {};

		var children = rootDir.list(), // get directory children
			result = {};

		children.sort();
		for ( var i = 0; i < children.length; i++ ) {
			var childDir = new File( rootDir, children[ i ] );

			if ( !requiredFile || File( childDir, requiredFile ).exists() )
				result[ children[ i ] ] = 1;
		}

		return result;
	}

	/**
	 * Responsible for creating CKBuilder config based on source directory
	 *
	 * @class
	 */
	CKBuilder.config = {
		/**
		 * Creates a configuration file (build-config.js) with all plugins and skins listed.
		 * Config file structure is based on `plugins` and `skins` catalogue content.
		 *
		 * @param {String} sourceDir Path to the folder with source files
		 * @static
		 */
		create: function( sourceDir ) {
			var sourceLocation = new File( sourceDir );

			if ( !sourceLocation.exists() )
				CKBuilder.error( "Source folder does not exist: " + sourceDir );
			if ( !sourceLocation.isDirectory() )
				CKBuilder.error( "Source folder is not a directory: " + sourceDir );

			var plugins = getSubfolders( File( sourceLocation, "plugins" ), "plugin.js" ),
				skins = getSubfolders( File( sourceLocation, "skins" ), "skin.js" ),
				config = {
					skins: skins,
					plugins: plugins
				};

			CKBuilder.io.saveFile( CKBuilder.options.buildConfig || 'build-config.js', "var CKBUILDER_CONFIG = {\n" + CKBuilder.utils.prettyPrintObject( config, "	" ) + "\n};" );
		},

		/**
		 * Reads a configuration file and returns the configuration object.
		 *
		 * @param {java.io.File} configFile Path to the configuration file
		 * @static
		 */
		read: function( configFile ) {
			var file = new File( configFile ),
				code = CKBuilder.io.readFile( file ),
				cx = Context.enter(),
				scope = cx.initStandardObjects();

			try {
				cx.evaluateString( scope, code, file.getName(), 1, null );
				return scope.CKBUILDER_CONFIG;
			} catch ( e ) {
				throw( "Configuration file is invalid: " + file.getAbsolutePath() + ".\nError: " + e.message );
			}
		},

		/**
		 * Returns true if the file/folder is set to be ignored.
		 *
		 * @param {java.io.File} sourceLocation
		 * @param {Array} ignoredPaths An array with ignored paths
		 * @returns {Boolean}
		 * @static
		 */
		isIgnoredPath: function( sourceLocation, ignoredPaths ) {
			if ( !ignoredPaths )
				return false;

			for ( var i = 0; i < ignoredPaths.length; i++ ) {
				var rule = ignoredPaths[ i ];

				if ( rule.indexOf( '/' ) === -1 ) {
					if ( String( sourceLocation.getName() ) === rule )
						return true;
				} else if ( sourceLocation.getAbsolutePath().replace( "\\", "/" ).endsWith( rule ) )
					return true;
			}

			return false;
		}
	};
}() );
