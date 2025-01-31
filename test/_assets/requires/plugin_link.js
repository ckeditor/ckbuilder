﻿﻿
/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.html or https://ckeditor.com/legal/ckeditor-oss-license/
 */

CKEDITOR.plugins.add( 'link', {
	requires: [ 'dialog', 'fakeobjects' ],
	lang: [ 'af', 'ar', 'bg', 'bn', 'bs', 'ca', 'cs', 'cy', 'da', 'de', 'el', 'en-au', 'en-ca', 'en-gb', 'en', 'eo', 'es', 'et', 'eu', 'fa', 'fi', 'fo', 'fr-ca', 'fr', 'gl', 'gu', 'he', 'hi', 'hr', 'hu', 'is', 'it', 'ja', 'ka', 'km', 'ko', 'lt', 'lv', 'mk', 'mn', 'ms', 'nb', 'nl', 'no', 'pl', 'pt-br', 'pt', 'ro', 'ru', 'sk', 'sl', 'sr-latn', 'sr', 'sv', 'th', 'tr', 'ug', 'uk', 'vi', 'zh-cn', 'zh' ],
	icons: 'anchor,anchor-rtl,link,unlink', // %REMOVE_LINE_CORE%
	onLoad: function() {
		// Add the CSS styles for anchor placeholders.
		var baseStyle = 'background:url(' + CKEDITOR.getUrl( this.path + 'images/anchor.gif' ) + ') no-repeat %1 center;' +
			'border:1px dotted #00f;';

		var template = '.%2 a.cke_anchor,' +
			'.%2 a.cke_anchor_empty' +
			// IE6 breaks with the following selectors.
			( ( CKEDITOR.env.ie && CKEDITOR.env.version < 7 ) ? '' : ',.cke_editable.%2 a[name]' +
			',.cke_editable.%2 a[data-cke-saved-name]' ) +
			'{' +
				baseStyle +
				'padding-%1:18px;' +
				// Show the arrow cursor for the anchor image (FF at least).
				'cursor:auto;' +
			'}' +
			( CKEDITOR.env.ie ? ( 'a.cke_anchor_empty' +
			'{' +
				// Make empty anchor selectable on IE.
				'display:inline-block;' +
			'}'
			) : '' ) +
			'.%2 img.cke_anchor' +
			'{' +
				baseStyle +
				'width:16px;' +
				'min-height:15px;' +
				// The default line-height on IE.
				'height:1.15em;' +
				// Opera works better with "middle" (even if not perfect)
				'vertical-align:' + ( CKEDITOR.env.opera ? 'middle' : 'text-bottom' ) + ';' +
			'}';

		// Styles with contents direction awareness.
		function cssWithDir( dir ) {
			return template.replace( /%1/g, dir == 'rtl' ? 'right' : 'left' ).replace( /%2/g, 'cke_contents_' + dir );
		}

		CKEDITOR.addCss( cssWithDir( 'ltr' ) + cssWithDir( 'rtl' ) );
	},

	init: function( editor ) {
		// Add the link and unlink buttons.
		editor.addCommand( 'link', new CKEDITOR.dialogCommand( 'link' ) );
		editor.addCommand( 'anchor', new CKEDITOR.dialogCommand( 'anchor' ) );
		editor.addCommand( 'unlink', new CKEDITOR.unlinkCommand() );
		editor.addCommand( 'removeAnchor', new CKEDITOR.removeAnchorCommand() );

		editor.setKeystroke( CKEDITOR.CTRL + 76 /*L*/, 'link' );

		if ( editor.ui.addButton ) {
			editor.ui.addButton( 'Link', {
				label: editor.lang.link.toolbar,
				command: 'link',
				toolbar: 'links,10'
			});
			editor.ui.addButton( 'Unlink', {
				label: editor.lang.link.unlink,
				command: 'unlink',
				toolbar: 'links,20'
			});
			editor.ui.addButton( 'Anchor', {
				label: editor.lang.link.anchor.toolbar,
				command: 'anchor',
				toolbar: 'links,30'
			});
		}

		CKEDITOR.dialog.add( 'link', this.path + 'dialogs/link.js' );
		CKEDITOR.dialog.add( 'anchor', this.path + 'dialogs/anchor.js' );

		editor.on( 'doubleclick', function( evt ) {
			var element = CKEDITOR.plugins.link.getSelectedLink( editor ) || evt.data.element;

			if ( !element.isReadOnly() ) {
				if ( element.is( 'a' ) ) {
					evt.data.dialog = ( element.getAttribute( 'name' ) && ( !element.getAttribute( 'href' ) || !element.getChildCount() ) ) ? 'anchor' : 'link';
					editor.getSelection().selectElement( element );
				} else if ( CKEDITOR.plugins.link.tryRestoreFakeAnchor( editor, element ) )
					evt.data.dialog = 'anchor';
			}
		});

		// If the "menu" plugin is loaded, register the menu items.
		if ( editor.addMenuItems ) {
			editor.addMenuItems({
				anchor: {
					label: editor.lang.link.anchor.menu,
					command: 'anchor',
					group: 'anchor',
					order: 1
				},

				removeAnchor: {
					label: editor.lang.link.anchor.remove,
					command: 'removeAnchor',
					group: 'anchor',
					order: 5
				},

				link: {
					label: editor.lang.link.menu,
					command: 'link',
					group: 'link',
					order: 1
				},

				unlink: {
					label: editor.lang.link.unlink,
					command: 'unlink',
					group: 'link',
					order: 5
				}
			});
		}

		// If the "contextmenu" plugin is loaded, register the listeners.
		if ( editor.contextMenu ) {
			editor.contextMenu.addListener( function( element, selection ) {
				if ( !element || element.isReadOnly() )
					return null;

				var anchor = CKEDITOR.plugins.link.tryRestoreFakeAnchor( editor, element );

				if ( !anchor && !( anchor = CKEDITOR.plugins.link.getSelectedLink( editor ) ) )
					return null;

				var menu = {};

				if ( anchor.getAttribute( 'href' ) && anchor.getChildCount() )
					menu = { link: CKEDITOR.TRISTATE_OFF, unlink: CKEDITOR.TRISTATE_OFF };

				if ( anchor && anchor.hasAttribute( 'name' ) )
					menu.anchor = menu.removeAnchor = CKEDITOR.TRISTATE_OFF;

				return menu;
			});
		}
	},

	afterInit: function( editor ) {
		// Register a filter to displaying placeholders after mode change.

		var dataProcessor = editor.dataProcessor,
			dataFilter = dataProcessor && dataProcessor.dataFilter,
			htmlFilter = dataProcessor && dataProcessor.htmlFilter,
			pathFilters = editor._.elementsPath && editor._.elementsPath.filters;

		if ( dataFilter ) {
			dataFilter.addRules({
				elements: {
					a: function( element ) {
						var attributes = element.attributes;
						if ( !attributes.name )
							return null;

						var isEmpty = !element.children.length;

						if ( CKEDITOR.plugins.link.synAnchorSelector ) {
							// IE needs a specific class name to be applied
							// to the anchors, for appropriate styling.
							var ieClass = isEmpty ? 'cke_anchor_empty' : 'cke_anchor';
							var cls = attributes[ 'class' ];
							if ( attributes.name && ( !cls || cls.indexOf( ieClass ) < 0 ) )
								attributes[ 'class' ] = ( cls || '' ) + ' ' + ieClass;

							if ( isEmpty && CKEDITOR.plugins.link.emptyAnchorFix ) {
								attributes.contenteditable = 'false';
								attributes[ 'data-cke-editable' ] = 1;
							}
						} else if ( CKEDITOR.plugins.link.fakeAnchor && isEmpty )
							return editor.createFakeParserElement( element, 'cke_anchor', 'anchor' );

						return null;
					}
				}
			});
		}

		if ( CKEDITOR.plugins.link.emptyAnchorFix && htmlFilter ) {
			htmlFilter.addRules({
				elements: {
					a: function( element ) {
						delete element.attributes.contenteditable;
					}
				}
			});
		}

		if ( pathFilters ) {
			pathFilters.push( function( element, name ) {
				if ( name == 'a' ) {
					if ( CKEDITOR.plugins.link.tryRestoreFakeAnchor( editor, element ) || ( element.getAttribute( 'name' ) && ( !element.getAttribute( 'href' ) || !element.getChildCount() ) ) ) {
						return 'anchor';
					}
				}
			});
		}
	}
});

