Ext.onReady( function(){
    if ( 'undefined' == typeof CONTEXT )
	CONTEXT = 'casa';

    var appicongrid = $('#app-icongrid');

    appicongrid.draggable({cursor: 'move'});

    appicongrid.on( 'dragstop', function( event, ui ) {
		var x = appicongrid.position().left;
		var y = appicongrid.position().top;
		var ig_width  = appicongrid.width() + 16;
		var ig_height = appicongrid.height() + 40;
		var newX = x; var newY = y;

		if ( x < 0 ) newX = 0;
				   if ( y < 0 ) newY = 0;
				   if ( x+ig_width  > window.innerWidth ) newX = window.innerWidth-ig_width;
				   if ( y+ig_height > window.innerHeight) newY = window.innerHeight-ig_height;

				   if ( newX != x || newY != y ) appicongrid.animate({ 'top': newY + 'px', 'left': newX + 'px'}, 200 );
	} );

	appicongrid.click( function(e) {
		var x = $(this).position().left;
		var y = $(this).position().top;
		x = e.pageX - x;
		y = e.pageY - y;

		if ( x < 40 || y < 40 || x > 530 || y > 530 )
		{
		    CasaDesk.bringMeToFront('app-icongrid');
		}
	});

	appicongrid.data('state', true);

	var ig_width  = appicongrid.width();
	var ig_height = appicongrid.height();
	var new_x = Math.max(5,(window.innerWidth - ig_width)/2);
	var new_y = Math.max(5,(window.innerHeight - ig_height)/2);

	$(window).bind('resize', function(e){
		$(window).resize(function(){
			clearTimeout(window.resizeEvt);
			window.resizeEvt = setTimeout(function(){
				if ( appicongrid.is(":visible") ){
					var ig_x = appicongrid.position().left;
					var ig_y = appicongrid.position().top;

					new_x = ig_x;
					new_y = ig_y;

					if ( (ig_x + ig_width) > window.innerWidth )   new_x = Math.max(5,parseInt(window.innerWidth/2 - ig_width/2));
										  if ( (ig_y + ig_height) > window.innerHeight ) new_y = Math.max(5,parseInt(window.innerHeight/2 - ig_height/2));
				}
				else
				{
					new_x = Math.max(5,(window.innerWidth - ig_width)/2);
					new_y = Math.max(5,(window.innerHeight - ig_height)/2);
				}

				appicongrid.animate({ top: new_y + 'px', left: new_x + 'px'}, 300 );
			}, 50);
		});
	});

	appicongrid.css('left', new_x);
	appicongrid.css('top', new_y);

	var default_FA_font = $('#app-desktop-favorites .app-favorite-icon[itemid=app-fav-0] .app-favorite-image').css('font-family');
	$('#app-desktop-favorites').attr('def_font', default_FA_font);

	CreateModel( '{DD_userFavorites}', [
		{ name : "itemid",	mapping : "itemid" }
		,{ name : "label",	mapping : "label" }
	]);

	DefineCasaApp();
	GetDBValue(
		" SELECT * from crcstatic.casaconfig WHERE 1=1 "
		,[
		{name : 'item', mapping: 'item'}
		,{name : 'value', mapping: 'value'}
		,{name : 'type', mapping: 'type'}
		]
		,function( RECORDS )
		{
			var config = {};
			Ext.iterate(RECORDS, function(el){
				switch (el.data.type)
				{
					case 'int':
						config[el.data.item] = parseInt(el.data.value);
						break;
					case 'float':
						config[el.data.item] = parseFloat(el.data.value);
						break;
					default:
						config[el.data.item] = el.data.value;
						break;
				}
			});

			CasaDesk = new Casa.App( config );
			CasaDesk.itemId = 'CasaDesk';
		}
	);
});

// queryById --> menu elements
// CasaDesk.desktop.taskbar.startMenu.queryById('casa-menu-blink')
// CasaDesk.desktop.contextMenu.queryById('casa-menu-portfolio')


