/*
 Copyright (c) 2012-2014, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md
 */

( function() {
	var regexLib = {
		PluginsSamples: Pattern.compile( '<!--\\s*PLUGINS_SAMPLES\\s*?-->', Pattern.DOTALL ),
		AdvancedSamples: Pattern.compile( '<!--\\s*ADVANCED_SAMPLES\\s*-->', Pattern.DOTALL ),
		InlineEditingSamples: Pattern.compile( '<!--\\s*INLINE_EDITING_SAMPLES\\s*-->', Pattern.DOTALL ),
		metaTag: Pattern.compile( '<meta(.*?)>', Pattern.DOTALL ),
		metaName: Pattern.compile( 'name="(.*?)"', Pattern.DOTALL ),
		metaContent: Pattern.compile( 'content="(.*?)"', Pattern.DOTALL )
	};
	/**
	 * Holds URLs, names and descriptions of samples found in meta tags.
	 *
	 * @property {Object} samplesMetaInformation
	 * @member CKBuilder.samples
	 */
	var samplesMetaInformation = {
		'beta': {},
		'new': {},
		'normal': {}
	};

	/**
	 * Returns an information gathered from the <meta> tag in HTML.
	 *
	 * @param {String} text
	 * @returns {Object}
	 * @private
	 * @member CKBuilder.samples
	 */
	function getMetaInformation( text ) {
		var matcher = regexLib.metaTag.matcher( text ),
			metaInformation = {};

		while ( matcher.find() ) {
			var metaText = matcher.group( 1 ),
				metaNameMatcher = regexLib.metaName.matcher( metaText ),
				metaContentMatcher = regexLib.metaContent.matcher( metaText );

			if ( metaContentMatcher.find() && metaNameMatcher.find() )
				metaInformation[ String( metaNameMatcher.group( 1 ) ).replace( /^ckeditor-sample-/, '' ) ] = String( metaContentMatcher.group( 1 ) );

		}

		if ( !metaInformation.group || ( metaInformation.group !== 'Inline Editing' && metaInformation.group !== 'Advanced Samples' ) )
			metaInformation.group = 'Plugins';

		return metaInformation;
	}

	/**
	 * Checks every plugin folder for the "samples" directory, moves the samples into the root "samples directory.
	 *
	 * @param {java.io.File} sourceLocation
	 * @private
	 * @member CKBuilder.samples
	 */
	function mergePluginSamples( sourceLocation ) {
		var pluginsLocation = new File( sourceLocation, "plugins" );
		if ( !pluginsLocation.exists() )
			return;

		var children = pluginsLocation.list();
		children.sort();
		for ( var i = 0; i < children.length; i++ ) {
			if ( String( children[ i ] ) === ".svn" || String( children[ i ] ) === "CVS" || String( children[ i ] ) === ".git" )
				continue;

			// Find the "samples" folder
			var pluginSamplesLocation = new File( pluginsLocation, children[ i ] + '/samples' );
			if ( pluginSamplesLocation.exists() && pluginSamplesLocation.isDirectory() ) {
				mergeSamples( pluginSamplesLocation, new File( sourceLocation, 'samples/plugins/' + children[ i ] ), 'plugins/' + children[ i ] );
				CKBuilder.io.deleteDirectory( pluginSamplesLocation.getAbsolutePath() );
			}
		}
	}

	/**
	 * Moves samples from source to the target location, gathers information stored in meta tags.
	 *
	 * @param {java.io.File} sourceLocation
	 * @param {java.io.File} targetLocation
	 * @param {String} path URL to a sample, relative to the root "samples" folder
	 * @private
	 * @member CKBuilder.samples
	 */
	function mergeSamples( sourceLocation, targetLocation, path ) {
		if ( sourceLocation.isDirectory() ) {
			if ( !targetLocation.exists() )
				targetLocation.mkdirs();

			var children = sourceLocation.list();
			for ( var i = 0; i < children.length; i++ ) {
				if ( String( children[ i ] ) === ".svn" || String( children[ i ] ) === "CVS" || String( children[ i ] ) === ".git" )
					continue;

				mergeSamples( new File( sourceLocation, children[ i ] ), new File( targetLocation, children[ i ] ), path + '/' + children[ i ] );
			}

			if ( !targetLocation.list().length )
				targetLocation[ 'delete' ]();
		} else {
			CKBuilder.io.copyFile( sourceLocation, targetLocation );
			if ( CKBuilder.io.getExtension( sourceLocation.getName() ) !== 'html' )
				return;

			var text = CKBuilder.io.readFile( sourceLocation );

			// check if required meta information is available
			if ( text.indexOf( "ckeditor-sample-name" ) === -1 )
				return;

			var meta = getMetaInformation( text );
			if ( meta.isbeta )
				samplesMetaInformation['beta'][ path ] = meta; // jshint ignore:line
			else if ( meta.isnew )
				samplesMetaInformation['new'][ path ] = meta;
			else
				samplesMetaInformation['normal'][ path ] = meta; // jshint ignore:line
		}
	}

	/**
	 * Returns a single definition list that represents one sample.
	 *
	 * @param {String} url URL to a sample
	 * @param {Object} info An object with information like name and description
	 * @returns {String}
	 * @private
	 * @member CKBuilder.samples
	 */
	function linkToSample( url, info ) {
		if ( !info.name )
			return '';

		// Support <code>, <em> and <strong> tags
		var description = info.description.replace( /&lt;(\/?(?:code|strong|em))&gt;/g, '<$1>' );

		// <dt><a class="samples" href="api.html">Basic usage of the API</a></dt>
		// <dd>Using the CKEditor JavaScript API to interact with the editor at runtime.</dd>
		var out = [];
		out.push( "\n", '<dt><a class="samples" href="../', url, '">', info.name, '</a>' );
		if ( info.isnew )
			out.push( ' <span class="new">New!</span>' );
		if ( info.isbeta )
			out.push( ' <span class="beta">Beta</span>' );
		out.push( '</dt>', "\n" );
		out.push( '<dd>', description, '</dd>', "\n" );

		return out.join( '' );
	}

	/**
	 * Returns HTML structure for the "Plugins" section.
	 *
	 * @param {String} html HTML code with definition lists containing links to samples
	 * @returns {String}
	 * @member CKBuilder.samples
	 */
	function pluginsSection( html ) {
		if ( !html )
			return '';

		return '<h2 class="samples">Plugins</h2>' + "\n" + '<dl class="samples">' + html + '</dl>';
	}

	/**
	 * Prepare samples.
	 *
	 * @class
	 */
	CKBuilder.samples = {
		/**
		 * Merges samples from plugins folders into the root "samples" folder.
		 *
		 * @param {java.io.File} sourceLocation Path to CKEditor, where the "samples" and "plugins" folders are available.
		 * @static
		 */
		mergeSamples: function( sourceLocation ) {
			var samplesLocation = new File( sourceLocation, 'samples/old' );
			if ( !samplesLocation.exists() ) {
				if ( CKBuilder.options.debug )
					print( "INFO: samples dir not found in " + sourceLocation.getAbsolutePath() );
				return;
			}
			var indexFile = new File( samplesLocation, 'index.html' );
			if ( !indexFile.exists() ) {
				if ( CKBuilder.options.debug )
					print( "index.html not found in the samples directory: " + samplesLocation.getAbsolutePath() );
				return;
			}

			var indexHtml = CKBuilder.io.readFile( indexFile );
			indexHtml = CKBuilder.tools.processDirectivesInString( indexHtml );

			// Nothing to do
			if ( indexHtml.indexOf( "PLUGINS_SAMPLES" ) === -1 && indexHtml.indexOf( "ADVANCED_SAMPLES" ) === -1 && indexHtml.indexOf( "INLINE_EDITING_SAMPLES" ) === -1 ) {
				if ( CKBuilder.options.debug )
					print( 'samples/index.html does not contain any placeholders to replace' );
				CKBuilder.io.saveFile( indexFile, indexHtml, true );
				return;
			}

			mergePluginSamples( sourceLocation );

			var html = {
				'Inline Editing': '',
				'Advanced Samples': '',
				'Plugins': ''
			};

			for ( var type in samplesMetaInformation ) {
				for ( var url in samplesMetaInformation[ type ] ) {
					html[ samplesMetaInformation[ type ][ url ].group ] += linkToSample( url, samplesMetaInformation[ type ][ url ] );
				}
			}

			/* jshint sub: true */
			indexHtml = regexLib.PluginsSamples.matcher( indexHtml ).replaceFirst( pluginsSection( html[ 'Plugins' ] ) );
			indexHtml = regexLib.InlineEditingSamples.matcher( indexHtml ).replaceFirst( html[ 'Inline Editing' ] );
			indexHtml = regexLib.AdvancedSamples.matcher( indexHtml ).replaceFirst( html[ 'Advanced Samples' ] );
			/* jshint sub: false */

			CKBuilder.io.saveFile( indexFile, indexHtml, true );
		}
	};
}() );

