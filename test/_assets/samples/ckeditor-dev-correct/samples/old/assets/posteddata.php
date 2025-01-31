<!DOCTYPE html>
<?php
/*
Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
For licensing, see LICENSE.html or https://ckeditor.com/legal/ckeditor-oss-license/
*/
?>
<html>
<head>
	<meta charset="utf-8">
	<title>Sample &mdash; CKEditor</title>
	<link rel="stylesheet" href="sample.css">
</head>
<body>
	<h1 class="samples">
		CKEditor &mdash; Posted Data
	</h1>
	<table border="1" cellspacing="0" id="outputSample">
		<colgroup><col width="120"></colgroup>
		<thead>
			<tr>
				<th>Field&nbsp;Name</th>
				<th>Value</th>
			</tr>
		</thead>
<?php

if ( isset( $_POST ) )
	$postArray = &$_POST ;			// 4.1.0 or later, use $_POST
else
	$postArray = &$HTTP_POST_VARS ;	// prior to 4.1.0, use HTTP_POST_VARS

foreach ( $postArray as $sForm => $value )
{
	if ( get_magic_quotes_gpc() )
		$postedValue = htmlspecialchars( stripslashes( $value ) ) ;
	else
		$postedValue = htmlspecialchars( $value ) ;

?>
		<tr>
			<th style="vertical-align: top"><?php echo $sForm?></th>
			<td><pre class="samples"><?php echo $postedValue?></pre></td>
		</tr>
	<?php
}
?>
	</table>
	<div id="footer">
		<hr>
		<p>
			CKEditor - The text editor for the Internet - <a class="samples" href="https://ckeditorr.com/">https://ckeditor.com</a>
		</p>
		<p id="copy">
			Copyright &copy; 2003-2025, <a class="samples" href="https://cksource.com/">CKSource</a> Holding sp. z o.o. All rights reserved.
		</p>
	</div>
</body>
</html>