// ===============================================================
function DefineCasaApp()
{
	Ext.define('Casa.App', {
		extend: 'Ext.ux.desktop.App'

		,dummyMenuItem : {
			menuParent : 'favoritesMenu'
			,accounts : 'all'
			,users : CASA_USER
			,text : 'Your Favorites List is empty!'
			,textAlign : 'left'
			,itemId : 'casa-user-favorite-dummy'
			,cls : 'casamenu-menuitem'
			,glyph : GLYPH_BOXOPEN
		}
		
		,mixins: {
			stressTestManualDeals: 'Casa.STManualDeals'
			,xccyBasisSwapIRRCalculator : 'Casa.xccyBasisSwapIRR'
			,webHoseNewsFeed : 'Casa.WebHoseModule'
			,projectedAvailCash : 'Casa.ProjectedAvailCash'
			,fundPerformance : 'FundPerformance.Main'
			,histBaseCaseParams : 'Casa.HistBaseCaseParams'
		}

		,switchFundKeymap : new Array()
		,popupList : []
		,transientList : []
		,transientListPersist : []
		,genieLog : null

		,modules : {
			Portfolio: CasaPortfolio = new Casa.Portfolio()
			,PNL: CasaPNL = new Casa.PNL()
			,Blogger: new Casa.Blogger()
			,DealBlogger: new Casa.DealBlogger()
			,PortfolioPmts: CasaPayments = new Casa.PortfolioPmts()
			,CashAccounts: CasaCashAccounts = new Casa.CashAccounts()
			,Investors:  CasaInvestors = new Casa.Investors()
			,MarketData: CasaMarketData = new Casa.MarketData()
			,Ratings: CasaRatings = new Casa.CreditRatings()
			,ProjCFs: CasaProjCFs = new Casa.ProjCFs()
			,Maintenance: CasaMaintenance = new Casa.Maintenance()
			,MTMmaint: new Casa.MTMmaint()
		}
		
		,getModules : function() {
			return this.modules;
		}
		
		,constructor : function(config)
		{
			var me = this;
			me.casaConfig = config;
			me.loadCasaMenus(me.superclass.constructor.call, me);
			CasaPortfolio.parent = me;
		}
		
		,init: function() {
			var me = this;

			if ( 'crcpics' == me.casaConfig.casaDisplayArea )
			{
				me.ANNIVERSARYPICS = [];
				GetDBValue(
					" SELECT removeslideshow from uiconfigdb.config_user WHERE userid = '" + CASA_USER.toLowerCase() + "' "
					,[
					{name : 'removeslideshow', mapping: 'removeslideshow'}
					]
					,function( RECORDS )
					{
						if ( isSet(RECORDS[0]) && 0 == parseInt(RECORDS[0].get('removeslideshow')) )
						{
							Ext.Ajax.request ({
								url		: me.casaConfig.picsBaseDir + 'loadfilenames.php',
								callback	: function( fnc, success, response )
								{
									var RESP = Ext.JSON.decode(response.responseText);

									if ( !RESP.success )
										HandleJsonFailure(me.mainPanel, RESP);
									else
									{
										Ext.iterate( RESP, function (key, val){
											if ( 'success' != key )
											{
												var NODE = CasaUtil.processDirectoryNode(key, val);
												var dir = ( "./" == NODE.text ) ? "" : NODE.text + "/";
												NODE.children.forEach(function(element) {
													var file = dir + element.text;
													me.ANNIVERSARYPICS.push(encodeURI(file));
												});
											}
										} );
									}
								}
							});
						}
					}
				);
			}

			if ( isSet(me.casaConfig.casaBannerArea) )
			{
				var renderTo = Ext.get('casa-banner-area');
				var B_AREA = me.casaConfig.casaBannerArea.split('|')
				me.bannerHolder = Ext.create('Ext.Img', {
					src: B_AREA[0]
					,renderTo: renderTo
					,width : parseInt(B_AREA[1])
					,height : parseInt(B_AREA[2])
					,listeners : {
						afterrender: function() {
							setTimeout(this.showBanner, 1500);
						}
					}
					,showBanner : function() {
						var appicongrid = $('#app-icongrid');
						var new_x = parseFloat(appicongrid.css('left'));
						var new_y = parseFloat(appicongrid.css('top'));

						$('#casa-banner-area').css('left', new_x - 10 );
						me.bannerHolder.el.fadeIn({
							duration: 1000,
							scope: this
						});

						var H = $('#casa-banner-area').height() + 15;
						new_y = Math.max(H, new_y );
						appicongrid.animate({ top: new_y });

						if ( isSet(me.casaConfig.casaButtonArea) )
						{
							var btnArea = $('#casa-btn-area');
							btnArea.css('left', new_x + 240);
							btnArea.fadeTo(1000,1);
						}
					}
				});
				me.bannerHolder.el.fadeOut({
					duration: 0.1,
					scope: this
				});
			}

			if ( isSet(me.casaConfig.casaButtonArea) )
			{
				var btnArea = $('#casa-btn-area');
				var BTN_AREA = me.casaConfig.casaButtonArea.split('|');
				var btnAreaHtml = "<div><div class='casa-btn-area-button' onclick='" + BTN_AREA[1] + "'>" + BTN_AREA[0] + "</div></div>";
				btnArea.html(btnAreaHtml);
				btnArea.hide();
			}
			
			me.callParent();

			Ext.WindowMgr.zseed = me.casaConfig.zSeed;
			
			//override desktop.getDesktopZIndexManager function to account for 'addOnWindows' - always on wins - newsfeed/fundMenu
			me.desktop.getDesktopZIndexManager = function() {
				var windows = this.windows;
				var addOnWindows = me.addOnWindows;

				// TODO - there has to be a better way to get this...
				return (windows.getCount() && windows.getAt(0).zIndexManager) || (addOnWindows.getCount() && addOnWindows.getAt(0).zIndexManager) || null;
			};

			Ext.setGlyphFontFamily(GLOB_FONT_AWESOME);
			Ext.Loader.setConfig({
			    enabled: true,
			    paths: {
				Ext: '/extjs/',
				'Ext.ux': '/pkg/ux'
			    }
			});

			me.addEvents( 'beforeswitchfund' );
			me.addEvents( 'afterswitchfund'  );
			me.addOnWindows = new Ext.util.MixedCollection();

			WebNews = me.mixins.webHoseNewsFeed;
			WebNews.init();
			me.mixins.stressTestManualDeals.init();

			me.fundPerformance    = me.mixins.fundPerformance;
			me.projectedAvailCash = me.mixins.projectedAvailCash;
			
			CasaProjCFs.histBaseCaseParams = me.mixins.histBaseCaseParams;
			CasaProjCFs.histBaseCaseParams.init();
			
			me.createCasaSearchAndNews();
			me.createKeyShortcuts();
			me.checkCasaVersion();
			
			CasaUtil.userSettings.init( me );
			
			// NOTE: equivalent ways to add the same listener : pure Javascript or with jQuery
			document.getElementById("casa-display-area").addEventListener('contextmenu', function(event) {me.rightClickPassThrough(event)} );
			$('#casa-banner-area').attr('oncontextmenu', "CasaDesk.rightClickPassThrough(event)" );

			$('#app-icongrid-opener').click( function() { me.openIconGrid();} );
			$('#app-icongrid').on( 'mouseenter', me.gridMouseEnter );
			$('#app-icongrid').on( 'mouseleave', me.gridMouseLeave );
			$($(".ux-taskbar")[0]).on( 'mouseenter', me.checkNewFavoriteAction );

			me.switchCasaFund( { acctid : ACCOUNTID, acctname : AccountIdLong[ ACCOUNTID ] } );

			document.getElementById('casa-user-settings').addEventListener( 'click', function (e) {
				CasaDesk.onSettingsMenu(e);
			}, false );

			// Now ready to display icon-grid and select fund
			Ext.get('loading').remove();
			Ext.get('loading-mask').fadeOut( { duration: 200, remove : true, callback : function() {
				$('#app-icongrid-opener').click();
				me.desktop.contextMenu.on('beforeshow', me.checkNewFavoriteAction);

				$('#app-desktop-favorites').fadeTo(150,me.casaConfig.faviconsopacity);
				var desk_fav_tbody = $('#app-desktop-favorites > table > tbody');
				var desk_fav_container = $('#app-desktop-favorites-container');

				desk_fav_container.attr('noFront', '0');
				desk_fav_container.on('mouseenter', function () {
					me.checkNewFavoriteAction();
					$('#app-desktop-favorites').fadeTo(150, 1);
				} );
				desk_fav_container.on('mouseleave', function () {
					$('#app-desktop-favorites').fadeTo(150,me.casaConfig.faviconsopacity);
				});
				desk_fav_tbody.on('mouseenter', function () {
					if ( '0' !== $('#app-desktop-favorites-container').attr('noFront') )
						return;
					CasaDesk.bringMeToFront('app-desktop-favorites-container');
				} );
				desk_fav_tbody.on('mouseleave', function () { CasaDesk.bringMeToBack('app-desktop-favorites-container'); });
			} });
			
			// NOTE: to work with multiple favicons, e.g. change to smaller icon when applying badge
			// you need to use as default favicon the one you want to apply the badge to and use a different plain (no badge) icon
			// to be set with favicon.image(img) when resetting to zero
			me.favicon = new Favico({
				animation:'fade'
				,type : 'rectangle'
				,textColor:me.casaConfig.faviconTextColor
				,bgColor:me.casaConfig.faviconBgColor
			});
		}

		,updateUserFavoritesDB : function (params)
		{
			var me = this;
			params.user = CASA_USER;
			Ext.Ajax.request ({
				url		: '/casa/casamenus.php'
				,params	: params
				,callback	: function( fnc, success, response )
				{
					var RESP = Ext.JSON.decode(response.responseText);

					if ( !RESP.success )
						HandleJsonFailure(me.mainPanel, RESP);
				}
			});
		}

		,loadCasaMenus : function (cb, cbparams)
		{
			var me = this;
			Ext.Ajax.request ({
				url		: '/casa/casamenus.php'
				,params	: {
					user : CASA_USER
					,action : 'loadmenus'
				}
				,callback	: function( fnc, success, response )
				{
					var RESP = Ext.JSON.decode(response.responseText);

					if ( !RESP.success )
						HandleJsonFailure(me.mainPanel, RESP);
					else
					{
						me.userFavoritesIDs = [];
						me.userFavoritesFullCollection = {};
						me.app_iconGrid_items = [];
						me.casaModules_shortcuts = [];

						// NOTE: favoritesMenu MUST be built before contextMenu
						me.buildCasaMenu( RESP.favoritesMenu, 'favoritesMenu' );
						me.buildCasaMenu( RESP.rightClickMenu, 'contextMenu' );
						me.buildCasaMenu( RESP.startMenu, 'startMenu' );
						me.buildCasaMenu( RESP.iconGrid, 'iconGrid' );

						// NOTE: this is necessary only to build missing elements from userFavoritesFullCollection (all possible favs)
						me.buildCasaMenu( RESP.casaMenuAll, 'all' );

						me.superclass.constructor.call(me);
					}
				}
			});
		}

		,buildIconGridActions : function ( singleitem )
		{
			var me = this;

			var appIcon = $('#app-icongrid .app-icongrid-icon[itemid="' + singleitem.itemId + '"]');
			appIcon.attr('itemId', singleitem.itemId);

			me.app_iconGrid_items.push({ itemId : singleitem.itemId, accounts : singleitem.accounts, users : singleitem.users });

			appIcon[0].handler_base = singleitem.handler_base;

			// right click action to add/remove favorite
			// main action added during switchfund
			appIcon.contextmenu(function(e) {
				e.preventDefault();
				e.stopPropagation();
				if ( '0' == appIcon.attr('isEnabled') )
					return;

				var menuitem = me.userFavoritesFullCollection[appIcon.attr('itemId')];

				var add_remove;
				var idx = me.userFavoritesIDs.indexOf(menuitem.itemId)
				if ( -1 != idx )
				{
					add_remove = {
						text : 'Remove from My Favorites'
						,glyph : GLYPH_BAN
						,handler : function () {
							me.removeFromMyFavs(menuitem.itemId, me);
						}
					};
				}
				else
				{
					add_remove = {
						text : 'Add to My Favorites'
						,glyph : GLYPH_HEART
						,handler : function () {
							me.desktop.contextMenu.queryById('casa-user-favorites').menu.add(menuitem);
							me.addToMyFavs( menuitem.itemId, me );
						}
					}
				}

				var addfavmenu = new Ext.menu.Menu({
					items : [ add_remove ]
				});

				var zmgr = me.desktop.getDesktopZIndexManager();
				if ( zmgr.getActive().getEl().zindex <= me.casaConfig.zSeed )
					me.bringMeToBack('app-icongrid');

				addfavmenu.showAt(e.pageX, e.pageY);
			});
		}

		,showHideMyFavs : function ()
		{
			var me = this;
			if ( me.userFavoritesIDs.length )
				me.desktop.contextMenu.queryById('casa-user-favorite-dummy').hide();
			else
			{
				me.desktop.contextMenu.queryById('casa-user-favorite-dummy').show();
				me.desktop.contextMenu.queryById('casa-user-favorite-dummy').disable();
			}

			var i;
			for (i = 0; i < me.casaConfig.maxfavicons; i++) {
				var theFAV = $('#app-desktop-favorites .app-favorite-icon[itemid=app-fav-'+i+']');
				theFAV.unbind('click');
				theFAV.hide();

				if ( i < me.userFavoritesIDs.length )
				{
					var fav = me.userFavoritesIDs[i]
					,item = me.userFavoritesFullCollection[fav]
					,unicode
					,default_font = $('#app-desktop-favorites').attr('def_font');

					$('#app-desktop-favorites .app-favorite-icon[itemid=app-fav-'+i+'] .app-favorite-image').css('font-family', default_font);

					if ( isSet(item.glyph) )
					{
						if ('string' == typeof item.glyph)
						{
							var G = item.glyph.split('@');
							unicode = parseInt(G[0].substring(1),16);
							$('#app-desktop-favorites .app-favorite-icon[itemid=app-fav-'+i+'] .app-favorite-image').css('font-family', G[1]);
						}
						else
						{
							unicode = item.glyph;
							$('#app-desktop-favorites .app-favorite-icon[itemid=app-fav-'+i+'] .app-favorite-image').addClass(item.extracls);
						}
					}
					else
					{
						unicode = parseInt('f40e',16);
					}

					theFAV.attr('item_id', fav);
					theFAV.attr('isEnabled', '0');

					theFAV.contextmenu(function(e) {
						e.preventDefault();
						e.stopPropagation();

						var menuitem = me.userFavoritesFullCollection[$(this).attr('item_id')];

						var add_remove = {
							text : 'Remove from My Favorites'
							,glyph : GLYPH_BAN
							,handler : function () {
								me.removeFromMyFavs(menuitem.itemId, me);
							}
						};

						var fav_cmenu = new Ext.menu.Menu({
							items : [ add_remove ]
						});

						fav_cmenu.on('show', function(){
							$('#app-desktop-favorites-container').attr('noFront', '1');
						});
						fav_cmenu.on('hide', function(){
							$('#app-desktop-favorites-container').attr('noFront', '0');
						});

						fav_cmenu.showAt(e.pageX, e.pageY);

						$('#app-desktop-favorites-container').css('z-index',$('#' + fav_cmenu.id).css('z-index')-1);
					});

					$('#app-desktop-favorites .app-favorite-icon[itemid=app-fav-'+i+'] .app-favorite-image').text(String.fromCharCode(unicode));
					$('#app-desktop-favorites .app-favorite-icon[itemid=app-fav-'+i+'] .app-favorite-title .content').text(item.text);

					var ACCOUNTS = item.accounts.split('|');
					var USERS    = item.users.split('|');
					var enable = (( ACCOUNTS.indexOf(ACCOUNTID) != -1 ) || ( ACCOUNTS.indexOf('all') != -1 && ACCOUNTS.indexOf('!'+ACCOUNTID) < 0 )) && (( USERS.indexOf(CASA_USER.toLowerCase()) != -1 ) || ( USERS.indexOf('all') != -1 && USERS.indexOf('!'+CASA_USER.toLowerCase()) < 0 ));
					if ( enable )
					{
						theFAV.click(item.handler);
						theFAV.attr('isEnabled', '1');
						theFAV.show();
					}
				}
			}
			
			if ( isSet( CasaUtil.userSettings.userFavoritesGrid ) )
			{
				CasaUtil.userSettings.userFavoritesGrid.onResetClick();
			}
		}

		,addToMyFavs : function ( itemId, me )
		{
			if ( -1 != me.userFavoritesIDs.indexOf(itemId) )
				return;

			me.userFavoritesIDs.push(itemId);
			me.desktop.contextMenu.queryById('casa-user-favorites').menu.add(me.userFavoritesFullCollection[itemId]);
			me.updateUserFavoritesDB({ action:'addfavorite', favorite:itemId });
			me.showHideMyFavs();
		}

		,removeFromMyFavs : function ( itemId, me )
		{
			var FAVs = me.desktop.contextMenu.queryById('casa-user-favorites').menu.items.items;
			var i;
			for (i = 0; i < FAVs.length; i++) {
				var fav = FAVs[i];
				if ( fav.itemId == itemId )
				{
					me.desktop.contextMenu.queryById('casa-user-favorites').menu.remove(Ext.getCmp(fav.id),false);
					break;
				}
			}

			var i;
			for (i = 0; i < me.userFavoritesIDs.length; i++) {
				var fav = me.userFavoritesIDs[i];
				if ( fav == itemId )
				{
					me.userFavoritesIDs.splice(i, 1);
					break;
				}
			}

			me.updateUserFavoritesDB({ action:'removefavorite', favorite:itemId });
			me.showHideMyFavs();
		}

		,createUrlHandler : function ( METHOD, url, id_from, standalone )
		{
			if ( url.substr(url.length - 1) != "/" && CasaUtil.getFileExtension(url) == "" ) // if 'url' does not have an extension e.g. "php" / "pdf" then assume is directory and add "/"
				url += '/';

			var persist = ( -1 != METHOD[0].indexOf('persist') ), handler = null;

			if ( 'undefined' == typeof standalone )
				standalone = '1';
			if ( false === standalone )
				standalone = '0';
			
			if ( isSet(METHOD[1]) && isSet(METHOD[2]) )
			{
				var features = "left=10, top=20, scrollbars=yes, resizable=yes, width=" + METHOD[1] + ", height=" + METHOD[2];
				handler = function() {
					CasaDesk.OpenDesktopWindow( { url:url, standalone:standalone, features:features, persistent:persist, id_from:id_from } );
				};
			}
			else
			{
				handler = function() {
					CasaDesk.OpenDesktopWindow( { url:url, standalone:standalone, persistent:persist, id_from:id_from } );
				};
			}

			return handler;
		}

		,buildCasaMenu : function ( ARR, which )
		{
			var me = this, menu = [], submenus = [], singleitem = {}, isUserFavoriteItem = false ;

			ARR.forEach(function(element) {
				singleitem = {};

				if ( 'favoritesMenu' == which )
				{
					isUserFavoriteItem = true;
				}

				singleitem.accounts = element.accountid;
				singleitem.users = element.users;
				singleitem.text = element.label;
				singleitem.textAlign ='left';
				singleitem.itemId = element.itemid;
				singleitem.cls = 'casamenu-menuitem';
				singleitem.extracls = "";

				if ( -1 != element.itemicon.indexOf('GLYPH_') )
				{
					var GLY = element.itemicon.split(":");
					singleitem.glyph = window[GLY[0]];

					if ( isSet(GLY[1]) )
					{
						singleitem.cls += " " + GLY[1];
						singleitem.extracls  += GLY[1];
					}
				}
				else
				{
					singleitem.iconCls = element.itemicon;
				}

				var METHOD = element.method.split(':')
				switch ( METHOD[0] )
				{
					case 'submenu':
						submenus[element.itemid] = [];
						if ( 'casa-user-favorites' == element.itemid )
						{
							if ( !me.userFavoritesIDs.length )
								me.favoritesMenu_items = [];

							me.favoritesMenu_items.push( new Ext.menu.Item(me.dummyMenuItem) );
							singleitem.menu = me.favoritesMenu_items;
						}
						else
							singleitem.menu = submenus[element.itemid];
						break;

					case 'separator':
						singleitem = '-';
						break;

					case 'module':
						if ( 'all' == which )
							me.casaModules_shortcuts.push(element);
						singleitem.handler_base = function() {
							CasaDesk.openDesktopModule( element.url );
						};
						singleitem.handler = singleitem.handler_base;
						singleitem.cls += " casamenu-rclickenabled";
						break;

					case 'windowext':
					case 'windowextpersist':
						// in this case we should pass standalone=0 because the EXT wrap takes care of including all JS
						singleitem.cls += " casamenu-rclickenabled";
						singleitem.handler_base = me.createUrlHandler(METHOD, element.url, singleitem.itemId, false)
						singleitem.handler = singleitem.handler_base;
						break;
					
					case 'window':
					case 'windowpersist':
						singleitem.cls += " casamenu-rclickenabled";
						singleitem.handler_base = me.createUrlHandler(METHOD, element.url, singleitem.itemId)
						singleitem.handler = singleitem.handler_base;
						break;

					case 'desktop':
						singleitem.handler = function() {
							eval(element.url)
						};

						singleitem.minWindows = 1;
						break;

					case 'js':
						singleitem.handler_base = function() {
							eval(element.url)
						};
						singleitem.handler = singleitem.handler_base;
						singleitem.cls += " casamenu-rclickenabled";
						break;
				}

				if ( isSet(singleitem.itemId) && !isSet(me.userFavoritesFullCollection[singleitem.itemId]) )
				{
					singleitem.menuParent = 'favoritesMenu';
					me.userFavoritesFullCollection[singleitem.itemId] = new Ext.menu.Item(singleitem);
					me.userFavoritesFullCollection[singleitem.itemId].on('boxready', function() { me.addMenuItemRightClick(this.id) });
				}

				if ( 'all' == which )
					return;

				singleitem.menuParent = which;

				if ( 'iconGrid' == which )
				{
					me.buildIconGridActions(singleitem);
					return;
				}

				var itm;
				if ( isSet(singleitem.cls) && -1 != singleitem.cls.indexOf('casamenu-rclickenabled') )
				{
					itm = ('startMenu' == which) ? new Ext.Button(singleitem) : new Ext.menu.Item(singleitem);
					itm.on('boxready', function() { me.addMenuItemRightClick(this.id) });
				}
				else
				{
					itm = singleitem;
				}

				if ( '-' == element.parent_item || isUserFavoriteItem )
				{
					menu.push( itm );
					if (isUserFavoriteItem)
						me.userFavoritesIDs.push(element.itemid);
				}
				else
				{
					submenus[element.parent_item].push( itm );
				}
			});

			me[ which + '_items' ] = menu;
		}

		,addMenuItemRightClick : function(e_ID) {
			var me = this;
			$('#' + e_ID).contextmenu(function(e) {
				e.preventDefault();
				e.stopPropagation();

				var menuitem = Ext.getCmp(this.id);

				var add_remove;
				var idx = me.userFavoritesIDs.indexOf(menuitem.itemId)
				if ( -1 != idx )
				{
					add_remove = {
						text : 'Remove from My Favorites'
						,glyph : GLYPH_BAN
						,handler : function () {
							me.removeFromMyFavs(menuitem.itemId, me);
							me.desktop.contextMenu.queryById('casa-user-favorites').menu.hide();
						}
					};
				}
				else
				{
					add_remove = {
						text : 'Add to My Favorites'
						,glyph : GLYPH_HEART
						,handler : function () {
							me.addToMyFavs( menuitem.itemId, me );
						}
					}
				}

				var addfavmenu = new Ext.menu.Menu({
					items : [ add_remove ]
				});
				addfavmenu.PREVENT_HIDE = [];

				var count = 0, parent = menuitem.up('menu');
				while ( isSet(parent) )
				{
					parent.allowHide = false;
					parent.on('beforehide', function(){
						return this.allowHide;
					});
					addfavmenu.PREVENT_HIDE.push(parent);
					parent = parent.up('menu');
					count++;
				}

				parent = me.desktop.contextMenu.queryById('casa-user-favorites').menu;
				parent.allowHide = false;
				parent.on('beforehide', function(){
					return this.allowHide;
				});
				addfavmenu.PREVENT_HIDE.push(parent);

				if ( 'startMenu' == menuitem.menuParent )
				{
					addfavmenu.PREVENT_HIDE.push(me.desktop.taskbar[menuitem.menuParent]);
					me.desktop.taskbar[menuitem.menuParent].allowHide = false;
					me.desktop.taskbar[menuitem.menuParent].on('beforehide', function(){ return this.allowHide;});
				}

				addfavmenu.on('hide', function(){
					this.PREVENT_HIDE.forEach(function(element) {
						element.allowHide = true;
					});
				});
				addfavmenu.showAt(e.pageX, e.pageY);
			});
		}

		,getDesktopConfig : function ()
		{
			var me = this, ret = me.callParent();

			return Ext.apply(ret, {
				contextMenuItems: me.contextMenu_items,
				id       : "desktop-desktop"
			})
		}

		,getStartConfig : function() {
			var me = this, ret = me.callParent();

			var cfg = {
				title: 'Casa Application Suite'
				,iconCls: 'user'
				,width : me.casaConfig.startMenuWidth
				,height: me.casaConfig.startMenuHeight
				,toolConfig: {
					width: me.casaConfig.startMenuToolsWidth
					,items: me.startMenu_items
				}
			};

			return Ext.apply(ret, cfg);
		}

		,lastactwindow : null

		,checkNewFavoriteAction : function() {
			// this function checks if the user has requested to add/remove favorite from a contempo report
			var me = Ext.getCmp('desktop-desktop').app;

			if ( me.desktop.contextMenu.requiresRefresh === true )
			{
				me.desktop.contextMenu.queryById('casa-user-favorites').menu.removeAll(false);
				me.desktop.contextMenu.queryById('casa-user-favorites').menu.add(me.dummyMenuItem);
				me.userFavoritesIDs.forEach(function(e){
					me.desktop.contextMenu.queryById('casa-user-favorites').menu.add(me.userFavoritesFullCollection[e]);
				});
				me.desktop.contextMenu.requiresRefresh = false;
				me.showHideMyFavs();
			}

			var theAction = getCookie('crcCasaFavoriteAction');
			if ( !isSet(theAction) )
				return;

			theAction = theAction.split('|');
			if ( theAction[2].toLowerCase() != CASA_USER.toLowerCase() )
				return;

			var me = Ext.getCmp('desktop-desktop').app;
			switch (theAction[0])
			{
				case 'add':
					me.addToMyFavs(theAction[1], me);
					break;

				case 'remove':
					me.removeFromMyFavs(theAction[1], me);
					break;
			}

			DeleteCookie ('crcCasaFavoriteAction');
		}

		,rightClickPassThrough : function(e) {
			e.preventDefault();
			e.stopEvent = Ext.emptyFn;
			e.getXY = function() { return [e.x, e.y] }

			this.desktop.onDesktopMenu(e);
		}

		,imageHolder : null

		,listeners : {
			beforeswitchfund : function() {
				var ret;

				this.removePopupWins();
				ret = this.removeTransients();

				return ret;
			}
		}

		,createKeyShortcuts : function () {
			var me = this;
			// Map 'shift+m' key -> minimize
			new Ext.KeyMap(Ext.get(document), {
				key:'M'
				,shift:true
				,fn:function(e){
					if ( 'password' == document.activeElement.type || 'text' == document.activeElement.type || 'textarea' == document.activeElement.type ) return;

					var desktop = Ext.getCmp('desktop-desktop');
					var act_win = desktop.getActiveWindow();

					if ( null === me.lastactwindow && act_win == me.accountAndSearchCombo )
						return;

					if ( null !== me.lastactwindow )
					{
						desktop.restoreWindows();
						var lastactive = Ext.getCmp(me.lastactwindow);
						if ( 'undefined' != typeof lastactive )
							lastactive.toFront();
						me.lastactwindow = null;
					}
					else
					{
						if ( act_win.modal ) return;

						me.lastactwindow = act_win.id;
						desktop.minimizeWindows();
					}
				}
				,stopEvent:true
			});

			// Map 'i' key -> show/hide tiles
			new Ext.KeyMap(Ext.get(document), {
				key:'I'
				,fn:function(e){
					if ( 'password' == document.activeElement.type || 'text' == document.activeElement.type || 'textarea' == document.activeElement.type ) return;
						   $('#app-icongrid-opener').click();
				}
				,stopEvent:true
			});
		}

		,onMaintenance : function () {
			CasaDesk.modules.Maintenance.createWindow();
		}

		,onMTMmaint : function () {
			CasaDesk.modules.MTMmaint.createWindow();
		}

		,onSettingsMenu: function (e) {
			var menu = CasaUtil.userSettings.settingsMenu;
			menu.showAt([e.clientX, e.clientY]);
			menu.shownX = e.clientX;
			menu.shownY = e.clientY;
		}

		,onSmileyFace : function ()
		{
			var   url = '/casa/toolsandutils/rss/index.php';
			var   smiley_dialog = $('#smiley-dialog') ;

			$.ajax ({
				cache:true,
		   url: url,
		   success: function(data) {
			   smiley_dialog.dialog({
				   modal: false,
				   width:400, height:'auto',
				   height: 'auto',
				   title: 'Fact of the day',
				   show: { effect:'drop',direction:'down' },
				   open: function()
				   {
					   $(this).closest('.ui-dialog').find('.ui-dialog-titlebar-close').hide();
				   },
				   buttons:  [
				   { text: 'Ok', click: function() { $(this).dialog('close'); }}
				   ,{ text: 'More facts...', click: function() { $(this).dialog('close'); CasaDesk.onSmileyFace(); } }
				   ]
			   });
			   smiley_dialog.html(data);
		   }
			});
		}

		,logout : function () {
			CasaDesk.removePopupWins();
			document.location.href = '/casa/index.php?action=Logout';
		}

		,openIconGrid : function ()
		{
			var iconGrid = $('#app-icongrid');
			var zmgr = CasaDesk.desktop.getDesktopZIndexManager();
			var limit = isSet(zmgr) ? zmgr.getActive().getEl().zindex + 1000 : 1000;

			if ( iconGrid.is(':visible') && iconGrid.css('z-index') < limit )
			{
				CasaDesk.bringMeToFront( 'app-icongrid' );
			}
			else
			{
				CasaDesk.bringMeToFront( 'app-icongrid' );

				iconGrid.toggle( 'drop', { direction:'down' }, 500 );
			}
		}

		,updateRedCircle : function () {
			var me = this;

			$.ajax({
				type: 'POST',
		  timeout: 2000,
		  url:  '/casa/common/RedCircle.php',
		  data: {'accountid': ACCOUNTID, 'whataction':'getcount' },
		  dataType: 'json',
		  success: function(data)
		  {
			  for (var i=0; i< data.numrows; i++ )
			  {
				  var iconID   = data.root[i].id;        //get id
				  var cntr     = parseInt( data.root[i].num );       //get num
				  var content  = data.root[i].content;   //get content
				  var divID    = iconID + '-red-circle';

				  if (cntr > 0 && !isNaN(cntr))
				  {
					  var oldCount = $('#'+iconID).attr('redcircle_count');
					  $('#'+iconID).attr('redcircle_count', cntr);

					  $('#'+divID).html('<div style=\"padding-top:3px\">' + cntr.toString() + ' </div>' );
					  $('#'+divID).show();
					  $('#'+divID).qtip({
						  content: { text : content }
						  ,title: {
							  text: ''
							  ,button: 'Close' // Close button
						  }
						  ,style: {
							  classes: 'survqtipMaxSize forceZIndex qtip-bootstrap'
						  }
						  ,show : {
							  effect: function() { $(this).slideDown(200); } // Show
							  ,event: 'click'
						  }
						  ,hide: { event : 'unfocus' }
						  ,events: {
							  hide : function(event){ $('#app-icongrid').on( 'mouseenter', me.gridMouseEnter ); }
						  }
					  });

					  $('#'+divID).bind('click', function(event){ event.preventDefault(); $('#app-icongrid').off( 'mouseenter' ); return false; });

					  if ( -1 != iconID.indexOf('portfolio') && oldCount != cntr )
					  {
						  me.favicon.badge(cntr);
					  }
				  }
				  else
				  {
					  $('#'+divID).hide();  // hide red circle
					  $('#'+iconID).attr('redcircle_count', 0);

					  if ( -1 != iconID.indexOf('portfolio') )
					  {
						  me.favicon.badge(0);
					  }
				  }
				  $('#'+iconID).attr('content',  content);
			  }
		  }
			})
		}

		,gridMouseLeave : function () {
			$(this).css('background-color','' );
		}

		,gridMouseEnter : function () {
			$(this).css('background-color','rgba(0, 0, 0, 0.18)');
			CasaDesk.checkNewFavoriteAction();
			CasaDesk.updateRedCircle();
		}

		,desktopAccountMenu : null

		,createCasaSearchAndNews : function()
		{
			var me = this;

			var mwidth = 255;

			me.desktopAccountMenu = createGroupedCombo( 'desktopaccountname', null, 'accountname', 'accountname', mwidth, [ 'accountid' ] );
			me.desktopAccountMenu.addListener( 'select', CasaDesk.desktopSwitchFundHandler );
			me.desktopAccountMenu.store.on('load', function(s, records, successful, eOpts)
			{
				if ( successful && me.switchFundKeymap.length == 0 )
					me.buildSwitchFundKeymap();
			});

			me.desktopAccountMenu.store.load();
			me.desktopAccountMenu.setValue( AccountIdLong[ ACCOUNTID ] );

			var combo = CasaFields.createCombo
			({
				type         : 'autoComplete'
				,url         : '/casa/common/Completer.php'
				,storeAction : 'completion'
				,name        : 'casa-search-field'
				,listRoot    : 'tickerlist'
				,width       : mwidth
				,otherFields : [ 'type', 'dealname', 'securityname' ]
				,showLens    : true
			});
			combo.on( 'select', function( combo, record, itemno )
			{
				combo.suspendEvents(false);
				// if the value is nota deal name use it anyway (it might be a predefined search)
				if (combo.getValue() == '')
					combo.setValue(combo.lastQuery);
				CasaUtil.showSearchResults( combo, record[0] );
			});

			combo.style = { marginBottom: '-0.5px' };

			me.accountAndSearchCombo = Ext.create('Ext.window.Window', {
				header: false
				,width: mwidth+10
				,resizable : false
				,layout: 'column'
				,items: [
				me.desktopAccountMenu
				,combo
				]
				,onEsc : Ext.emptyFn // prevents close on ESC
				,listeners : {
					boxready : function() {
						$(window).resize( function() {
							me.accountAndSearchCombo.alignTo(Ext.getBody(), 'tr-tr', [-5, 5]);
						});
					}
				}
			})

			me.handleIconGridZidx(me.accountAndSearchCombo);
			me.accountAndSearchCombo.show();

			me.addOnWindows.add(me.accountAndSearchCombo);

			if ( CASA_NEWS_FEED )
			{
				// WebNews.createCrcNewsFeed(false, true); // function( closable, collapsed )
				WebNews.createCrcNewsFeed();
				me.handleIconGridZidx(WebNews.crcNewsFeed);
				WebNews.crcNewsFeed.LOAD(true);
				// Previous code: create it collapsed and use "WebNews.crcNewsFeed.show()" with LOAD() inside boxready

				me.addOnWindows.add(WebNews.crcNewsFeed);
			}

			$(window).resize();
		}

		,bringMeToFront : function ( myID ) {
			var me = this;
			var zmgr = me.desktop.getDesktopZIndexManager();
			if ( !isSet(zmgr) )
				return;

			var actEl   = zmgr.getActive();
			if ( !isSet(actEl) )
				return;

			var activeZ = actEl.getEl().zindex;
			$('#' + myID).css('z-index', activeZ + 1000);
		}

		,bringMeToBack : function ( myID ) {
			var me = this;

			if( myID.indexOf("icongrid") > -1 )
			{
				$('#' + myID).css('z-index',1000);
				return;
			}

			var zmgr = me.desktop.getDesktopZIndexManager();
			if ( !isSet(zmgr) )
				return;

			var activeZ = zmgr.getActive().getEl().zindex;
			var myID_Z  = parseInt($('#' + myID).css('z-index'));

			// a value of 10000 will most likely drop the component under 2 most current windows
			// since we use this function for the casa-search element this is OK. For a window it would be too much
			if ( activeZ - 10000 < myID_Z ){
				$('#' + myID).css('z-index', activeZ - 10000);
			}
		}

		,createCasaWindow : function( config, persist ) {
			persist = isSet( persist ) ? persist : false;
			var me = this;

			var win = null;

			if ( isSet(config.addZoomTools) && config.addZoomTools )
			{
				config.closable = false;
			}

			if ( !isSet(config.addTaskButton) )
				config.addTaskButton = true;

			// to disable the ghost window and shadow (it creates problems with 'scaling' on smaller screens)
			config.ghost = false;
			config.click = function() {
				var me = Ext.getElementById(this.id);
				if ( 'function' == typeof $ && 'function' == typeof $(me).click )
					$(me).click();
			};

			config.onEsc = function() {
				if ( 'password' == document.activeElement.type || 'text' == document.activeElement.type || 'textarea' == document.activeElement.type )
					return;
				this.close();
			}

			win = this.getDesktop().createWindow( config );

			win.ZOOM = function(scale) {
				var thewindiv = this.getEl();
				if ( !isSet(thewindiv) )
					return;

				thewindiv = thewindiv.dom;

				var myBrowser = CasaUtil.detectBrowser();

				if ( 'Firefox' == myBrowser.appName )
				{
					$(thewindiv).css('position','absolute'); // window
					$(thewindiv).css('-moz-transform-origin','0 0');
					$(thewindiv).css('MozTransform','scale(' + scale + ')');
				}
				else if ( 'Chrome' == myBrowser.appName || 'Safari' == myBrowser.appName )
				{
					$(thewindiv).css('position','absolute'); // window
					$(thewindiv).css('-webkit-transform-origin','0 0');
					$(thewindiv).css('-webkit-transform','scale(' + scale + ')');
				}
				else
				{
					$(thewindiv).css('position','absolute'); // window
					$(thewindiv).css('-ms-transform-origin','0 0');
					$(thewindiv).css('-ms-transform','scale(' + scale + ')');
				}

				this.el.disableShadow();
				this.zoomLevel = scale;
			}

			if ( isSet(config.addZoomTools) && config.addZoomTools )
			{
				win.on('afterRender', function(){
					me.addZoomTools(win);
				});
			}

			CasaUtil.addCheckOnClose( win );

			win.on('close', function() {
				me.removeDesktopWindow( win.getItemId() );
			});

//			SCALING IF APPLYING ZOOM ON boxready
//			==========================================
// 			var scale = 1;
// 			var step  = 0.02;
//
// 			while ( win.width * (scale - step) > Ext.getBody().getViewSize().width || win.height * (scale - step) > Ext.getBody().getViewSize().height )
// 			{
// 				scale = scale - step;
// 			}
// 			scale = scale - step;
			
			win.on('boxready', function() {
				Ext.defer(function() { 
					if ( win.width > Ext.getBody().getViewSize().width )
					{
						win.setWidth(Ext.getBody().getViewSize().width -22 ); 
						win.setX(3);
					}
					if ( win.height > Ext.getBody().getViewSize().height - win.getY() )
					{
						win.setHeight( Ext.getBody().getViewSize().height -20 ); 
						win.setY(5);
					}
				}, 100 );
			});

			me.handleIconGridZidx(win);

			if ( null != win )
			{
				if ( persist )
				{
					this.transientListPersist.push( win );
				}
				else
				{
					this.transientList.push( win );
				}
			}

			return win;
		}

		,addZoomTools : function (win)
		{
			win.addTool({
				type: 'up',
				handler: function(event, toolEl, panel, tc) {
					var scale = 1.02;
					if ( isSet(win.zoomLevel) )
						scale = win.zoomLevel + 0.02;

					win.ZOOM(scale);
				},
				qtip: 'Zoom up'
			});

			win.addTool({
				type: 'down',
				handler: function(event, toolEl, panel, tc) {
					var scale = 0.98;
					if ( isSet(win.zoomLevel) )
						scale = win.zoomLevel - 0.02;

					win.ZOOM(scale);
				},
				qtip: 'Zoom down'
			});

			win.addTool({
				type: 'close',
				handler: function(event, toolEl, panel, tc) {
					win.close();
				}
			});
		}

		,handleIconGridZidx : function (win) {
			var iconGrid = $('#app-icongrid'), me = this;
			if ( iconGrid.length )
			{
				win.on('afterRender', function(){
					var windiv = Ext.getElementById(win.id);
					$(windiv).click(function() {
						me.bringMeToBack('app-icongrid');
						me.bringMeToBack('crc-fund-menu');
					});
					var execute = "$(Ext.getElementById('" + win.id + "')).click()";
					setTimeout(execute, 100);
				});
			}
		}

		,getDesktopWindow : function (name) {
			for ( var ii=0 ; ii<this.transientList.length ; ii++ )
			{
				var win = this.transientList[ii];

				if ( win.getItemId() == name )
				{
					return win;
				}
			}

			for ( var ii=0 ; ii<this.transientListPersist.length ; ii++ )
			{
				var win = this.transientListPersist[ii];

				if ( win.getItemId() == name )
				{
					return win;
				}
			}

			return null;
		}

		,removeDesktopWindow : function (name) {
			for ( var ii=0 ; ii<this.transientList.length ; ii++ )
			{
				win = this.transientList[ii];

				if ( win.getItemId() == name )
				{
					this.transientList.splice( ii, 1 );
					return;
				}
			}

			for ( var ii=0 ; ii<this.transientListPersist.length ; ii++ )
			{
				win = this.transientListPersist[ii];

				if ( win.getItemId() == name )
				{
					this.transientListPersist.splice( ii, 1 );
					return;
				}
			}
		}

		,removeTransients : function () {
			var obj, ret = true;

			if ( 0 != this.transientList.length )
			{
				for ( var ii = this.transientList.length - 1 ; ii >= 0 ; ii-- )
				{
					obj = this.transientList[ii];

					if ( typeof obj != 'undefined' )
					{
						ret = ret && obj.fireEvent('beforeclose');

						if ( !ret )
							break;

						if ( typeof obj.close == 'function' )
							obj.close();
					}
				}
			}

			if ( 0 != this.transientListPersist.length && ret )
			{
				for ( var ii = this.transientListPersist.length - 1 ; ii >= 0 ; ii-- )
				{
					obj = this.transientListPersist[ii];

					if ( typeof obj != 'undefined' )
					{
						ret = ret && obj.fireEvent('beforeclose');

						if ( !ret )
							break;
					}
				}
			}

			return ret;
		}

		,openFundPerformance : function ()
		{
			this.fundPerformance.createCasaWindow();
		}

		,openDesktopModule : function ( name )
		{
			var module  = this.getModule(name);

			if ( 'function' == typeof module.createWindow )
			{
				module.createWindow();
			}
		}

		,showCasaModule : function ( name, acctid, acctname ) {
			if ( ACCOUNTID != acctid )
				this.switchCasaFund( { acctid : acctid, acctname : acctname } );

			if ( '' == name )
			{
				Ext.Msg.alert( 'Empty', 'Module name was not provided' );
				return;
			}
			this.openDesktopModule(name);
		}

		,adjustIconGridPosition : function(displayArea) {
			var appicongrid = $('#app-icongrid');
			if ( appicongrid.is(":visible") ) {
				var ig_x     = appicongrid.position().left;
				var min_x    = displayArea.position().left + displayArea.width() + 15;
				var ig_width = appicongrid.width() + 16;
				if ( min_x+ig_width  > window.innerWidth )
					min_x = window.innerWidth-ig_width;

				var new_y = appicongrid.position().top;
				if ( ig_x < min_x )
					appicongrid.animate({ top: new_y + 'px', left: min_x + 'px'}, 300 );
			}
		}
		
		,populateDisplayArea : function ( params )
		{
			if ( 'string' != typeof params.d_area || '' == params.d_area )
				return;

			if ( 'undefined' == typeof params.accountid )
				params.accountid = ACCOUNTID;
			
			var displayArea = $( '#' + params.d_area );
			switch ( params.action )
			{
				case 'casa-fund-summary':
					$.ajax
					({
						url			:	'/casa/common/CasaSummary.php'
						,type		:	'POST'
						,data		:	params
						,success	:	function( response )
						{
							displayArea.html( response );
						}
					});
					break;
					
				case 'casa-all-summary-prepare':
					displayArea.addClass('accountid-details');
					displayArea.height(window.innerHeight - 300);
					displayArea.css('overflow', 'auto');
					displayArea.on('show', function() { 
						CasaDesk.populateDisplayArea({d_area:'casa-display-area',action:'casa-all-summary'});
					});
					break;
					
				case 'casa-all-summary':
					if ( displayArea.attr('hasresults') == '0' )
					{
						$.ajax ({
							url			:	'/casa/common/CasaSummary.php'
							,type		:	'POST'
							,data		:	params
							,success	:	function( response )
							{
								displayArea.html( response );
								displayArea.attr('hasresults','1');
								CasaDesk.adjustIconGridPosition( displayArea );
							}
						});
					}
					else
					{
						CasaDesk.adjustIconGridPosition( displayArea );
					}
					break;
				/* ----------------------------------------------------------------------------------------------------------- */
				case 'display-crc-pic':
					var me = ( 'undefined' == typeof params.me ) ? this : params.me;
					if ( null === me.imageHolder && isSet(me.ANNIVERSARYPICS) && [] != me.ANNIVERSARYPICS )
					{
						displayArea.html( '' );
						me.imageHolder = Ext.create('Ext.Img', {
							src: ''
							,notVisible : false
							,renderTo: Ext.get(params.d_area)
							,imgCls : 'imageborder'
							,listeners : {
								afterrender: function() {
									setTimeout(this.showBanner, 1500);
								}
							}
							,showBanner : function() {
								if ( isSet(me.ANNIVERSARYPICS) && 0 != me.ANNIVERSARYPICS.length )
								{
									displayArea.css('top', new_y + 50 );
									displayArea.click(function(){
										if ( !me.imageHolder.notVisible )
											me.imageHolder.setMyImg();
									});
								}
							}
							,cycleFn : null
							,lastIdx : 0
							,baseDir : me.casaConfig.picsBaseDir
							,kill : function( forever ) {
								clearTimeout(me.imageHolder.cycleFn);
								me.imageHolder.el.fadeOut({
									duration: 0.1,
								scope: this
								,callback: function(){ me.imageHolder.notVisible = true; }
								});

								if ( forever )
								{
									$('#casa-banner-area').hide();
									$('#casa-btn-area').hide();
									SetDBValue( " UPDATE uiconfigdb.config_user SET removeslideshow = '1'  WHERE userid = '" + CASA_USER.toLowerCase() + "' " );
								}
							}
							,setMyImg : function( file, btnEl ) {
								if ( me.imageHolder.isDestroyed )
									return;

								var holder = me.imageHolder;
								if (isSet(btnEl))
								{
									var fromBtn = $(btnEl);
									if ( -1 != fromBtn.text().indexOf('Hide') )
									{
										holder.kill();
										fromBtn.text('Show Memory Lane');
										return;
									}
									else
									{
										fromBtn.text('Hide Memory Lane')
									}
								}

								clearTimeout(holder.cycleFn);
								holder.el.fadeOut({
									duration: 0.001,
									scope: this
									,callback: function(){ me.imageHolder.notVisible = true; }
								});

								if ( 'string' != typeof file )
								{
									if ( isSet(me.ANNIVERSARYPICS) && 0 != me.ANNIVERSARYPICS.length )
									{

										var idx = holder.lastIdx++;
										if ( idx >= me.ANNIVERSARYPICS.length )
										{
											idx = 0;
											holder.lastIdx = 1;
										}

										file = holder.baseDir + me.ANNIVERSARYPICS[idx];
									}
								}

								if ( 'string' != typeof file )
									return;

								holder.setSrc(file);
								setTimeout(holder.resizeImg, 400);

								holder.cycleFn = setTimeout( me.imageHolder.setMyImg, me.casaConfig.casaDisplayAreaRefresh * 1000 );
							}
							,resizeImg : function() {
								var holder = me.imageHolder;
								var imageSize = { width : holder.imgEl.dom.width, height : holder.imgEl.dom.height },
								ratio = 0;

								imageSize.first  = ( imageSize.height > imageSize.width ) ? 'height' : 'width';
								imageSize.second = ( imageSize.first == 'width' ) ? 'height' : 'width';

								panelSize = holder.panelSize;

								// resize the image to fit in the panel with the correct ratio
								if (imageSize[imageSize.first] != panelSize[imageSize.first]) {
									ratio = panelSize[imageSize.first] / imageSize[imageSize.first];
									imageSize[imageSize.first]  = panelSize[imageSize.first];
									imageSize[imageSize.second] = imageSize[imageSize.second] * ratio;
								}

								holder.setSize(imageSize.width, imageSize.height);
								holder.el.fadeIn({
									duration: 1000,
						scope: this
						,callback: function(){ me.imageHolder.notVisible = false; }
								});


								var appicongrid = $('#app-icongrid');
								if ( appicongrid.is(":visible") ) {
									var ig_x     = appicongrid.position().left;
									var min_x    = displayArea.position().left + displayArea.width() + 20;
									var ig_width = appicongrid.width() + 16;
									if ( min_x+ig_width  > window.innerWidth )
										min_x = window.innerWidth-ig_width;

									var new_y = appicongrid.position().top;
									if ( ig_x < min_x )
										appicongrid.animate({ top: new_y + 'px', left: min_x + 'px'}, 300 );
								}
							}
							,panelSize : {
								width : 600
								,height : 600
							}
						});

						me.imageHolder.el.fadeOut({
							duration: 0.1,
								scope: this
								,callback: function(){ me.imageHolder.notVisible = true; }
						});
					}
					break;
					/*-------------------------------------------------------------------------------------------------------------------- */

					default: /* clear-all-summary */
						displayArea.removeClass('accountid-details');
						displayArea.attr('hasresults','0');
						displayArea.html( '' );
						displayArea.hide();
						break;
			}
		}
		
		// New function for the "Google Search" feature on the Switch Funds menu
		// This function takes parameters for both:
		// 1) CasaDesk.switchCasaFund()
		// 2) CasaUtil.showCasaComponent()
		// *** NOTE ***
		// There is a timing problem with calling these two functions in sequence.
		// If all the actions triggered by switchCasaFund() have not completed
		// by the time showCasaComponent() is called, there could be both javascript
		// and PHP errors.
		// SO: setTimeout() is used until such a time when a callback can be added
		// to switchCasaFund() and trigger the showCasaComponent() in a timely fashion.
		,switchFundLoadTicker	:	function( params )
		{
			var me = this;
			var onAfterSwitchFund = function () {
				CasaUtil.showCasaComponent
				(
					params['what']
					,params['deal']
					,params['ticker']
					,params['ccy']
					,params['type']
					,params['position}']
					,params['coupon']
				)
				me.removeListener('afterswitchfund', onAfterSwitchFund);
			};
			
			me.on('afterswitchfund', onAfterSwitchFund);
			
			// Start switching the casa fund
			me.switchCasaFund( params );
		}

		,switchCasaFund : function ( params )
		{
			var me        = ( 'undefined' == typeof params.me ) ? this : params.me;
			var acctid    = params.acctid;
			var acctname  = params.acctname;
			
			params.d_area = params.action = 'casa-fund-summary';
			me.populateDisplayArea( params );

			params.d_area = 'casa-display-area';
			switch ( me.casaConfig.casaDisplayArea )
			{
				case 'allfundsummary':
					if ( acctid == 'pancrc' )
					{
						params.action = 'casa-all-summary-prepare';
						me.populateDisplayArea( params );
					}
					else
					{
						params.action = 'clear-all-summary';
						me.populateDisplayArea( params );
					}
					break;
				case 'crcpics':
					params.action = 'display-crc-pic';
					me.populateDisplayArea( params );
					break;
			}

			var proceed = me.fireEvent('beforeswitchfund');
			if ( !proceed )
			{
				CasaUtil.resumeFn = { scope: me, fname : 'switchCasaFund', params : params };
				Ext.getCmp('desktopaccountname').setValue(ACCOUNTNAME);
				return;
			}

			document.title = acctid.toUpperCase() + '-Casa Applications';
			if ( CASA_USER.toLowerCase() == 'demo' )
			{
				acctidshort = acctname;
				document.title = 'Demo-Casa Applications';
			}

			ACCOUNTID			= acctid;
			ACCOUNTNAME			= acctname;
			ACCOUNTSTARTDATE	= AccountIdStart[acctid];

			// Execute switchFund for persistent windows/modules
			if ( 0 != this.transientListPersist.length )
			{
				for ( var ii = this.transientListPersist.length - 1 ; ii >= 0 ; ii-- )
				{
					obj = this.transientListPersist[ii];
					if ( 'function' == typeof obj.switchFund )
					{
						obj.switchFund();
					}
				}
			}

			// Set Background Wallpaper.  Depending on the image, the background can be 'tiled' or 'stretched'
			// -----------------------------------------------------------------------------------------------
			GetDBValue( "SELECT wallpaper_style FROM crcadmin.managed_account where accountid = '" + ACCOUNTID + "'"
				,[
				{ name : 'wallpaper_style', mapping : 'wallpaper_style'}
				]

				,function( record, options, success)
				{
					var wallpaper_style = record[0].data['wallpaper_style'];
					var desktop = Ext.getCmp('desktop-desktop');
					desktop.setWallpaper("/casa/images/wallpaper/wallpaper-" + acctid + ".jpg?" + CASA_VERSION,
										(wallpaper_style != "tiled")   );
				}
			);
			// -----------------------------------------------------------------------------------------------
			nhours = parseInt(CEXP);
			setCookie('crcAccountID', acctid, nhours);

			if (ACCOUNTNAME != Ext.getCmp('desktopaccountname').getValue())
				Ext.getCmp('desktopaccountname').setValue(ACCOUNTNAME);


			// read account currency for that fund and set global variable ACCOUNTCCY
			CasaUtil.getAccountInfo(ACCOUNTID, function( record, options, success ) {
				ACCOUNTCCY         = record[0].data['accountccy'];
				ACCOUNTGROUP       = record[0].data['groupid'];
				ACCOUNTSTARTDATE   = record[0].data['fundstartdate'];
				CasaDesk.desktopAccountMenu.includeNewTradesAllocation = record[0].data['incl_newtrade_allocation'];
			});

			// Loop thru all the modules and run their switchFund routine.
			Ext.iterate(me.modules, function(key, m) {
				if ( typeof m.switchFund == 'function' ) m.switchFund();
			});

			// Show / hide / enable / disable menu entries
			me.handleFundMenus();

			// Casa Menus overrides
			GetDBValue(" SELECT * FROM casamenuapps.casamenu_items_override WHERE accountid = '" + ACCOUNTID + "'"
				,[
				    { name : 'accountid', mapping : 'accountid'}
				    ,{ name : 'itemid', mapping : 'itemid'}
				    ,{ name : 'whichmenu', mapping : 'whichmenu'}
				    ,{ name : 'override', mapping : 'override'}
				]

				,function( record, options, success)
				{
				    if ('undefined' == typeof record )
					return;

				    record.forEach(function(ovr){
					me.handleMenuOverride(ovr);
				    });
				}
			);

			CasaDesk.updateRedCircle();
			
			CasaDesk.fireEvent('afterswitchfund');
		}

		,handleMenuOverride : function ( ovr )
		{
			var itemId = ovr.get('itemid'), whichmenu = ovr.get('whichmenu'), handler = null, menuitem, me = this;
			var OVR = ovr.get('override').split('|');
			var METHOD = OVR[0].split(':');

			switch ( METHOD[0] )
			{
				case 'window':
				case 'windowpersist':
					handler = me.createUrlHandler(METHOD, OVR[1], itemId);
					break;

				case 'js':
					handler = function() {
						eval(OVR[1])
					};
					break;


				case 'module':
					handler = function() {
						CasaDesk.openDesktopModule( OVR[1] );
					};
			}

			switch ( whichmenu )
			{
				case 'all':
				case 'startmenu':
					menuitem = me.desktop.taskbar.startMenu.queryById(itemId);
					if ( isSet(menuitem) && isSet(menuitem.handler) )
						menuitem.handler = handler;
					if ('all' != whichmenu) break;

				case 'all':
				case 'rightclick':
					me.contextMenu_items.forEach(function(item) {
						if ( 'object' != typeof item )
							return;

						if ( item.itemId == itemId || 'object' == typeof item.menu )
							me.contextMenuOverride( itemId, item, handler );
					});
					if ('all' != whichmenu) break;

				case 'all':
				case 'icongrid':
					var appIcon = $('#app-icongrid .app-icongrid-icon[itemid="' + itemId + '"]');
					if ( appIcon.length && '1' == appIcon.attr('isEnabled') )
					{
						appIcon.unbind('click');
						appIcon.click(handler);
					}
					if ('all' != whichmenu) break;

				case 'all':
				case 'favicons':
					var appIcon = $('#app-desktop-favorites .app-favorite-icon[item_id=' + itemId + ']');
					if ( appIcon.length && '1' == appIcon.attr('isEnabled') )
					{
						appIcon.unbind('click');
						appIcon.click(handler);
					}
					break;
			}
		}

		,contextMenuOverride : function (itemId, item, handler)
		{
			var me = this;
			if ( 'object' == typeof item.menu )
			{
				item.menu.forEach(function(subitem) {
					if ( 'object' != typeof subitem )
						return;

					if ( subitem.itemId == itemId || 'object' == typeof subitem.menu )
						me.contextMenuOverride( itemId, subitem, handler );
				})
			}
			else
			{
				item.handler = handler;
			}
		}

		,handleFundMenus : function ()
		{
			var me = this;

			// Start Menu -- Apps section (right)
			me.startMenu_items.forEach(function(item) {
				if ( 'object' != typeof item )
					return;

				var ACCOUNTS = item.accounts.split('|');
				var USERS    = item.users.split('|');
				var show = (( ACCOUNTS.indexOf(ACCOUNTID) != -1 ) || ( ACCOUNTS.indexOf('all') != -1 && ACCOUNTS.indexOf('!'+ACCOUNTID) < 0 )) && (( USERS.indexOf(CASA_USER.toLowerCase()) != -1 ) || ( USERS.indexOf('all') != -1 && USERS.indexOf('!'+CASA_USER.toLowerCase()) < 0 ));

				var menuitem = me.desktop.taskbar.startMenu.queryById(item.itemId);

				if ( show )
				{
					menuitem.show();
					menuitem.handler = menuitem.handler_base;
				}
				else
					menuitem.hide();
			});

			// Start Menu -- Modules section (left)
			me.desktop.taskbar.startMenu.menu.items.items.forEach(function(item) {
				var found = me.casaModules_shortcuts.find(function(el){
					if ( el.itemid == item.itemId ) return el;
				});

				if ( isSet(found) )
				{
					var ACCOUNTS = found.accountid.split('|');
					var USERS    = found.users.split('|');
					var enable = ( ACCOUNTS.indexOf(ACCOUNTID) != -1 ) || ( ACCOUNTS.indexOf('all') != -1 && ACCOUNTS.indexOf('!'+ACCOUNTID) < 0 ) && (( USERS.indexOf(CASA_USER.toLowerCase()) != -1 ) || ( USERS.indexOf('all') != -1 && USERS.indexOf('!'+CASA_USER.toLowerCase()) < 0 ));

					enable ? item.enable() : item.disable();
				}
				else
				{
					item.disable();
				}
			});

			// Context Menu
			me.contextMenu_items.forEach(function(item) {
				if ( 'object' != typeof item )
					return;

				me.contextMenuShowHide ( item, me.desktop.contextMenu, me );
			});



			me.showHideMyFavs();

			// Desktop Apps
			me.app_iconGrid_items.forEach(function(item) {
				var ACCOUNTS = item.accounts.split('|');
				var USERS    = item.users.split('|');
				var enable = ( ACCOUNTS.indexOf(ACCOUNTID) != -1 ) || ( ACCOUNTS.indexOf('all') != -1 && ACCOUNTS.indexOf('!'+ACCOUNTID) < 0 ) && (( USERS.indexOf(CASA_USER.toLowerCase()) != -1 ) || ( USERS.indexOf('all') != -1 && USERS.indexOf('!'+CASA_USER.toLowerCase()) < 0 ));
				var appIcon = $('#app-icongrid .app-icongrid-icon[itemid="' + item.itemId + '"]');

				if ( enable )
				{
					appIcon.unbind('click');
					appIcon.click(appIcon[0].handler_base);
					appIcon.qtip('destroy',true);
					appIcon.attr('isEnabled', '1');
				}
				else
				{
					appIcon.unbind('click');
					appIcon.attr('isEnabled', '0');
					appIcon.qtip({
						content: 'This feature is not available for<BR>' + ACCOUNTNAME,
						position: {
							target: 'mouse',
						adjust: { x: 20,  y: 20 }
						},
						style: {
							classes: 'forceZIndex qtip-youtube'
						}
					});
				}
			});
		}

		,contextMenuShowHide  : function ( item, parent, me )
		{
			var ACCOUNTS = item.accounts.split('|');
			var USERS    = item.users.split('|');
			var show = ( ACCOUNTS.indexOf(ACCOUNTID) != -1 ) || ( ACCOUNTS.indexOf('all') != -1 && ACCOUNTS.indexOf('!'+ACCOUNTID) < 0 ) && (( USERS.indexOf(CASA_USER.toLowerCase()) != -1 ) || ( USERS.indexOf('all') != -1 && USERS.indexOf('!'+CASA_USER.toLowerCase()) < 0 ));
			var menuitem = parent.queryById(item.itemId);

			if ( show )
			{
				if ("favoritesMenu" == menuitem.menuParent)
				{
					menuitem.enable();
					menuitem.handler = menuitem.handler_base;
				}
				else
					menuitem.show();

				if ( 'object' == typeof menuitem.menu )
				{
					menuitem.menu.items.items.forEach(function(subitem) {
						if ( 'object' != typeof subitem )
							return;

						me.contextMenuShowHide ( subitem, menuitem.menu, me );
					})
				}
			}
			else
			{
				if ("favoritesMenu" == menuitem.menuParent)
					menuitem.disable();
				else
					menuitem.hide();
			}
		}
		
		,buildSwitchFundKeymap : function ()
		{
			var     me = this;
			var     store = Ext.getCmp( 'desktopaccountname' ).store;
			var     n_funds = store.count();

			for ( var ii=0 ; ii<n_funds ; ii++ )
			{
				var     RECORD = store.getAt( ii );

				// Ignore shortcuts for group titles
				if ( RECORD.data.isgroup == '1' )
					continue;

				var     fundid   = RECORD.data.accountid;
				var     shortcut = RECORD.data.shortcut;

				if ( !isSet( shortcut ) )
				{
					shortcut = "~";
				}

				this.switchFundKeymap[ shortcut ] = fundid;
			}
			
			// Defined at the bottom of this file
			var mapper = new CRCKeyMapper
			({
				map				:	me.switchFundKeymap
				,event			:	"keydown"
				,delay			:	500
				,element		:	document
				,callback 		:	function( fundid )
				{
					CasaDesk.switchCasaFund
					({
						acctid		: fundid
						, acctname	: AccountIdLong[ fundid ]
					});
				}
			});
		}

		,desktopSwitchFundHandler : function ( combo, record, opt ) {
			var accountid   = record[0].data.accountid;
			CasaDesk.switchCasaFund( { acctid : accountid, acctname : AccountIdLong[ accountid ] } );
		}

		,checkCasaVersion : function ()
		{
			var me = this;

			Ext.Ajax.request ({
				url		: '/casa/checkCasaVersion.php',
				callback	: function( fnc, success, response )
				{
					setTimeout( function() { me.checkCasaVersion(); }, 1000 * 3600 * me.casaConfig.versionCheckHours );
					var responseObj;
					
					try {
						responseObj = Ext.JSON.decode(response.responseText);
					}
					catch(err) {
						responseObj = { success : 'true', msg : 'INVALID-LOGIN' };
					}
					
					if ( 'undefined' == typeof responseObj )
					{
						responseObj = { success : 'true', msg : 'INVALID-LOGIN' };
					}
					
					if ( responseObj.success == false )
					{
						HandleJsonFailure(null, responseObj);
						return;
					}

					if ( responseObj.msg == 'INVALID-LOGIN' )
					{
						setTimeout( function() {
							me.desktop.taskbar.disable();
							CasaUtil.handleInvalidLogin({forgotLink:true, callback:function(){me.desktop.taskbar.enable();}, redirect:'/casa/'});
						}, 600 );
						return;
					}

					if ( responseObj.msg == 'isDEV' ) return;

					if ( CASA_VERSION != responseObj.msg ) {
						setCookie('skipcasacheck','true',24);
						setTimeout( function() {
							Ext.Msg.show({
								title:'Casa Version',
								msg: 'There is an updated version of Casa. Would you like to refresh your Casa Environment?',
								buttons: Ext.Msg.OKCANCEL,
								fn: me.processCheckCasaVersion,
								icon: Ext.MessageBox.QUESTION
							});
						}, 250 );
					}
				}
			});
		}

		,processCheckCasaVersion : function (answer)
		{
			if ('ok' == answer )
			{
				DeleteCookie('skipcasacheck');
				CasaDesk.refreshCasa();
			}
		}

		,refreshCasa : function () {
			this.removePopupWins();
			var dataString = 'accountid=' + ACCOUNTID;
			var newURL = window.location.protocol + '//' + window.location.host + '/casa/desktop.php?' + dataString;

			UrlPopup(newURL, '_self');
		}

		,removePopupWins : function () {
			for ( var ii in this.popupList )
			{
				if ( typeof( isSet(this.popupList[ii]) && this.popupList[ii].close ) == 'function' )
					this.popupList[ii].close();
			}
			this.popupList = new Array();
		}

		,OpenDesktopWindow : function ( url, features, persistent, id_from )
		{
			var standalone = '1';
			if ( 'object' == typeof url )
			{
				if ( isSet( url.features ) )
					features = url.features;
				if ( isSet( url.persistent ) )
					persistent = url.persistent;
				if ( isSet( url.id_from ) )
					id_from = url.id_from;
				if ( isSet( url.standalone ) )
					standalone = url.standalone;
				url = url.url;
			}
			
			if ( !isSet( persistent ) )
				persistent = false;

			if ( !isSet( features ) )
				features = 'width=1200, height=800, left=10, top=20, scrollbars=yes, resizable=yes';

			var winURL = url.split('?');
			
			var url_extra =  "?intranet=1&standalone=" + standalone + "&accountid=" + ACCOUNTID;
			if ( isSet(id_from) )
			{
				var isFav = (this.userFavoritesIDs.indexOf(id_from) != -1) ? '1' : '0';
				url_extra += "&favshortcut=" + id_from + "&isCasaFav=" +isFav;
			}
			if ( 'undefined' != typeof winURL[1] )
			{
				url_extra += "&" + winURL[1];
			}

			var win = UrlPopup(winURL[0] + url_extra, winURL[0], features );

			if ( ISCASA && !persistent )
			{
				this.popupList.push(win);
			}
		}

		,displayLogPanel : function (logtype, calc_id)
		{
			if ('undefined' == typeof calc_id)
				calc_id = -1;

			switch (logtype)
			{
				case 'genie':
					if (null === this.genieLog)
					{
						this.genieLog = this.createServerLog(logtype, '/casa/common/fetchgenielog.php', calc_id);
					}
					this.genieLog.show();
					this.genieLog.win.alignTo(Ext.getBody(), "br-br", [-15, -15]);
					break;
			}
		}

		,createServerLog : function (logtype, url, calc_id)
		{
			var log_obj = {
				win      : null
				,title   : logtype.toUpperCase() +' logging...'
				,monitoring : false
				,calc_id : calc_id
				,div_id : logtype + '-log-container'
				,url : url
				,logType : logtype

				,show : function ()
				{
					var me = this;

					if( null === me.win )
					{
						me.win = createCasaWindow( me.getWindowConfig(), me.logType == 'genie' );
						me.win.on('close', function(){
							me.htmlPanel.stopMonitoring();
							me.win = null;
						});
						me.last_logid = -1;
					}

					me.win.show();
					me.init();
				}

				,init  : function ()
				{
					var me = this;
					me.monitoring = true;
					me.updateButtonStatus();
					me.load();
				}

				,updateButtonStatus : function ()
				{
					var me = this;
					if ( me.monitoring )
					{
						me.startbutton.disable();
						me.stopbutton.enable();
					}
					else
					{
						me.startbutton.enable();
						me.stopbutton.disable();
					}
				}

				,getWindowConfig : function ()
				{
					var me = this;
					me.createPanel();
					me.laststartinfo = createFormLabel( '|last-start', '', 'label-blue-small' );
					me.startbutton = new Ext.Button({
						cls	: "x-btn-text-icon"
						,icon	: "/casa/images/drop-yes.gif"
						,text	: "Start"
						,logType : logtype
						,handler : function() { me.htmlPanel.startMonitoring(); }
					});
					me.stopbutton = new Ext.Button({
						cls	: "x-btn-text-icon"
						,xtype: 'button'
						,icon	: "/casa/images/drop-no.gif"
						,text	: "Stop"
						,logType : logtype
						,handler : function() { me.htmlPanel.stopMonitoring(); }
					});

					var bbaritems = [];
					bbaritems.push(me.startbutton);
					bbaritems.push('-');
					bbaritems.push(me.stopbutton);
					bbaritems.push('->');
					bbaritems.push(me.laststartinfo);

					var ret = {
						title       : me.title
						,constrain   : true
						,layout      : 'fit'
						,width       : 850
						,height      : 360
						,resizable   : true
						,modal       : false
						,bbar        : bbaritems

						,items       :
						[
						me.htmlPanel
						]
					};

					return ret;
				}

				,createPanel : function ()
				{
					var me = this;
					var div_id = me.div_id;
					me.htmlPanel = new Ext.Panel( {
						autoScroll : true
						,html : '<div id="' + div_id + '" style="height:100%"> </div>'
						,logType : logtype
						,LOAD : function( params ) {
							var which = me.logType;
							var theContainer = $('#' + div_id);
							var url = log_obj.url;
							$.ajax({
								cache:true
								,url: url
								,type: 'POST'
								,data:params
								,success: function(response){
									HandleJsonFailure(null, response);
									var res_obj = Ext.JSON.decode(response);
									if (!res_obj.success)
									{
										log_obj.htmlPanel.stopMonitoring();
										return;
									}
									log_obj.last_logid = res_obj.last_logid;
									theContainer.append(res_obj.logs);
									var thebody = log_obj.htmlPanel.body.dom;
									thebody.scrollTop = thebody.scrollHeight - thebody.offsetHeight;
									if ('undefined' != typeof res_obj.last_restart && '-notloaded-' != res_obj.last_restart)
									{
										log_obj.laststartinfo.setText('Last Server Restart: ' + res_obj.last_restart + String.fromCharCode(160));
									}
									if ('' != res_obj.complete)
									{
										log_obj.htmlPanel.stopMonitoring();
										Ext.Msg.alert(which.toUpperCase() + ' message', res_obj.complete);
										return;
									}

									var exec;
									switch (which)
									{
										case 'genie':
											exec = "CasaDesk.genieLog.load()";
											break;
									}
									if ( log_obj.monitoring ) setTimeout(exec, 5000);
								}
							});

						}
						,stopMonitoring : function ()
						{
							me.monitoring = false; me.updateButtonStatus();
						}

						,startMonitoring : function ()
						{
							me.monitoring = true; me.updateButtonStatus(); me.load();
						}
					} );
				}

				,load  : function ()
				{
					var me = this;
					if ( !me.monitoring ) return;

			   var calc_id = me.calc_id;
			   var last_logid = me.last_logid;
			   me.htmlPanel.LOAD( {  action : 'log', calc_id : calc_id, last_logid : last_logid } );
				}

				,resetLog : function (calc_id)
				{
					var me = this;
					var theContainer = $('#' + me.div_id);
					theContainer.html('');

					if ('undefined' != typeof calc_id)
					{
						me.calc_id = calc_id;
						me.htmlPanel.startMonitoring();
					}
				}
			}

			return log_obj;
		}

	});
}