CKEDITOR.plugins.link = {
	/**
	 *  Get the surrounding link element of current selection.
	 * @param editor
	 * @example CKEDITOR.plugins.link.getSelectedLink( editor );
	 * @since 3.2.1
	 * The following selection will all return the link element.
	 *	 <pre>
	 *  <a href="#">li^nk</a>
	 *  <a href="#">[link]</a>
	 *  text[<a href="#">link]</a>
	 *  <a href="#">li[nk</a>]
	 *  [<b><a href="#">li]nk</a></b>]
	 *  [<a href="#"><b>li]nk</b></a>
	 * </pre>
	 */
	getSelectedLink: function( editor ) {
		var selection = editor.getSelection();
		var selectedElement = selection.getSelectedElement();
		if ( selectedElement && selectedElement.is( 'a' ) )
			return selectedElement;

		var range = selection.getRanges( true )[ 0 ];
		range.shrink( CKEDITOR.SHRINK_TEXT );
		return editor.elementPath( range.getCommonAncestor() ).contains( 'a', 1 );
	},

	// Opera and WebKit don't make it possible to select empty anchors. Fake
	// elements must be used for them.
	fakeAnchor: CKEDITOR.env.opera || CKEDITOR.env.webkit,

	// For browsers that don't support CSS3 a[name]:empty(), note IE9 is included because of #7783.
	synAnchorSelector: CKEDITOR.env.ie,

	// For browsers that have editing issue with empty anchor.
	emptyAnchorFix: CKEDITOR.env.ie && CKEDITOR.env.version < 8,

	tryRestoreFakeAnchor: function( editor, element ) {
		if ( element && element.data( 'cke-real-element-type' ) && element.data( 'cke-real-element-type' ) == 'anchor' ) {
			var link = editor.restoreRealElement( element );
			if ( link.data( 'cke-saved-name' ) )
				return link;
		}
	}
};

