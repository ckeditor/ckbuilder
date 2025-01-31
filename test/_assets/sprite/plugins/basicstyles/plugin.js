﻿/*
Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
For licensing, see LICENSE.html or https://ckeditor.com/legal/ckeditor-oss-license/
*/

CKEDITOR.plugins.add( 'basicstyles',
{
	init : function( editor )
	{
		// All buttons use the same code to register. So, to avoid
		// duplications, let's use this tool function.
		var addButtonCommand = function( buttonName, buttonLabel, commandName, styleDefiniton )
		{
			var style = new CKEDITOR.style( styleDefiniton );

			// Listen to contextual style activation.
			editor.attachStyleStateChange( style, function( state )
				{
					!editor.readOnly && editor.getCommand( commandName ).setState( state );
				});

			// Create the command that can be used to apply the style.
			editor.addCommand( commandName, new CKEDITOR.styleCommand( style ) );

			// Register the button, if the button plugin is loaded.
			if ( editor.ui.addButton )
			{
				editor.ui.addButton( buttonName,
					{
						label : buttonLabel,
						command : commandName
					});
			}
		};

		var config = editor.config,
			lang = editor.lang;

		addButtonCommand( 'Bold'		, lang.bold			, 'bold'		, config.coreStyles_bold );
		addButtonCommand( 'Italic'		, lang.italic		, 'italic'		, config.coreStyles_italic );
		addButtonCommand( 'Underline'	, lang.underline	, 'underline'	, config.coreStyles_underline );
		addButtonCommand( 'Strike'		, lang.strike		, 'strike'		, config.coreStyles_strike );
		addButtonCommand( 'Subscript'	, lang.subscript	, 'subscript'	, config.coreStyles_subscript );
		addButtonCommand( 'Superscript'	, lang.superscript	, 'superscript'	, config.coreStyles_superscript );
	}
});

// Basic Inline Styles.

/**
 * The style definition that applies the <strong>bold</strong> style to the text.
 * @type Object
 * @default <code>{ element : 'strong', overrides : 'b' }</code>
 * @example
 * config.coreStyles_bold = { element : 'b', overrides : 'strong' };
 * @example
 * config.coreStyles_bold =
 *     {
 *         element : 'span',
 *         attributes : { 'class' : 'Bold' }
 *     };
 */
CKEDITOR.config.coreStyles_bold = { element : 'strong', overrides : 'b' };

/**
 * The style definition that applies the <em>italics</em> style to the text.
 * @type Object
 * @default <code>{ element : 'em', overrides : 'i' }</code>
 * @example
 * config.coreStyles_italic = { element : 'i', overrides : 'em' };
 * @example
 * CKEDITOR.config.coreStyles_italic =
 *     {
 *         element : 'span',
 *         attributes : { 'class' : 'Italic' }
 *     };
 */
CKEDITOR.config.coreStyles_italic = { element : 'em', overrides : 'i' };

/**
 * The style definition that applies the <u>underline</u> style to the text.
 * @type Object
 * @default <code>{ element : 'u' }</code>
 * @example
 * CKEDITOR.config.coreStyles_underline =
 *     {
 *         element : 'span',
 *         attributes : { 'class' : 'Underline' }
 *     };
 */
CKEDITOR.config.coreStyles_underline = { element : 'u' };

/**
 * The style definition that applies the <strike>strike-through</strike> style to the text.
 * @type Object
 * @default <code>{ element : 'strike' }</code>
 * @example
 * CKEDITOR.config.coreStyles_strike =
 *     {
 *         element : 'span',
 *         attributes : { 'class' : 'StrikeThrough' },
 *         overrides : 'strike'
 *     };
 */
CKEDITOR.config.coreStyles_strike = { element : 'strike' };

/**
 * The style definition that applies the subscript style to the text.
 * @type Object
 * @default <code>{ element : 'sub' }</code>
 * @example
 * CKEDITOR.config.coreStyles_subscript =
 *     {
 *         element : 'span',
 *         attributes : { 'class' : 'Subscript' },
 *         overrides : 'sub'
 *     };
 */
CKEDITOR.config.coreStyles_subscript = { element : 'sub' };

/**
 * The style definition that applies the superscript style to the text.
 * @type Object
 * @default <code>{ element : 'sup' }</code>
 * @example
 * CKEDITOR.config.coreStyles_superscript =
 *     {
 *         element : 'span',
 *         attributes : { 'class' : 'Superscript' },
 *         overrides : 'sup'
 *     };
 */
CKEDITOR.config.coreStyles_superscript = { element : 'sup' };
