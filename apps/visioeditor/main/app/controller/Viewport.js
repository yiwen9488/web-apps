/*
 * (c) Copyright Ascensio System SIA 2010-2024
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-6 Ernesta Birznieka-Upish
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */
/**
 *  Viewport.js
 *
 *  This is out main controller which will do most of job
 *  It will listen for view and collection events and manage all data-related operations
 *
 *  Created on 11/07/24
 *
 */

define([
    'core',
    'common/main/lib/view/Header',
    // 'common/main/lib/view/SearchBar',
    'visioeditor/main/app/view/Viewport',
    'visioeditor/main/app/view/LeftMenu'
], function (Viewport) {
    'use strict';

    VE.Controllers.Viewport = Backbone.Controller.extend(_.assign({
        // Specifying a Viewport model
        models: [],

        // Specifying a collection of out Viewport
        collections: [],

        // Specifying application views
        views: [
            'Viewport',   // is main application layout
            'Common.Views.Header'
        ],

        // When controller is created let's setup view event listeners
        initialize: function() {
            // This most important part when we will tell our controller what events should be handled

            var me = this;
            this.addListeners({
                'FileMenu': {
                    'menu:hide': me.onFileMenu.bind(me, 'hide'),
                    'menu:show': me.onFileMenu.bind(me, 'show'),
                    'settings:apply': me.applySettings.bind(me)
                },
                'Statusbar': {
                    'view:compact': function (statusbar, state) {
                        var height = parseInt(window.getComputedStyle(document.body).getPropertyValue('--statusbar-height') || 25);
                        me.viewport.vlayout.getItem('statusbar').height = state ? height : height * 2;
                    }
                },
                'Toolbar': {
                    'render:before' : function (toolbar) {
                        var config = VE.getController('Main').appOptions;
                        toolbar.setExtra('right', me.header.getPanel('right', config));
                        if (!config.twoLevelHeader || config.compactHeader)
                            toolbar.setExtra('left', me.header.getPanel('left', config));
                        me.toolbar = toolbar;
                        me.header.btnSearch.hide();
                        /*var value = Common.localStorage.getBool("ve-settings-quick-print-button", true);
                        Common.Utils.InternalSettings.set("ve-settings-quick-print-button", value);
                        if (me.header && me.header.btnPrintQuick)
                            me.header.btnPrintQuick[value ? 'show' : 'hide']();*/
                    },
                    'view:compact'  : function (toolbar, state) {
                        me.viewport.vlayout.getItem('toolbar').height = state ?
                                Common.Utils.InternalSettings.get('toolbar-height-compact') : Common.Utils.InternalSettings.get('toolbar-height-normal');
                    },
                    'print:disabled' : function (state) {
                        if ( me.header.btnPrint )
                            me.header.btnPrint.setDisabled(state);
                        if ( me.header.btnPrintQuick )
                            me.header.btnPrintQuick.setDisabled(state);
                    }
                }
            });
            Common.NotificationCenter.on('tabstyle:changed', this.onTabStyleChange.bind(this));
            Common.NotificationCenter.on('tabbackground:changed', this.onTabBackgroundChange.bind(this));
            this._initEditing = true;
        },

        setApi: function(api) {
            this.api = api;
            this.api.asc_registerCallback('asc_onCoAuthoringDisconnect',this.onApiCoAuthoringDisconnect.bind(this));
            Common.NotificationCenter.on('api:disconnect',              this.onApiCoAuthoringDisconnect.bind(this));
            Common.NotificationCenter.on('uitheme:changed', this.onThemeChanged.bind(this));
        },

        getApi: function() {
            return this.api;
        },

        setMode: function(mode) {
            this.mode = mode;
            this.viewport && this.viewport.setMode(mode);
        },

        // When our application is ready, lets get started
        onLaunch: function() {
            // Create and render main view
            this.viewport = this.createView('Viewport').render();

            this.api = new Asc.VisioEditorApi({
                'id-view'  : 'editor_sdk',
                'translate': this.getApplication().getController('Main').translationTable,
                'isRtlInterface': Common.UI.isRTL()
            });

            this.header   = this.createView('Common.Views.Header', {
                headerCaption: 'Visio Editor',
                storeUsers: VE.getCollection('Common.Collections.Users')
            });

            Common.NotificationCenter.on('layout:changed', _.bind(this.onLayoutChanged, this));
            $(window).on('resize', _.bind(this.onWindowResize, this));

            var leftPanel = $('#left-menu');
            this.viewport.hlayout.on('layout:resizedrag', function() {
                this.api.Resize();
                Common.localStorage.setItem('ve-mainmenu-width', leftPanel.width() );
            }, this);

            this.boxSdk = $('#editor_sdk');
            this.boxSdk.css('border-left', 'none');

            Common.NotificationCenter.on('app:face', this.onAppShowed.bind(this));
            Common.NotificationCenter.on('app:ready', this.onAppReady.bind(this));
            // Common.NotificationCenter.on('search:show', _.bind(this.onSearchShow, this));
        },

        onAppShowed: function (config) {
            var me = this;
            me.appConfig = config;

            var _intvars = Common.Utils.InternalSettings;
            var $filemenu = $('.toolbar-fullview-panel');
            $filemenu.css('top', Common.UI.LayoutManager.isElementVisible('toolbar') ? _intvars.get('toolbar-height-tabs') : 0);

            if ( !config.isEdit ||
                ( !Common.localStorage.itemExists("ve-compact-toolbar") &&
                config.customization && config.customization.compactToolbar ))
            {
                me.viewport.vlayout.getItem('toolbar').height = _intvars.get('toolbar-height-compact');
            }

            me.onTabStyleChange();
            me.onTabBackgroundChange();
            if ( config.customization && config.customization.toolbarHideFileName )
                me.viewport.vlayout.getItem('toolbar').el.addClass('style-skip-docname');

            if ( config.twoLevelHeader && !config.compactHeader) {
                var $title = me.viewport.vlayout.getItem('title').el;
                $title.html(me.header.getPanel('title', config)).show();
                $title.find('.extra').html(me.header.getPanel('left', config));

                var toolbar = me.viewport.vlayout.getItem('toolbar');
                toolbar.el.addClass('top-title');
                toolbar.height -= _intvars.get('toolbar-height-tabs') - _intvars.get('toolbar-height-tabs-top-title');

                var _tabs_new_height = _intvars.get('toolbar-height-tabs-top-title');
                _intvars.set('toolbar-height-tabs', _tabs_new_height);
                _intvars.set('toolbar-height-compact', _tabs_new_height);
                _intvars.set('toolbar-height-normal', _tabs_new_height + _intvars.get('toolbar-height-controls'));

                $filemenu.css('top', (Common.UI.LayoutManager.isElementVisible('toolbar') ? _tabs_new_height : 0) + _intvars.get('document-title-height'));

                toolbar = me.getApplication().getController('Toolbar').getView('Toolbar');
            }

            // me.header.btnSearch.on('toggle', me.onSearchToggle.bind(this));
        },

        onAppReady: function (config) {
        },

        onLayoutChanged: function(area) {
            switch (area) {
            default:
                this.viewport.vlayout.doLayout();
            case 'leftmenu':
                var panel = this.viewport.hlayout.getItem('left');
                if (panel.resize.el) {
                    if (panel.el.width() > 40) {
                        this.boxSdk.css('border-left', '');
                        panel.resize.el.show();
                    } else {
                        panel.resize.el.hide();
                        this.boxSdk.css('border-left', '0 none');
                    }
                }
                this.viewport.hlayout.doLayout();
                break;
            case 'header':
            case 'toolbar':
            case 'status':
                this.viewport.vlayout.doLayout();
                break;
            }
            this.api.Resize();
        },

        onWindowResize: function(e) {
            this.onLayoutChanged('window');
            Common.NotificationCenter.trigger('window:resize');
        },

        onFileMenu: function (opts) {
            var me = this;
            var _need_disable =  opts == 'show';

            me.header.lockHeaderBtns( 'users', _need_disable );
        },

        applySettings: function () {
            // var value = Common.localStorage.getBool("ve-settings-quick-print-button", true);
            // Common.Utils.InternalSettings.set("ve-settings-quick-print-button", value);
            // if (this.header && this.header.btnPrintQuick)
            //     this.header.btnPrintQuick[value ? 'show' : 'hide']();
        },

        onApiCoAuthoringDisconnect: function(enableDownload) {
            if (this.header) {
                if (this.header.btnDownload && !enableDownload)
                    this.header.btnDownload.hide();
                if (this.header.btnPrint && !enableDownload)
                    this.header.btnPrint.hide();
                if (this.header.btnPrintQuick && !enableDownload)
                    this.header.btnPrintQuick.hide();
                if (this.header.btnEdit)
                    this.header.btnEdit.hide();
                this.header.lockHeaderBtns( 'rename-user', true);
            }
        },

        SetDisabled: function(disable) {
            this.header && this.header.lockHeaderBtns( 'rename-user', disable);
        },

        onSearchShow: function () {
            this.header.btnSearch && this.header.btnSearch.toggle(true);
        },

        onSearchToggle: function () {
            var leftMenu = this.getApplication().getController('LeftMenu');
            if (leftMenu.isSearchPanelVisible()) {
                this.header.btnSearch.toggle(false, true);
                leftMenu.getView('LeftMenu').panelSearch.focus();
                return;
            }
            if (!this.searchBar) {
                var hideLeftPanel = this.mode.canBrandingExt &&
                    (!Common.UI.LayoutManager.isElementVisible('leftMenu') || this.mode.customization && this.mode.customization.leftMenu === false);
                this.searchBar = new Common.UI.SearchBar( hideLeftPanel ? {
                    showOpenPanel: false,
                    width: 303
                } : {});
                this.searchBar.on('hide', _.bind(function () {
                    this.header.btnSearch.toggle(false, true);
                    Common.NotificationCenter.trigger('edit:complete');
                }, this));
            }
            if (this.header.btnSearch.pressed) {
                var selectedText = '',//this.api.asc_GetSelectedText(),
                    searchController = this.getApplication().getController('Search'),
                    resultsNumber = searchController.getResultsNumber();
                this.searchBar.show(selectedText && selectedText.trim() || searchController.getSearchText());
                this.searchBar.updateResultsNumber(resultsNumber[0], resultsNumber[1]);
            } else {
                this.searchBar.hide();
            }
        },

        isSearchBarVisible: function () {
            return this.searchBar && this.searchBar.isVisible();
        },

        applyCommonMode: function() {
            if ( Common.localStorage.getBool('ve-hidden-status') )
                this.getApplication().getController('Statusbar').getView('Statusbar').setVisible(false);

            var value = Common.UI.LayoutManager.getInitValue('leftMenu');
            value = (value!==undefined) ? !value : false;
            Common.localStorage.getBool("ve-hidden-leftmenu", value) && this.getApplication().getController('LeftMenu').getView('LeftMenu').hide();
        },

        applyEditorMode: function() {
            if (!this.viewport) return;

            if (this.mode.isEdit && this._initEditing) {
                this._initEditing = false;
            }
        },

        onTabStyleChange: function (style) {
            style = style || Common.Utils.InternalSettings.get("settings-tab-style");
            this.viewport.vlayout.getItem('toolbar').el.toggleClass('lined-tabs', style==='line');
        },

        onTabBackgroundChange: function (background) {
            background = background || Common.Utils.InternalSettings.get("settings-tab-background");
            this.viewport.vlayout.getItem('toolbar').el.toggleClass('style-off-tabs', background==='toolbar');
        },
        
        onThemeChanged: function () {
            if (Common.UI.Themes.available()) {
                var _intvars = Common.Utils.InternalSettings;
                var $filemenu = $('.toolbar-fullview-panel');

                const computed_style = window.getComputedStyle(document.body);
                _intvars.set('toolbar-height-controls', parseInt(computed_style.getPropertyValue("--toolbar-height-controls") || 84));
                _intvars.set('toolbar-height-normal', _intvars.get('toolbar-height-tabs') + _intvars.get('toolbar-height-controls'));
                $filemenu.css('top', (Common.UI.LayoutManager.isElementVisible('toolbar') ? _intvars.get('toolbar-height-tabs') : 0) +
                                     (this.appConfig.twoLevelHeader && !this.appConfig.compactHeader ? _intvars.get('document-title-height') : 0));

                this.viewport.vlayout.getItem('toolbar').height = this.toolbar && this.toolbar.isCompact() ?
                    _intvars.get('toolbar-height-compact') : _intvars.get('toolbar-height-normal');

                this.viewport.vlayout.getItem('statusbar').height = parseInt(computed_style.getPropertyValue('--statusbar-height') || 25);

                Common.NotificationCenter.trigger('layout:changed', 'toolbar');
            }
        },
    }, VE.Controllers.Viewport));
});