CKEDITOR.unlinkCommand = function() {};
CKEDITOR.unlinkCommand.prototype = {
	/** @ignore */
	exec: function( editor ) {
		var style = new CKEDITOR.style( { element:'a',type:CKEDITOR.STYLE_INLINE,alwaysRemoveElement:1 } );
		editor.removeStyle( style );
	},

	refresh: function( editor, path ) {
		// Despite our initial hope, document.queryCommandEnabled() does not work
		// for this in Firefox. So we must detect the state by element paths.

		var element = path.lastElement && path.lastElement.getAscendant( 'a', true );

		if ( element && element.getName() == 'a' && element.getAttribute( 'href' ) && element.getChildCount() )
			this.setState( CKEDITOR.TRISTATE_OFF );
		else
			this.setState( CKEDITOR.TRISTATE_DISABLED );
	},

	contextSensitive: 1,
	startDisabled: 1
};

CKEDITOR.removeAnchorCommand = function() {};
CKEDITOR.removeAnchorCommand.prototype = {
	/** @ignore */
	exec: function( editor ) {
		var sel = editor.getSelection(),
			bms = sel.createBookmarks(),
			anchor;
		if ( sel && ( anchor = sel.getSelectedElement() ) && ( CKEDITOR.plugins.link.fakeAnchor && !anchor.getChildCount() ? CKEDITOR.plugins.link.tryRestoreFakeAnchor( editor, anchor ) : anchor.is( 'a' ) ) )
			anchor.remove( 1 );
		else {
			if ( ( anchor = CKEDITOR.plugins.link.getSelectedLink( editor ) ) ) {
				if ( anchor.hasAttribute( 'href' ) ) {
					anchor.removeAttributes( { name:1,'data-cke-saved-name':1 } );
					anchor.removeClass( 'cke_anchor' );
				} else
					anchor.remove( 1 );
			}
		}
		sel.selectBookmarks( bms );
	}
};

CKEDITOR.tools.extend( CKEDITOR.config, {
	linkShowAdvancedTab: true,
	linkShowTargetTab: true
});
