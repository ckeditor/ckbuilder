﻿/*
 Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 For licensing, see LICENSE.html or https://ckeditor.com/legal/ckeditor-oss-license/
*/
CKEDITOR.skin.name="kama";CKEDITOR.skin.ua_editor="ie,ie6,ie7,ie8";CKEDITOR.skin.ua_dialog="ie,ie6,ie7,ie8,opera";
CKEDITOR.skin.chameleon=function(e,d){function b(a){return"background:-moz-linear-gradient("+a+");background:-webkit-linear-gradient("+a+");background:-o-linear-gradient("+a+");background:-ms-linear-gradient("+a+");background:linear-gradient("+a+");"}var c,a="."+e.id;"editor"==d?c=a+" .cke_inner,"+a+"_dialog .cke_dialog_contents,"+a+"_dialog a.cke_dialog_tab,"+a+"_dialog .cke_dialog_footer{background-color:$color !important;background:-webkit-gradient(linear,0 -15,0 40,from(#fff),to($color));"+b("top,#fff -15px,$color 40px")+
"}"+a+" .cke_toolgroup{background:-webkit-gradient(linear,0 0,0 100,from(#fff),to($color));"+b("top,#fff,$color 100px")+"}"+a+" .cke_combo_button{background:-webkit-gradient(linear, left bottom, left -100, from(#fff), to($color));"+b("bottom,#fff,$color 100px")+"}"+a+" .cke_combopanel{border: 1px solid $color;}":"panel"==d&&(c=".cke_menuitem .cke_icon_wrapper{background-color:$color !important;border-color:$color !important;}.cke_menuitem a:hover .cke_icon_wrapper,.cke_menuitem a:focus .cke_icon_wrapper,.cke_menuitem a:active .cke_icon_wrapper{background-color:$color !important;border-color:$color !important;}.cke_menuitem a:hover .cke_label,.cke_menuitem a:focus .cke_label,.cke_menuitem a:active .cke_label{background-color:$color !important;}.cke_menuitem a.cke_disabled:hover .cke_label,.cke_menuitem a.cke_disabled:focus .cke_label,.cke_menuitem a.cke_disabled:active .cke_label{background-color: transparent !important;}.cke_menuitem a.cke_disabled:hover .cke_icon_wrapper,.cke_menuitem a.cke_disabled:focus .cke_icon_wrapper,.cke_menuitem a.cke_disabled:active .cke_icon_wrapper{background-color:$color !important;border-color:$color !important;}.cke_menuitem a.cke_disabled .cke_icon_wrapper{background-color:$color !important;border-color:$color !important;}.cke_menuseparator{background-color:$color !important;}.cke_menuitem a:hover,.cke_menuitem a:focus,.cke_menuitem a:active{background-color:$color !important;}");
return c};
