<?php

include_once 'casa/common/debug.php' ;
include_once 'casa/init.php';
include_once 'login/login.php' ;
include_once 'common/Utilities.php' ;

$username        = CrcUtil::GetUserName();
$accountid       = CrcUtil::CrcCgiParams('accountid', '');
$UA              = new UserAccess();


if ( ! $UA->IsValidLogin( array('fromloginscreen'=>true ) ))
{
    $url = '/casa/index.php?action=Logout';
    echo "<html> <head> <meta http-equiv='Refresh' content='0;url=$url'> </head>";
    echo "<body> <a href='$url'> </a> </body></html>";
    exit;
}

$DEFAULTNAME = 'Unknown User';
$DEFAULTID   = 'aimco';

$CasaConfig = CrcUtil::GetJSConfig();
$ver        = CrcUtil::GetJSVersion();
$isdev      = CrcUtil::IsProd() ? 'false' : 'true';

$userdef    = FetchRowValue( "SELECT U.fullname, U.accountid, IFNULL(CU.groupid, '')  groupid
								FROM crcadmin.users U
								LEFT JOIN uiconfigdb.config_user CU ON U.id=CU.userid 
								WHERE U.id = '{$username}'",
								null, 
								array('fullname'=>$DEFAULTNAME,'accountid'=>'unknown', 'groupid'=>'') );


$fullname   = isset( $userdef['fullname']  ) && $userdef['fullname']  != '' ? $userdef['fullname'] : $DEFAULTNAME;
$usergroup	= $userdef['groupid'];

if ( empty($accountid) ) $accountid = $userdef['accountid'];

$jsperms           = GetCasaPermissions();
$CASA_DEAL_DIR_URL = GetCasaDealDirUrl();

$accts   = CrcUtil::GetAccounts(" OR groupid = 'aggregate' ");
$jsopts  = '';
$js_accountid_long   = "var AccountIdLong    = new Array();";
$js_accountid_short  = "var AccountIdShort   = new Array();";
$js_accountid_start  = "var AccountIdStart   = new Array();";

$title      = strtoupper( $accountid ) . "-Casa Applications";

foreach ( $accts as $fund )
{
    $selected = '';

    $name  = strtoupper( $fund['accountid'] );
    $start = strtoupper( $fund['fundstartdate'] );
    $longname = ($username == '' || strtolower($username) == 'demo') ? $fund[ 'genericname' ] : $fund[ 'longname' ];
    $img = "/casa/images/casa-icons/accountid/color-".$fund['accountid'].".png";
    $img_style ="style='padding:2px; background-repeat:no-repeat;background-image:url($img)'";
    $div_style = "<div style='width:20px; height:20px; border:2px solid #ffffff; background-color:#663399;'>&nbsp;<div>";

    if ( $accountid == $name )
    {
        $selected = ' SELECTED ';
    }

    $js_accountid_long	.= "AccountIdLong['{$fund['accountid']}'] = '{$longname}';";
    $js_accountid_short	.= "AccountIdShort['{$fund['accountid']}'] = '{$name}';";
    $js_accountid_start	.= "AccountIdStart['{$fund['accountid']}'] = '{$start}';";
    $jsopts     .= "<option value='{$fund['accountid']}' {$selected}>$div_style{$longname}</option>";

}


$favicon    = "/favicon.ico";

print "
	<!DOCTYPE html>
	<html>
	<head>

	<title>{$title}</title>
	<link id='crc-favicon' rel='shortcut icon' href='{$favicon}' type='image/x-icon'>

	</head>

	<body id='casa-desktop' scroll='no' style='background-color:black;'>

	<SCRIPT type='text/javascript' src='/casa/common/urlutils.js?$ver'></SCRIPT>
	<SCRIPT> includecss('/casa/css/loadingmask.css'); </SCRIPT>

	<div id='loading-mask' style=''></div>
	<div id='loading'>
		<div class='loading-indicator'><img src='/casa/images/blue-loading.gif' style='margin-right:8px;float:left;vertical-align:top;'/>
		<span id='loading-msg'>
		Casa {$ver}<br />
		Initializing Application...
		</span>
		</div>
	</div>

	<script>
	CASA_VERSION       = {$ver};
	CASA_USER          = '{$username}';
	CASA_USER_FULLNAME = '{$fullname}';
	CASA_USER_GROUP    = '{$usergroup}';	
	CasaDesk           = null;
	ISCASA             = true;

	{$jsperms}

	{$CASA_DEAL_DIR_URL}

	includejs('/extjs/ext-all.js');
	includejs('/casa/common/Utilities.js');
	includejs('js/StartMenu.js');
	includejs('js/TaskBar.js');
	includejs('js/Desktop.js');
	includejs('js/App.js');
	includejs('js/Module.js');
	includejs('js/ShortcutModel.js');
	includejs('js/Wallpaper.js');
	includejs('/casa/index.js');

	includecss('/casa/css/ext-all-classic.css');
	includecss('/casa/css/desktop.css');
	includecss('/casa/css/casa.css');
	includecss('/login/login.css');

	{$js_accountid_long}
	{$js_accountid_short}
	{$js_accountid_start}

	</script>

	<style type='text/css'>
	.ui-dialog
	{
		z-index:90000 !important;
		font-size:12px !important;
	}

	.ui-dialog .ui-dialog-buttonpane
	{
		text-align: center !important;
	}

	.ui-dialog .ui-dialog-buttonpane .ui-dialog-buttonset
	{
		float: none !important;
	}
	#smiley-dialog
	{
		text-align:center;
		text-justify:distribute;
		font-size:12px !important;
		margin:10px;
	}
	</style>
";

WriteCasaGlobals($accountid);
WriteDesktopIconsDIV();
WriteDesktopFavoritesDIV();


print "
	<div id ='casa-fund-summary'></div>

	<div id ='casa-btn-area'></div>
	<div id ='casa-banner-area'></div>
	<div id ='casa-display-area'></div>

	<div id ='app-icongrid-opener'></div>

	<div id='crc-bottom-info-copyright'>
	<div class='crc-copyright-text'>Casa {$ver} {$CasaConfig->copyright}</div>
	</div>

	<div id='crc-bottom-info-logout'>
	<div class='crc-username-text'>
	<span style='vertical-align:top;'>{$fullname}&nbsp;&nbsp;</span>
	<span style='font-size:1.1em;cursor:pointer;' class='fas fa-cog' id='casa-user-settings'></span>
	</div>

	</div>


	<DIV id='smiley-dialog' style='padding:0px; overflow-x:hidden; overflow-y:hidden;display:none;'>
	</DIV>

	</body>
	</html>
";

?>
