/*
Copyright (c) 2003-2011, CKSource - Frederico Knabben. All rights reserved.
For licensing, see LICENSE.html or http://ckeditor.com/license
*/

/**
 * @fileOverview Defines the {@link CKEDITOR.lang} object, for the
 * Hebrew language.
 */

/**#@+
   @type String
   @example
*/

/**
 * Contains the dictionary of language entries.
 * @namespace
 */
CKEDITOR.lang['he'] =
{
	/**
	 * The language reading direction. Possible values are "rtl" for
	 * Right-To-Left languages (like Arabic) and "ltr" for Left-To-Right
	 * languages (like English).
	 * @default 'ltr'
	 */
	dir : 'rtl',

	/*
	 * Screenreader titles. Please note that screenreaders are not always capable
	 * of reading non-English words. So be careful while translating it.
	 */
	editorTitle : 'עורך טקסט עשיר, %1, לחץ אלט (ALT) + 0 לעזרה.',

	// Common messages and labels.
	common :
	{
		browseServer	: 'סייר השרת',
		url				: 'כתובת (URL)',
		protocol		: 'פרוטוקול',
		upload			: 'העלאה',
		uploadSubmit	: 'שליחה לשרת',

		// Put the voice-only part of the label in the span.
		unavailable		: '%1<span class="cke_accessibility">, לא זמין</span>'
	},

	contextmenu :
	{
		options : 'אפשרויות תפריט ההקשר'
	},

	// Special char dialog.
	specialChar		:
	{
		toolbar		: 'הוספת תו מיוחד',
		title		: 'בחירת תו מיוחד',
		options : 'אפשרויות תווים מיוחדים'
	},

	docprops :
	{
		label : 'מאפייני מסמך',
		title : 'מאפייני מסמך',
		design : 'עיצוב',
		previewHtml : '<p>זהו <strong>טקסט הדגמה</strong>. את/ה משתמש/ת ב<a href="javascript:void(0)">CKEditor</a>.</p>'
	}
};