// -----------------------------------------
class CRCKeyMapper
{
	constructor( options )
	{
		this._key = false;
		this._altKey = false;
		this._ctrlKey = false;
		this._shiftKey = false;
		
		this._delay	= 500;
		this._valid	= false;
		this._keys	= null;
		this._keydelay = new Array();
		
		this._state =
		{
			buffer			: []
			,lastKeyTime	: Date.now()
			,timeout		: null
		};
	
		if ( options )
		{
			this._map	= options.map 		|| null;
			this._cb	= options.callback 	|| null;
			this._delay	= options.delay		|| this._delay;
			this._el	= options.element	|| null;
			this._event	= options.event		|| null;

			if (	null != this._map
				&&	null != this._cb
				&&	null != this._el
				&&	null != this._event )		this._valid = true;
		}
		
		this._initMapping();
	}
	
	_initDelays()
	{
		this._keys = Object.keys( this._map ).sort();
		var		n_keys = this._keys.length;
		var		prev_key = null;

		for ( var ii=0 ; ii<n_keys ; ii++ )
		{
			var		curr_key = this._keys[ ii ];
			var 	offset = 1;
			
			this._keydelay[ curr_key ] = false;

			// End at this point
			if ( ii == n_keys-1 )		continue;
			
			var 	next_key = this._keys[ ii+offset ];
			
			if ( curr_key.charAt( 0 ) == next_key.charAt( 0 ) )
			{
				this._keydelay[ curr_key ] = true;
				prev_key = curr_key;
			}
			else if ( null != prev_key )
			{
				this._keydelay[ curr_key ] = true;
				prev_key = null;
			}
			else
			{
				prev_key = null;
			}
		}
	}
	
