/*
 Copyright (c) 2012-2022, CKSource Holding sp. z o.o. All rights reserved.
 For licensing, see LICENSE.md
 */

importClass( java.io.BufferedWriter );
importClass( java.io.FileWriter );
importClass( java.io.FileOutputStream );
importClass( java.io.FileInputStream );

( function() {
	var translations = {};

	/**
	 * This method modifies translations property.
	 *
	 * @param {java.io.File} sourceLocation Source folder. Directory which represents plugin, so is located in `plugins` directory.
	 * @member CKBuilder.lang
	 */
	function loadPluginLanguageFiles( sourceLocation ) {
		var folder = new File( sourceLocation, 'lang' );

		if ( !folder.exists() )
			return;

		var englishFile = new File( folder, 'en.js' ),
			englishObj = CKBuilder.lang.loadLanguageFile( englishFile ).translation;

		for ( var langCode in translations ) {
			var langFile = new File( folder, langCode + '.js' ),
				langObj;

			if ( langFile.exists() )
				langObj = CKBuilder.utils.merge( englishObj, CKBuilder.lang.loadLanguageFile( langFile ).translation );
			else
				langObj = englishObj;

			translations[ langCode ] = CKBuilder.utils.merge( translations[ langCode ], langObj );
		}
	}

	/**
	 * @param {java.io.File} folder
	 * @member CKBuilder.lang
	 */
	function loadCoreLanguageFiles( folder ) {
		translations.en = CKBuilder.lang.loadLanguageFile( new File( folder, "en.js" ) ).translation;

		var children = folder.list();
		for ( var i = 0; i < children.length; i++ ) {
			var langFile = children[ i ].match( /^([a-z]{2}(?:-[a-z]+)?)\.js$/ );
			if ( langFile ) {
				var langCode = langFile[ 1 ];
				translations[ langCode ] = CKBuilder.utils.merge( translations.en, CKBuilder.lang.loadLanguageFile( new File( folder, children[ i ] ) ).translation );
			}
		}
	}

	/**
	 * @param langCode
	 * @returns {string}
	 * @member CKBuilder.lang
	 */
	function printTranslation( langCode ) {
		if ( CKBuilder.options.leaveJsUnminified )
			return CKBuilder.utils.copyright( "\r\n" ) + "CKEDITOR.lang['" + langCode + "'] = {\n" + CKBuilder.utils.prettyPrintObject( translations[ langCode ], '    ' ) + " }; ";
		else
			return CKBuilder.utils.copyright( "\n" ) + "CKEDITOR.lang['" + langCode + "']=" + JSON.stringify( translations[ langCode ] ) + ";";
	}

	/**
	 * Gather translations from CKEditor, merge them and sace into single file.
	 *
	 * @class
	 */
	CKBuilder.lang = {
		/**
		 * @param {String} sourceLocation Path to the folder with source files
		 * @param {String} targetLocation The target folder where to save the resulting files
		 * @param {Object} pluginNames Object with a set of plugins included in build
		 * @param {Object} languages (Optional) Object with languages included in build (if empty, all languages are used)
		 * @static
		 */
		mergeAll: function( sourceLocation, targetLocation, pluginNames, languages ) {
			var langLocation = new File( sourceLocation, "lang" );
			if ( !langLocation.exists() )
				throw( "Language folder is missing: " + langLocation.getAbsolutePath() );

			var pluginsLocation = new File( sourceLocation, "plugins" );
			if ( !pluginsLocation.exists() )
				throw( "Plugins folder is missing: " + pluginsLocation.getAbsolutePath() );

			loadCoreLanguageFiles( langLocation );

			// Load plugins language files
			var children = pluginsLocation.list();
			children.sort();
			for ( var i = 0; i < children.length; i++ ) {
				var folderName = String( children[ i ] );
				if ( folderName === ".svn" || folderName === "CVS" || folderName === ".git" )
					continue;
				// Do not load language files from plugins that are not enabled.
				if ( pluginNames[ folderName ] )
					loadPluginLanguageFiles( new File( pluginsLocation, children[ i ] ) );
			}

			for ( var langCode in translations ) {
				if ( !languages || languages[ langCode ] )
					CKBuilder.io.saveFile( File( targetLocation, langCode + ".js" ), printTranslation( langCode ), true );
				else
					CKBuilder.io.deleteFile( File( targetLocation, langCode + ".js" ) );
			}
		},

		/**
		 * Load language file and return an object with the whole translation.
		 *
		 * @param {java.io.File} file Language file to load.
		 * @returns {{languageCode: String, translation: Object }}
		 * @static
		 */
		loadLanguageFile: function( file ) {
			var translationCode = 'var CKEDITOR = { lang : {}, plugins : { setLang : function(plugin, langCode, obj) { if(!CKEDITOR.lang[langCode]) CKEDITOR.lang[langCode] = {};CKEDITOR.lang[langCode][plugin] = obj; } } }; ' + CKBuilder.io.readFile( file ),
				cx = Context.enter(),
				scope = cx.initStandardObjects();

			try {
				cx.evaluateString( scope, translationCode, file.getName(), 1, null );

				/*
				 * Return the first entry from scope.CKEDITOR.lang object
				 */
				for ( var languageCode in scope.CKEDITOR.lang ) {
					return {
						languageCode: languageCode,
						translation: scope.CKEDITOR.lang[ languageCode ]
					};
				}
			} catch ( e ) {
				throw( "Language file is invalid: " + file.getAbsolutePath() + ".\nError: " + e.message );
			}
		}
	};
}() );
