/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.html or https://ckeditor.com/legal/ckeditor-oss-license/
 */

CKEDITOR.dialog.add( 'myDialog', function( editor ) {
	return {
		title: 'My Dialog',
		minWidth: 400,
		minHeight: 200,
		contents: [
			{
				id: 'tab1',
				label: 'First Tab',
				title: 'First Tab',
				elements: [
					{
						id: 'input1',
						type: 'text',
						label: 'Input 1'
					}
				]
			}
		]
	};
});