	_initMapping()
	{
		var self = this;
		var cbfn = function()
		{
			if ( typeof self._map[ self._state.userInput ] !== "undefined" )
			{
				self._cb( self._map[ self._state.userInput ] );
			}
		};
			
 		this._initDelays();
		
		if ( !this._valid )
		{
			alert( "CRCKeyMapper is not correctly initialized" );
			return;
		}
		
		this._el.addEventListener( this._event, event =>
		{
			const	key = event.key.toLowerCase();
			
			self._key      = key;
			self._altKey   = event.altKey;   // boolean
			self._ctrlKey  = event.ctrlKey;  // boolean
			self._shiftKey = event.shiftKey; // boolean
		
			// If this is an EDITABLE field, ignore this event // exclude also keys with a modifier
			if ( false == event.srcElement.readOnly || self._altKey || self._ctrlKey || self._shiftKey ) return;
			// -----------------------------------------------
								  
			const	currentTime = Date.now();
					
			let buffer = [];

			if ( currentTime - this._state.lastKeyTime > this._delay )
			{
				buffer = [key];
				
				// If there is no delay for this single key, fire off the callback
				// and then terminate this listener
				if ( ! this._keydelay[ key ] )
				{
					this._state.userInput = buffer;
					cbfn();
					return;
				}
			}
			else
			{
				buffer = [ ...this._state.buffer, key ];
			}

			if ( null != this._state.timeout )
			{
				clearTimeout( this._state.timeout );
			}
						
			this._state =
			{
				buffer			: buffer
				, key 			: key
				, userInput		: buffer.join('').toLowerCase()
				, lastKeyTime	: currentTime
				, timeout		: setTimeout( cbfn, this._delay )
			};
		});
	}
}



