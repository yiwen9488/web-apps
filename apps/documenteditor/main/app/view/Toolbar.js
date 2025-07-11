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
 *  Toolbar.js
 *
 *  Toolbar view
 *
 *  Created on 2/13/17
 *
 */
if (Common === undefined)
    var Common = {};

define([
    'jquery',
    'underscore',
    'backbone',
    'text!documenteditor/main/app/template/Toolbar.template',
    'text!documenteditor/main/app/template/ToolbarView.template',
    'common/main/lib/collection/Fonts',
    'common/main/lib/component/Button',
    'common/main/lib/component/ComboBox',
    'common/main/lib/component/Label',
    'common/main/lib/component/DataView',
    'common/main/lib/component/ColorPalette',
    'common/main/lib/component/ThemeColorPalette',
    'common/main/lib/component/Menu',
    'common/main/lib/component/DimensionPicker',
    'common/main/lib/component/Window',
    'common/main/lib/component/ComboBoxFonts',
    'common/main/lib/component/ComboDataView'
    ,'common/main/lib/component/SynchronizeTip'
    ,'common/main/lib/component/Mixtbar'
], function ($, _, Backbone, template, template_view) {
    'use strict';

    if (!Common.enumLock)
        Common.enumLock = {};

    var enumLock = {
        undoLock:       'can-undo',
        redoLock:       'can-redo',
        copyLock:       'can-copy',
        paragraphLock:  'para-lock',
        headerLock:     'header-lock',
        headerFooterLock: 'header-footer-lock',
        chartLock:      'chart-lock',
        imageLock:      'image-lock',
        richEditLock:   'rich-edit-lock',
        plainEditLock:  'plain-edit-lock',
        richDelLock:    'rich-del-lock',
        plainDelLock:   'plain-del-lock',
        contentLock:    'content-lock',
        mmergeLock:     'mmerge-lock',
        dropcapLock:    'dropcap-lock',
        docPropsLock:   'doc-props-lock',
        docSchemaLock:  'doc-schema-lock',
        hyperlinkLock:  'can-hyperlink',
        inSmartart:     'in-smartart',
        inSmartartInternal: 'in-smartart-internal',
        inSpecificForm: 'in-specific-form',
        inChart:        'in-chart',
        inEquation:     'in-equation',
        inHeader:       'in-header',
        inImage:        'in-image',
        inImagePara:    'in-image-para',
        inImageInline:  'in-image-inline',
        inFootnote:     'in-footnote',
        inControl:      'in-control',
        inLightTheme:   'light-theme',
        controlPlain:   'control-plain',
        noParagraphSelected:  'no-paragraph',
        cantAddTable:   'cant-add-table',
        cantAddQuotedComment: 'cant-add-quoted-comment',
        cantPrint:      'cant-print',
        cantAddImagePara: 'cant-add-image-para',
        cantAddEquation: 'cant-add-equation',
        cantAddChart:   'cant-add-chart',
        cantAddPageNum: 'cant-add-page-num',
        cantPageBreak:  'cant-page-break',
        cantUpdateTOF:  'cant-update-tof',
        cantAddTextTOF: 'cant-addtext-tof',
        cantGroup:      'cant-group',
        cantWrap:       'cant-wrap',
        cantArrange:    'cant-arrange',
        noObjectSelected:  'no-object',
        lostConnect:    'disconnect',
        disableOnStart: 'on-start',
        complexForm:    'complex-form',
        formsNoRoles:   'no-roles',
        fixedForm:      'fixed-form',
        fileMenuOpened: 'file-menu-opened',
        changeModeLock: 'change-mode-lock',
        noStyles: 'no-styles',
        cantMergeShape: 'merge-shape-lock',
        cantSave: 'cant-save'
    };
    for (var key in enumLock) {
        if (enumLock.hasOwnProperty(key)) {
            Common.enumLock[key] = enumLock[key];
        }
    }

    DE.Views.Toolbar =  Common.UI.Mixtbar.extend(_.extend((function(){

        return {
            el: '#toolbar',

            // Compile our stats template
            // template: _.template(template),

            // Delegated events for creating new items, and clearing completed ones.
            events: {
                //
            },

            initialize: function () {
                var me = this;

                /**
                 * UI Components
                 */

                this.paragraphControls = [];
                this.toolbarControls = [];
                this.textOnlyControls = [];
                this.spinners = [];
                this._state = {
                    hasCollaborativeChanges: undefined,
                    previewmode: false
                };

                Common.NotificationCenter.on('app:ready', me.onAppReady.bind(this));
                return this;
            },

            applyLayout: function (config) {
                var me = this;
                me.lockControls = [];
                var _set = Common.enumLock;
                if ( config.isEdit ) {
                    Common.UI.Mixtbar.prototype.initialize.call(this, {
                            template: _.template(template),
                            tabs: [
                                {caption: me.textTabFile, action: 'file', extcls: 'canedit', layoutname: 'toolbar-file', haspanel:false, dataHintTitle: 'F'},
                                {caption: me.textTabHome, action: 'home', extcls: 'canedit', dataHintTitle: 'H'},
                                {caption: me.textTabInsert, action: 'ins', extcls: 'canedit', dataHintTitle: 'I'},
                                {caption: me.textTabLayout, action: 'layout', extcls: 'canedit', layoutname: 'toolbar-layout', dataHintTitle: 'L'},
                                {caption: me.textTabLinks, action: 'links', extcls: 'canedit', layoutname: 'toolbar-references', dataHintTitle: 'N'}
                                // undefined, undefined, undefined, undefined,
                            ],
                            config: config
                        }
                    );

                    this.btnSaveCls = config.canSaveToFile || config.isDesktopApp && config.isOffline ? 'btn-save' : 'btn-download';
                    this.btnSaveTip = config.canSaveToFile || config.isDesktopApp && config.isOffline ? this.tipSave + Common.Utils.String.platformKey('Ctrl+S') : this.tipDownload;

                    this.btnPrint = new Common.UI.Button({
                        id: 'id-toolbar-btn-print',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-print no-mask',
                        lock: [_set.cantPrint, _set.disableOnStart],
                        signals: ['disabled'],
                        split: config.canQuickPrint,
                        menu: config.canQuickPrint,
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintTitle: 'P',
                        printType: 'print'
                    });
                    this.toolbarControls.push(this.btnPrint);

                    this.btnSave = new Common.UI.Button({
                        id: 'id-toolbar-btn-save',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon no-mask ' + this.btnSaveCls,
                        lock: [_set.cantSave, _set.previewReviewMode, _set.lostConnect, _set.disableOnStart, _set.viewMode],
                        signals: ['disabled'],
                        dataHint: '1',
                        dataHintDirection: 'top',
                        dataHintTitle: 'S'
                    });
                    this.toolbarControls.push(this.btnSave);
                    this.btnCollabChanges = this.btnSave;

                    this.btnUndo = new Common.UI.Button({
                        id: 'id-toolbar-btn-undo',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-undo icon-rtl',
                        lock: [_set.undoLock, _set.previewReviewMode, _set.lostConnect, _set.disableOnStart, _set.viewMode],
                        signals: ['disabled'],
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintTitle: 'Z'
                    });
                    this.toolbarControls.push(this.btnUndo);

                    this.btnRedo = new Common.UI.Button({
                        id: 'id-toolbar-btn-redo',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-redo icon-rtl',
                        lock: [_set.redoLock, _set.previewReviewMode, _set.lostConnect, _set.disableOnStart, _set.viewMode],
                        signals: ['disabled'],
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintTitle: 'Y'
                    });
                    this.toolbarControls.push(this.btnRedo);

                    this.btnCopy = new Common.UI.Button({
                        id: 'id-toolbar-btn-copy',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-copy',
                        lock: [_set.copyLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart],
                        dataHint: '1',
                        dataHintDirection: 'top',
                        dataHintTitle: 'C'
                    });
                    this.toolbarControls.push(this.btnCopy);

                    this.btnPaste = new Common.UI.Button({
                        id: 'id-toolbar-btn-paste',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-paste',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockCommentsIns, _set.viewMode],
                        dataHint: '1',
                        dataHintDirection: 'top',
                        dataHintTitle: 'V'
                    });
                    this.paragraphControls.push(this.btnPaste);

                    this.btnCut = new Common.UI.Button({
                        id: 'id-toolbar-btn-cut',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-cut',
                        lock: [_set.copyLock, _set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.imageLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockCommentsIns, _set.viewMode],
                        dataHint: '1',
                        dataHintDirection: 'top',
                        dataHintTitle: 'X'
                    });
                    this.paragraphControls.push(this.btnCut);

                    this.btnSelectAll = new Common.UI.Button({
                        id: 'id-toolbar-btn-select-all',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-select-all',
                        lock: [_set.viewFormMode, _set.disableOnStart],
                        dataHint: '1',
                        dataHintDirection: 'bottom'
                    });
                    this.toolbarControls.push(this.btnSelectAll);

                    this.btnReplace = new Common.UI.Button({
                        id: 'id-toolbar-btn-replace',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-replace',
                        lock: [_set.viewFormMode, _set.disableOnStart],
                        dataHint: '1',
                        dataHintDirection: 'top'
                    });
                    this.toolbarControls.push(this.btnReplace);

                    this.btnIncFontSize = new Common.UI.Button({
                        id: 'id-toolbar-btn-incfont',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-incfont',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewText, _set.docLockForms, _set.docLockCommentsText, _set.viewMode],
                        dataHint: '1',
                        dataHintDirection: 'top'
                    });
                    this.paragraphControls.push(this.btnIncFontSize);

                    this.btnDecFontSize = new Common.UI.Button({
                        id: 'id-toolbar-btn-decfont',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-decfont',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewText, _set.docLockForms, _set.docLockCommentsText, _set.viewMode],
                        dataHint: '1',
                        dataHintDirection: 'top'
                    });
                    this.paragraphControls.push(this.btnDecFontSize);

                    this.btnBold = new Common.UI.Button({
                        id: 'id-toolbar-btn-bold',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-bold',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewText, _set.docLockForms, _set.docLockCommentsText, _set.viewMode],
                        enableToggle: true,
                        dataHint: '1',
                        dataHintDirection: 'bottom'
                    });
                    this.paragraphControls.push(this.btnBold);

                    this.btnItalic = new Common.UI.Button({
                        id: 'id-toolbar-btn-italic',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-italic',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewText, _set.docLockForms, _set.docLockCommentsText, _set.viewMode],
                        enableToggle: true,
                        dataHint: '1',
                        dataHintDirection: 'bottom'
                    });
                    this.paragraphControls.push(this.btnItalic);

                    this.btnUnderline = new Common.UI.Button({
                        id: 'id-toolbar-btn-underline',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-underline',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewText, _set.docLockForms, _set.docLockCommentsText, _set.viewMode],
                        enableToggle: true,
                        dataHint: '1',
                        dataHintDirection: 'bottom'
                    });
                    this.paragraphControls.push(this.btnUnderline);

                    this.btnStrikeout = new Common.UI.Button({
                        id: 'id-toolbar-btn-strikeout',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-strikeout',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewText, _set.docLockForms, _set.docLockCommentsText, _set.viewMode],
                        enableToggle: true,
                        dataHint: '1',
                        dataHintDirection: 'bottom'
                    });
                    this.paragraphControls.push(this.btnStrikeout);

                    this.btnSuperscript = new Common.UI.Button({
                        id: 'id-toolbar-btn-superscript',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-superscript',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.inEquation, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewText, _set.docLockForms, _set.docLockCommentsText, _set.viewMode],
                        enableToggle: true,
                        toggleGroup: 'superscriptGroup',
                        dataHint: '1',
                        dataHintDirection: 'bottom'
                    });
                    this.paragraphControls.push(this.btnSuperscript);

                    this.btnSubscript = new Common.UI.Button({
                        id: 'id-toolbar-btn-subscript',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-subscript',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.inEquation, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewText, _set.docLockForms, _set.docLockCommentsText, _set.viewMode],
                        enableToggle: true,
                        toggleGroup: 'superscriptGroup',
                        dataHint: '1',
                        dataHintDirection: 'bottom'
                    });
                    this.paragraphControls.push(this.btnSubscript);

                    this.btnHighlightColor = new Common.UI.ButtonColored({
                        id: 'id-toolbar-btn-highlight',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-highlight',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.inChart, _set.inSmartart, _set.inSmartartInternal, _set.previewReviewMode, _set.viewFormMode,
                                _set.lostConnect, _set.disableOnStart, _set.docLockViewText, _set.docLockForms, _set.docLockCommentsText, _set.viewMode],
                        enableToggle: true,
                        allowDepress: true,
                        split: true,
                        menu: new Common.UI.Menu({
                            style: 'min-width: 100px;',
                            items: [
                                {template: _.template('<div id="id-toolbar-menu-highlight" style="width: 145px; display: inline-block;" class="palette-large"></div>')},
                                {caption: '--'},
                                this.mnuHighlightTransparent = new Common.UI.MenuItem({
                                    caption: this.strMenuNoFill,
                                    checkable: true
                                })
                            ]
                        }),
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: '0, -16'
                    });
                    this.paragraphControls.push(this.btnHighlightColor);

                    this.btnFontColor = new Common.UI.ButtonColored({
                        id: 'id-toolbar-btn-fontcolor',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-fontcolor',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewText, _set.docLockForms, _set.docLockCommentsText, _set.viewMode],
                        split: true,
                        menu: true,
                        auto: true,
                        eyeDropper: true,
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: '0, -16'
                    });
                    this.paragraphControls.push(this.btnFontColor);

                    this.btnParagraphColor = new Common.UI.ButtonColored({
                        id: 'id-toolbar-btn-paracolor',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-paracolor',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.inChart, _set.inSmartart, _set.inSmartartInternal, _set.previewReviewMode, _set.viewFormMode,
                                _set.lostConnect, _set.disableOnStart, _set.docLockViewPara, _set.docLockForms, _set.docLockCommentsPara, _set.viewMode],
                        split: true,
                        transparent: true,
                        menu: true,
                        eyeDropper: true,
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: '0, -16'
                    });
                    this.paragraphControls.push(this.btnParagraphColor);
                    this.textOnlyControls.push(this.btnParagraphColor);

                    this.btnBorders = new Common.UI.Button({
                        id: 'id-toolbar-btn-borders',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-border-out',
                        icls: 'btn-border-out',
                        borderId: 'outer',
                        lock: [_set.noParagraphSelected, _set.fixedForm, _set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockView, _set.docLockForms, _set.docLockComments, _set.viewMode],
                        split: true,    
                        menu: true,
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: '0, -16'
                    })    
                    this.paragraphControls.push(this.btnBorders);               
                    
                    this.btnChangeCase = new Common.UI.Button({
                        id: 'id-toolbar-btn-case',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-change-case',
                        action: 'change-case',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewText, _set.docLockForms, _set.docLockCommentsText, _set.viewMode],
                        menu: new Common.UI.Menu({
                            items: [
                                {caption: this.mniSentenceCase, value: Asc.c_oAscChangeTextCaseType.SentenceCase},
                                {caption: this.mniLowerCase, value: Asc.c_oAscChangeTextCaseType.LowerCase},
                                {caption: this.mniUpperCase, value: Asc.c_oAscChangeTextCaseType.UpperCase},
                                {caption: this.mniCapitalizeWords, value: Asc.c_oAscChangeTextCaseType.CapitalizeWords},
                                {caption: this.mniToggleCase, value: Asc.c_oAscChangeTextCaseType.ToggleCase}
                            ]
                        }),
                        dataHint: '1',
                        dataHintDirection: 'top'
                    });
                    this.paragraphControls.push(this.btnChangeCase);

                    this.btnAlignLeft = new Common.UI.Button({
                        id: 'id-toolbar-btn-align-left',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-align-left',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewPara, _set.docLockForms, _set.docLockCommentsPara, _set.fixedForm, _set.viewMode],
                        enableToggle: true,
                        toggleGroup: 'alignGroup',
                        dataHint: '1',
                        dataHintDirection: 'bottom'
                    });
                    this.paragraphControls.push(this.btnAlignLeft);

                    this.btnAlignCenter = new Common.UI.Button({
                        id: 'id-toolbar-btn-align-center',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-align-center',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewPara, _set.docLockForms, _set.docLockCommentsPara, _set.fixedForm, _set.viewMode],
                        enableToggle: true,
                        toggleGroup: 'alignGroup',
                        dataHint: '1',
                        dataHintDirection: 'bottom'
                    });
                    this.paragraphControls.push(this.btnAlignCenter);

                    this.btnAlignRight = new Common.UI.Button({
                        id: 'id-toolbar-btn-align-right',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-align-right',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewPara, _set.docLockForms, _set.docLockCommentsPara, _set.fixedForm, _set.viewMode],
                        enableToggle: true,
                        toggleGroup: 'alignGroup',
                        dataHint: '1',
                        dataHintDirection: 'bottom'
                    });
                    this.paragraphControls.push(this.btnAlignRight);

                    this.btnAlignJust = new Common.UI.Button({
                        id: 'id-toolbar-btn-align-just',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-align-just',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewPara, _set.docLockForms, _set.docLockCommentsPara, _set.fixedForm, _set.viewMode],
                        enableToggle: true,
                        toggleGroup: 'alignGroup',
                        dataHint: '1',
                        dataHintDirection: 'bottom'
                    });
                    this.paragraphControls.push(this.btnAlignJust);

                    this.btnDecLeftOffset = new Common.UI.Button({
                        id: 'id-toolbar-btn-decoffset',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-decoffset',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.inSmartartInternal, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewPara, _set.docLockForms, _set.docLockCommentsPara, _set.fixedForm, _set.viewMode],
                        dataHint: '1',
                        dataHintDirection: 'top'
                    });
                    this.paragraphControls.push(this.btnDecLeftOffset);

                    this.btnIncLeftOffset = new Common.UI.Button({
                        id: 'id-toolbar-btn-incoffset',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-incoffset',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.inSmartartInternal, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewPara, _set.docLockForms, _set.docLockCommentsPara, _set.fixedForm, _set.viewMode],
                        dataHint: '1',
                        dataHintDirection: 'top'
                    });
                    this.paragraphControls.push(this.btnIncLeftOffset);

                    this.btnLineSpace = new Common.UI.Button({
                        id: 'id-toolbar-btn-linespace',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-linespace',
                        action: 'line-space',
                        lock: [_set.noParagraphSelected, _set.paragraphLock, _set.headerLock, _set.richEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewPara, _set.docLockForms, _set.docLockCommentsPara, _set.fixedForm, _set.viewMode],
                        menu: new Common.UI.Menu({
                            style: 'min-width: 60px;',
                            items: [
                                {caption: '1.0', value: 1.0, checkable: true, toggleGroup: 'linesize'},
                                {caption: '1.15', value: 1.15, checkable: true, toggleGroup: 'linesize'},
                                {caption: '1.5', value: 1.5, checkable: true, toggleGroup: 'linesize'},
                                {caption: '2.0', value: 2.0, checkable: true, toggleGroup: 'linesize'},
                                {caption: '2.5', value: 2.5, checkable: true, toggleGroup: 'linesize'},
                                {caption: '3.0', value: 3.0, checkable: true, toggleGroup: 'linesize'}
                            ].concat(config.canBrandingExt && config.customization && config.customization.rightMenu === false || !Common.UI.LayoutManager.isElementVisible('rightMenu') ? [] : [
                                me.mnuLineSpaceOptions = new Common.UI.MenuItem({caption: this.textLineSpaceOptions, value: 'options'})
                            ]).concat([
                                {caption: '--'},
                                me.mnuLineSpaceBefore = new Common.UI.MenuItem({caption: this.textAddSpaceBefore, value: 'before', action: 'add'}),
                                me.mnuLineSpaceAfter = new Common.UI.MenuItem({caption: this.textAddSpaceAfter, value: 'after', action: 'add'})
                            ])
                        }),
                        dataHint: '1',
                        dataHintDirection: 'top',
                        dataHintOffset: '0, -6'
                    });
                    this.paragraphControls.push(this.btnLineSpace);

                    this.btnTextDir = new Common.UI.Button({
                        id: 'id-toolbar-btn-direction',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-ltr',
                        action: 'text-direction',
                        dirRtl: false,
                        lock: [_set.noParagraphSelected, _set.paragraphLock, _set.headerLock, _set.richEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewPara, _set.docLockForms, _set.docLockCommentsPara, _set.fixedForm, _set.viewMode],
                        menu: new Common.UI.Menu({
                            items: [
                                {caption: me.textDirLtr, value: false, iconCls: 'menu__icon btn-ltr'},
                                {caption: me.textDirRtl, value: true, iconCls: 'menu__icon btn-rtl'},
                            ]
                        }),
                        dataHint: '1',
                        dataHintDirection: 'top',
                        dataHintOffset: '0, -6'
                    });
                    this.paragraphControls.push(this.btnTextDir);

                    this.numIndentsLeft = new Common.UI.MetricSpinner({
                        step: .1,
                        width: 70,
                        defaultUnit : "cm",
                        defaultValue : 0,
                        value: '0 cm',
                        maxValue: 55.87,
                        minValue: -55.87,
                        lock: [_set.noParagraphSelected, _set.paragraphLock, _set.headerLock, _set.richEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewPara, _set.docLockForms, _set.docLockCommentsPara, _set.fixedForm, _set.viewMode],
                        dataHint: '1',
                        dataHintDirection: 'top',
                        dataHintOffset: 'small'
                    });
                    this.paragraphControls.push(this.numIndentsLeft);
                    this.spinners.push({cmp: this.numIndentsLeft, step: .1});

                    this.lblIndentsLeft = new Common.UI.Label({
                        caption: this.textIndLeft,
                        lock: [_set.noParagraphSelected, _set.paragraphLock, _set.headerLock, _set.richEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewPara, _set.docLockForms, _set.docLockCommentsPara, _set.fixedForm, _set.viewMode]
                    });
                    this.paragraphControls.push(this.lblIndentsLeft);

                    this.numIndentsRight = new Common.UI.MetricSpinner({
                        step: .1,
                        width: 70,
                        defaultUnit : "cm",
                        defaultValue : 0,
                        value: '0 cm',
                        maxValue: 55.87,
                        minValue: -55.87,
                        lock: [_set.noParagraphSelected, _set.paragraphLock, _set.headerLock, _set.richEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewPara, _set.docLockForms, _set.docLockCommentsPara, _set.fixedForm, _set.viewMode],
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'big'
                    });
                    this.paragraphControls.push(this.numIndentsRight);
                    this.spinners.push({cmp: this.numIndentsRight, step: .1});

                    this.lblIndentsRight = new Common.UI.Label({
                        caption: this.textIndRight,
                        lock: [_set.noParagraphSelected, _set.paragraphLock, _set.headerLock, _set.richEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewPara, _set.docLockForms, _set.docLockCommentsPara, _set.fixedForm, _set.viewMode]
                    });
                    this.paragraphControls.push(this.lblIndentsRight);

                    this.numSpacingBefore = new Common.UI.MetricSpinner({
                        step: .01,
                        width: 70,
                        defaultUnit : "cm",
                        defaultValue : 0,
                        value: '0 cm',
                        maxValue: 55.87,
                        minValue: 0,
                        allowAuto   : true,
                        autoText    : this.txtAutoText,
                        lock: [_set.noParagraphSelected, _set.paragraphLock, _set.headerLock, _set.richEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewPara, _set.docLockForms, _set.docLockCommentsPara, _set.fixedForm, _set.viewMode],
                        dataHint: '1',
                        dataHintDirection: 'top',
                        dataHintOffset: 'big'
                    });
                    this.paragraphControls.push(this.numSpacingBefore);
                    this.spinners.push({cmp: this.numSpacingBefore, step: .01});

                    this.lblSpacingBefore = new Common.UI.Label({
                        caption: this.textSpaceBefore,
                        lock: [_set.noParagraphSelected, _set.paragraphLock, _set.headerLock, _set.richEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewPara, _set.docLockForms, _set.docLockCommentsPara, _set.fixedForm, _set.viewMode]
                    });
                    this.paragraphControls.push(this.lblSpacingBefore);

                    this.numSpacingAfter = new Common.UI.MetricSpinner({
                        step: .01,
                        width: 70,
                        defaultUnit : "cm",
                        defaultValue : 0,
                        value: '0 cm',
                        maxValue: 55.87,
                        minValue: 0,
                        allowAuto   : true,
                        autoText    : this.txtAutoText,
                        lock: [_set.noParagraphSelected, _set.paragraphLock, _set.headerLock, _set.richEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewPara, _set.docLockForms, _set.docLockCommentsPara, _set.fixedForm, _set.viewMode],
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.paragraphControls.push(this.numSpacingAfter);
                    this.spinners.push({cmp: this.numSpacingAfter, step: .01});

                    this.lblSpacingAfter = new Common.UI.Label({
                        caption: this.textSpaceAfter,
                        lock: [_set.noParagraphSelected, _set.paragraphLock, _set.headerLock, _set.richEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewPara, _set.docLockForms, _set.docLockCommentsPara, _set.fixedForm, _set.viewMode]
                    });
                    this.paragraphControls.push(this.lblSpacingAfter);

                    this.btnShowHidenChars = new Common.UI.Button({
                        id: 'id-toolbar-btn-hidenchars',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-paragraph',
                        lock: [ _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockForms, _set.viewMode],
                        enableToggle: true,
                        split: true,
                        action: 'hidden-chars',
                        menu: new Common.UI.Menu({
                            style: 'min-width: 60px;',
                            items: [
                                {caption: this.mniHiddenChars, value: 'characters', checkable: true},
                                {caption: this.mniHiddenBorders, value: 'table', checkable: true}
                            ]
                        }),
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: '0, -16'
                    });
                    this.toolbarControls.push(this.btnShowHidenChars);

                    this.btnMarkers = new Common.UI.Button({
                        id: 'id-toolbar-btn-markers',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon ' + (!Common.UI.isRTL() ? 'btn-setmarkers' : 'btn-setmarkers-rtl'),
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.inChart, _set.inSmartart, _set.inSmartartInternal, _set.previewReviewMode, _set.viewFormMode,
                            _set.lostConnect, _set.disableOnStart, _set.docLockViewPara, _set.docLockForms, _set.docLockCommentsPara, _set.fixedForm, _set.viewMode],
                        enableToggle: true,
                        toggleGroup: 'markersGroup',
                        split: true,
                        menu: true,
                        dataHint: '1',
                        dataHintDirection: 'top',
                        dataHintOffset: '0, -16'
                    });
                    this.paragraphControls.push(this.btnMarkers);
                    this.textOnlyControls.push(this.btnMarkers);

                    this.btnNumbers = new Common.UI.Button({
                        id: 'id-toolbar-btn-numbering',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon ' + (!Common.UI.isRTL() ? 'btn-numbering' : 'btn-numbering-rtl'),
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.inChart, _set.inSmartart, _set.inSmartartInternal,  _set.previewReviewMode, _set.viewFormMode,
                            _set.lostConnect, _set.disableOnStart, _set.docLockViewPara, _set.docLockForms, _set.docLockCommentsPara, _set.fixedForm, _set.viewMode],
                        enableToggle: true,
                        toggleGroup: 'markersGroup',
                        split: true,
                        menu: true,
                        dataHint: '1',
                        dataHintDirection: 'top',
                        dataHintOffset: '0, -16'
                    });
                    this.paragraphControls.push(this.btnNumbers);
                    this.textOnlyControls.push(this.btnNumbers);

                    this.btnMultilevels = new Common.UI.Button({
                        id: 'id-toolbar-btn-multilevels',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon ' + (!Common.UI.isRTL() ? 'btn-multilevels' : 'btn-multilevels-rtl'),
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.inChart, _set.inSmartart, _set.inSmartartInternal, _set.previewReviewMode, _set.viewFormMode,
                                _set.lostConnect, _set.disableOnStart, _set.docLockViewPara, _set.docLockForms, _set.docLockCommentsPara, _set.fixedForm, _set.viewMode],
                        menu: true,
                        dataHint: '1',
                        dataHintDirection: 'top',
                        dataHintOffset: '0, -6'
                    });
                    this.paragraphControls.push(this.btnMultilevels);
                    this.textOnlyControls.push(this.btnMultilevels);

                    var clone = function (source) {
                        var obj = {};
                        for (var prop in source)
                            obj[prop] = (typeof(source[prop]) == 'object') ? clone(source[prop]) : source[prop];
                        return obj;
                    };

                    this.mnuMarkersPicker = {
                        conf: {index: 0},
                        selectByIndex: function (idx) {
                            this.conf.index = idx;
                        },
                        deselectAll: function () {
                            this.conf.index = -1;
                        }
                    };
                    this.mnuNumbersPicker = clone(this.mnuMarkersPicker);
                    this.mnuMultilevelPicker = clone(this.mnuMarkersPicker);

                    this.btnInsertTable = new Common.UI.Button({
                        id: 'tlbtn-inserttable',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-inserttable',
                        lock: [_set.headerLock, _set.richEditLock, _set.plainEditLock, _set.inEquation, _set.controlPlain, _set.richDelLock, _set.plainDelLock, _set.cantAddTable, _set.previewReviewMode,
                            _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.viewMode],
                        caption: me.capBtnInsTable,
                        action: 'insert-table',
                        menu: new Common.UI.Menu({
                            items: [
                                {template: _.template('<div id="id-toolbar-menu-tablepicker" class="dimension-picker" style="margin: 5px 10px;"></div>')},
                                {caption: this.mniCustomTable, value: 'custom'},
                                {caption: this.mniDrawTable, value: 'draw', checkable: true},
                                {caption: this.mniEraseTable, value: 'erase', checkable: true},
                                {caption: this.mniTextToTable, value: 'convert'},
                                {caption: this.mniInsertSSE, value: 'sse'}
                            ]
                        }),
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.paragraphControls.push(this.btnInsertTable);

                    this.btnInsertImage = new Common.UI.Button({
                        id: 'tlbtn-insertimage',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-insertimage',
                        lock: [_set.paragraphLock, _set.headerLock, _set.inEquation, _set.controlPlain, _set.richDelLock, _set.plainDelLock,  _set.contentLock,  _set.cantAddImagePara,
                                _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.viewMode],
                        caption: me.capBtnInsImage,
                        menu: new Common.UI.Menu({
                            items: [
                                {caption: this.mniImageFromFile, value: 'file'},
                                {caption: this.mniImageFromUrl, value: 'url'},
                                {caption: this.mniImageFromStorage, value: 'storage'}
                            ]
                        }),
                        action: 'insert-image',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.paragraphControls.push(this.btnInsertImage);

                    this.btnInsertChart = new Common.UI.Button({
                        id: 'tlbtn-insertchart',
                        cls: 'btn-toolbar x-huge icon-top',
                        caption: me.capBtnInsChart,
                        iconCls: 'toolbar__icon btn-insertchart',
                        lock: [ _set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.controlPlain, _set.richDelLock, _set.plainDelLock, _set.contentLock,
                                _set.chartLock, _set.cantAddChart, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.viewMode],
                        menu: true,
                        action: 'insert-chart',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.paragraphControls.push(this.btnInsertChart);

                    this.btnInsertText = new Common.UI.Button({
                        id: 'tlbtn-inserttext',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-big-text',
                        lock: [_set.paragraphLock, _set.headerLock, _set.inEquation, _set.controlPlain, _set.contentLock, _set.inFootnote, _set.previewReviewMode, _set.viewFormMode,
                            _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.viewMode],
                        caption: me.capBtnInsTextbox,
                        enableToggle: true,
                        split: true,
                        action: 'insert-text',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small',
                        textboxType: 'textRect'
                    });
                    this.paragraphControls.push(this.btnInsertText);

                    this.btnInsertTextArt = new Common.UI.Button({
                        id: 'tlbtn-inserttextart',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-textart',
                        lock: [_set.paragraphLock, _set.headerLock, _set.inEquation, _set.controlPlain, _set.richDelLock, _set.plainDelLock, _set.contentLock, _set.inFootnote, _set.cantAddImagePara,
                            _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.viewMode],
                        caption: me.capBtnInsTextart,
                        menu: new Common.UI.Menu({
                            cls: 'menu-shapes',
                            items: [
                                {template: _.template('<div id="id-toolbar-menu-insart" class="margin-left-5" style="width: 239px;"></div>')}
                            ]
                        }),
                        action: 'insert-textart',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.paragraphControls.push(this.btnInsertTextArt);

                    this.btnEditHeader = new Common.UI.Button({
                        id: 'id-toolbar-btn-editheader',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-editheader',
                        lock: [ _set.previewReviewMode, _set.viewFormMode, _set.inEquation, _set.lostConnect, _set.disableOnStart, _set.docLockView, _set.docLockForms, _set.docLockComments, _set.viewMode],
                        caption: me.capBtnInsHeader,
                        menu: true,
                        action: 'edit-header',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.toolbarControls.push(this.btnEditHeader);

                    this.btnTextFromFile = new Common.UI.Button({
                        id: 'id-toolbar-btn-text-from-file',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-text-from-file',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.richDelLock, _set.plainDelLock,
                            _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.viewMode],
                        caption: me.capBtnInsTextFromFile,
                        menu: true,
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.paragraphControls.push(this.btnTextFromFile);

                    this.mnuPageNumberPosPicker = {
                        conf: {disabled: false},
                        isDisabled: function () {
                            return this.conf.disabled;
                        },
                        setDisabled: function (val) {
                            this.conf.disabled = val;
                        },
                        options: {}
                    };
                    this.mnuPageNumCurrentPos = clone(this.mnuPageNumberPosPicker);
                    this.mnuPageNumCurrentPos.options.lock = [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock];
                    this.paragraphControls.push(this.mnuPageNumCurrentPos);
                    this.mnuInsertPageCount = clone(this.mnuPageNumberPosPicker);
                    this.mnuInsertPageCount.options.lock = [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock];
                    this.paragraphControls.push(this.mnuInsertPageCount);
                    this.mnuInsertPageNum = clone(this.mnuPageNumberPosPicker);
                    this.mnuInsertPageNum.options.lock = [_set.cantAddPageNum, _set.controlPlain];
                    this.mnuPageNumberPosPicker.options.lock = [_set.headerFooterLock];

                    this.btnInsDateTime = new Common.UI.Button({
                        id: 'id-toolbar-btn-datetime',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-datetime',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.richDelLock, _set.plainDelLock, _set.noParagraphSelected, _set.previewReviewMode,
                            _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.viewMode],
                        caption: me.capBtnDateTime,
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.paragraphControls.push(this.btnInsDateTime);

                    this.btnInsField = new Common.UI.Button({
                        id: 'id-toolbar-btn-insfield',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-quick-field',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.richDelLock, _set.plainDelLock, _set.noParagraphSelected, _set.previewReviewMode,
                            _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.viewMode],
                        caption: me.capBtnInsField,
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.paragraphControls.push(this.btnInsField);

                    this.btnBlankPage = new Common.UI.Button({
                        id: 'id-toolbar-btn-blankpage',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-blankpage',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.inEquation, _set.richDelLock, _set.plainDelLock, _set.inHeader,  _set.inFootnote,  _set.inControl,
                            _set.cantPageBreak, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.viewMode],
                        caption: me.capBtnBlankPage,
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.paragraphControls.push(this.btnBlankPage);

                    this.btnInsertShape = new Common.UI.Button({
                        id: 'tlbtn-insertshape',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-insertshape',
                        lock: [_set.paragraphLock, _set.headerLock, _set.inEquation, _set.controlPlain,  _set.contentLock,  _set.inFootnote, _set.previewReviewMode, _set.viewFormMode,
                                _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.viewMode],
                        caption: me.capBtnInsShape,
                        enableToggle: true,
                        menu: new Common.UI.Menu({cls: 'menu-shapes menu-insert-shape'}),
                        action: 'insert-shape',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.paragraphControls.push(this.btnInsertShape);

                    this.btnInsertSmartArt = new Common.UI.Button({
                        id: 'tlbtn-insertsmartart',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-smart-art',
                        lock: [_set.paragraphLock, _set.headerLock, _set.inEquation, _set.controlPlain,  _set.contentLock,  _set.inFootnote, _set.previewReviewMode, _set.viewFormMode,
                            _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.viewMode],
                        caption: me.capBtnInsSmartArt,
                        menu: true,
                        action: 'insert-smartart',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.paragraphControls.push(this.btnInsertSmartArt);

                    this.btnInsertEquation = new Common.UI.Button({
                        id: 'tlbtn-insertequation',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-insertequation',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.inChart, _set.controlPlain, _set.richDelLock, _set.plainDelLock, _set.cantAddEquation,
                            _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.viewMode],
                        caption: me.capBtnInsEquation,
                        split: true,
                        menu: new Common.UI.Menu(),
                        action: 'insert-equation',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.paragraphControls.push(this.btnInsertEquation);

                    this.btnInsertSymbol = new Common.UI.Button({
                        id: 'tlbtn-insertsymbol',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-symbol',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.richDelLock, _set.plainDelLock, _set.noParagraphSelected, _set.previewReviewMode,
                            _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.viewMode],
                        caption: me.capBtnInsSymbol,
                        menu: new Common.UI.Menu({
                            style: 'min-width: 100px;',
                            items: [
                                {template: _.template('<div id="id-toolbar-menu-symbols"></div>')},
                                {caption: '--'},
                                new Common.UI.MenuItem({
                                    caption: this.textMoreSymbols
                                })
                            ]
                        }),
                        action: 'insert-symbol',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.paragraphControls.push(this.btnInsertSymbol);

                    this.btnDropCap = new Common.UI.Button({
                        id: 'tlbtn-dropcap',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-dropcap icon-rtl',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.inEquation, _set.controlPlain, _set.dropcapLock, _set.previewReviewMode, _set.viewFormMode,
                            _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.viewMode],
                        caption: me.capBtnInsDropcap,
                        menu: new Common.UI.Menu({
                            cls: 'ppm-toolbar shifted-right',
                            items: [
                                {
                                    caption: this.textNone,
                                    iconCls: 'menu__icon btn-columns-one',
                                    checkable: true,
                                    checkmark: false,
                                    toggleGroup: 'menuDropCap',
                                    value: Asc.c_oAscDropCap.None,
                                    checked: true
                                },
                                {
                                    caption: this.textInText,
                                    iconCls: 'menu__icon btn-dropcap-intext icon-rtl',
                                    checkable: true,
                                    checkmark: false,
                                    toggleGroup: 'menuDropCap',
                                    value: Asc.c_oAscDropCap.Drop
                                },
                                {
                                    caption: this.textInMargin,
                                    iconCls: 'menu__icon btn-dropcap-inmargin icon-rtl',
                                    checkable: true,
                                    checkmark: false,
                                    toggleGroup: 'menuDropCap',
                                    value: Asc.c_oAscDropCap.Margin
                                },
                                {caption: '--'},
                                this.mnuDropCapAdvanced = new Common.UI.MenuItem({caption: this.mniEditDropCap})
                            ]
                        }),
                        action: 'insert-dropcap',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.paragraphControls.push(this.btnDropCap);

                    this.btnContentControls = new Common.UI.Button({
                        id: 'tlbtn-controls',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-controls',
                        lock: [_set.paragraphLock, _set.headerLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.inSmartart, _set.inSmartartInternal, _set.viewMode],
                        caption: me.capBtnInsControls,
                        menu: new Common.UI.Menu({
                            cls: 'ppm-toolbar shifted-right',
                            items: [
                                {
                                    caption: this.textPlainControl,
                                    iconCls: 'menu__icon btn-cc-plaintext',
                                    value: 'plain'
                                },
                                {
                                    caption: this.textRichControl,
                                    iconCls: 'menu__icon btn-cc-richtext',
                                    value: 'rich'
                                },
                                {
                                    caption: this.textPictureControl,
                                    iconCls: 'menu__icon btn-menu-image',
                                    value: 'picture'
                                },
                                {
                                    caption: this.textComboboxControl,
                                    // iconCls: 'mnu-control-rich',
                                    value: 'combobox'
                                },
                                {
                                    caption: this.textDropdownControl,
                                    // iconCls: 'mnu-control-rich',
                                    value: 'dropdown'
                                },
                                {
                                    caption: this.textDateControl,
                                    // iconCls: 'mnu-control-rich',
                                    value: 'date'
                                },
                                {
                                    caption: this.textCheckboxControl,
                                    // iconCls: 'mnu-control-rich',
                                    value: 'checkbox'
                                },
                                {caption: '--'},
                                {
                                    caption: this.textRemoveControl,
                                    iconCls: 'menu__icon btn-cc-remove',
                                    value: 'remove'
                                },
                                {caption: '--'},
                                {
                                    caption: this.mniEditControls,
                                    value: 'settings'
                                },
                                {
                                    caption: this.mniHighlightControls,
                                    value: 'highlight',
                                    menu: this.mnuHighlightControls = new Common.UI.Menu({
                                        menuAlign   : 'tl-tr',
                                        items: [
                                            this.mnuNoControlsColor = new Common.UI.MenuItem({
                                                id: 'id-toolbar-menu-no-highlight-controls',
                                                caption: this.textNoHighlight,
                                                cls: 'shifted-right',
                                                checkable: true
                                            }),
                                            {caption: '--'},
                                            {template: _.template('<div id="id-toolbar-menu-controls-color" style="width: 164px; display: inline-block;"></div>')},
                                            {caption: '--'},
                                            {
                                                id: 'id-toolbar-menu-new-control-color',
                                                template: _.template('<a tabindex="-1" type="menuitem" style="' + (Common.UI.isRTL() ? 'padding-right:12px;' : 'padding-left:12px;') + '">' + this.textNewColor + '</a>')
                                            }
                                        ]
                                    })
                                }
                            ]
                        }),
                        action: 'insert-ccontrols',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.toolbarControls.push(this.btnContentControls);
                    // this.paragraphControls.push(this.btnContentControls);

                    this.btnColumns = new Common.UI.Button({
                        id: 'tlbtn-columns',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-columns',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.controlPlain, _set.inImage, _set.inHeader, _set.docPropsLock, _set.previewReviewMode, _set.viewFormMode,
                            _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.viewMode],
                        caption: me.capBtnColumns,
                        menu: new Common.UI.Menu({
                            cls: 'ppm-toolbar shifted-right',
                            items: [
                                {
                                    caption: this.textColumnsOne,
                                    iconCls: 'menu__icon btn-columns-one',
                                    checkable: true,
                                    checkmark: false,
                                    toggleGroup: 'menuColumns',
                                    value: 0
                                },
                                {
                                    caption: this.textColumnsTwo,
                                    iconCls: 'menu__icon btn-columns-two',
                                    checkable: true,
                                    checkmark: false,
                                    toggleGroup: 'menuColumns',
                                    value: 1
                                },
                                {
                                    caption: this.textColumnsThree,
                                    iconCls: 'menu__icon btn-columns-three',
                                    checkable: true,
                                    checkmark: false,
                                    toggleGroup: 'menuColumns',
                                    value: 2
                                },
                                {
                                    caption: this.textColumnsLeft,
                                    iconCls: 'menu__icon btn-columns-left',
                                    checkmark: false,
                                    checkable: true,
                                    toggleGroup: 'menuColumns',
                                    value: 3
                                },
                                {
                                    caption: this.textColumnsRight,
                                    iconCls: 'menu__icon btn-columns-right',
                                    checkmark: false,
                                    checkable: true,
                                    toggleGroup: 'menuColumns',
                                    value: 4
                                },
                                {caption: '--'},
                                {caption: this.textColumnsCustom, value: 'advanced'}
                            ]
                        }),
                        action: 'insert-columns',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.paragraphControls.push(this.btnColumns);

                    this.btnPageOrient = new Common.UI.Button({
                        id: 'tlbtn-pageorient',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-pageorient',
                        lock: [_set.docPropsLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.viewMode],
                        caption: me.capBtnPageOrient,
                        menu: new Common.UI.Menu({
                            cls: 'ppm-toolbar',
                            items: [
                                {
                                    caption: this.textPortrait,
                                    iconCls: 'menu__icon btn-page-portrait',
                                    checkable: true,
                                    checkmark: false,
                                    toggleGroup: 'menuOrient',
                                    value: true
                                },
                                {
                                    caption: this.textLandscape,
                                    iconCls: 'menu__icon btn-page-landscape',
                                    checkable: true,
                                    checkmark: false,
                                    toggleGroup: 'menuOrient',
                                    value: false
                                }
                            ]
                        }),
                        action: 'page-orient',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.toolbarControls.push(this.btnPageOrient);


                    var pageMarginsTemplate = _.template('<a id="<%= id %>" tabindex="-1" type="menuitem"><div><b><%= caption %></b></div>' +
                        '<% if (options.value !== null) { %><div class="margin-vertical">' +
                        '<label>' + this.textTop + '<%= parseFloat(Common.Utils.Metric.fnRecalcFromMM(options.value[0]).toFixed(2)) %> <%= Common.Utils.Metric.getCurrentMetricName() %></label>' +
                        '<label>' + this.textLeft + '<%= parseFloat(Common.Utils.Metric.fnRecalcFromMM(options.value[1]).toFixed(2)) %> <%= Common.Utils.Metric.getCurrentMetricName() %></label></div>' +
                        '<div class="margin-horizontal">' +
                        '<label>' + this.textBottom + '<%= parseFloat(Common.Utils.Metric.fnRecalcFromMM(options.value[2]).toFixed(2)) %> <%= Common.Utils.Metric.getCurrentMetricName() %></label>' +
                        '<label>' + this.textRight + '<%= parseFloat(Common.Utils.Metric.fnRecalcFromMM(options.value[3]).toFixed(2)) %> <%= Common.Utils.Metric.getCurrentMetricName() %></label></div>' +
                        '<% } %></a>');

                    this.btnPageMargins = new Common.UI.Button({
                        id: 'tlbtn-pagemargins',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-pagemargins',
                        lock: [_set.docPropsLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.viewMode],
                        caption: me.capBtnMargins,
                        menu: new Common.UI.Menu({
                            cls: 'menu-margins',
                            items: [
                                {
                                    caption: this.textMarginsLast,
                                    checkable: true,
                                    template: pageMarginsTemplate,
                                    toggleGroup: 'menuPageMargins'
                                }, //top,left,bottom,right
                                {
                                    caption: this.textMarginsNormal,
                                    checkable: true,
                                    template: pageMarginsTemplate,
                                    toggleGroup: 'menuPageMargins',
                                    value: (/^(ca|us)$/i.test(Common.Utils.InternalSettings.get("de-config-region"))) ? [25.4, 25.4, 25.4, 25.4] : [20, 30, 20, 15]
                                },
                                {
                                    caption: this.textMarginsNarrow,
                                    checkable: true,
                                    template: pageMarginsTemplate,
                                    toggleGroup: 'menuPageMargins',
                                    value: [12.7, 12.7, 12.7, 12.7]
                                },
                                {
                                    caption: this.textMarginsModerate,
                                    checkable: true,
                                    template: pageMarginsTemplate,
                                    toggleGroup: 'menuPageMargins',
                                    value: [25.4, 19.1, 25.4, 19.1]
                                },
                                {
                                    caption: this.textMarginsWide,
                                    checkable: true,
                                    template: pageMarginsTemplate,
                                    toggleGroup: 'menuPageMargins',
                                    value: [25.4, 50.8, 25.4, 50.8]
                                },
                                {caption: '--'},
                                {caption: this.textPageMarginsCustom, value: 'advanced'}
                            ]
                        }),
                        action: 'page-margins',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.toolbarControls.push(this.btnPageMargins);

                    var pageSizeTemplate = !Common.UI.isRTL() ? _.template('<a id="<%= id %>" tabindex="-1" type="menuitem"><div><b><%= caption %></b></div>' +
                        '<div dir="ltr"><%= parseFloat(Common.Utils.Metric.fnRecalcFromMM(options.value[0]).toFixed(2)) %> <%= Common.Utils.Metric.getCurrentMetricName() %> x ' +
                        '<%= parseFloat(Common.Utils.Metric.fnRecalcFromMM(options.value[1]).toFixed(2)) %> <%= Common.Utils.Metric.getCurrentMetricName() %></div></a>') :
                        _.template('<a id="<%= id %>" tabindex="-1" type="menuitem"><div><b><%= caption %></b></div>' +
                        '<div dir="ltr"><span dir="ltr"><%= Common.Utils.Metric.getCurrentMetricName() %> </span><span dir="ltr"><%= parseFloat(Common.Utils.Metric.fnRecalcFromMM(options.value[1]).toFixed(2)) %> x </span>' +
                        '<span dir="ltr"><%= Common.Utils.Metric.getCurrentMetricName() %> </span><span dir="ltr"><%= parseFloat(Common.Utils.Metric.fnRecalcFromMM(options.value[0]).toFixed(2)) %></span></div></a>');

                    this.btnPageSize = new Common.UI.Button({
                        id: 'tlbtn-pagesize',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-pagesize',
                        lock: [_set.docPropsLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.viewMode],
                        caption: me.capBtnPageSize,
                        menu: new Common.UI.Menu({
                            restoreHeight: true,
                            items: [
                                {
                                    caption: 'US Letter',
                                    subtitle: '21,59cm x 27,94cm',
                                    template: pageSizeTemplate,
                                    checkable: true,
                                    toggleGroup: 'menuPageSize',
                                    value: [215.9, 279.4]
                                },
                                {
                                    caption: 'US Legal',
                                    subtitle: '21,59cm x 35,56cm',
                                    template: pageSizeTemplate,
                                    checkable: true,
                                    toggleGroup: 'menuPageSize',
                                    value: [215.9, 355.6]
                                },
                                {
                                    caption: 'A4',
                                    subtitle: '21cm x 29,7cm',
                                    template: pageSizeTemplate,
                                    checkable: true,
                                    toggleGroup: 'menuPageSize',
                                    value: [210, 297],
                                    checked: true
                                },
                                {
                                    caption: 'A5',
                                    subtitle: '14,81cm x 20,99cm',
                                    template: pageSizeTemplate,
                                    checkable: true,
                                    toggleGroup: 'menuPageSize',
                                    value: [148, 210]
                                },
                                {
                                    caption: 'B5',
                                    subtitle: '17,6cm x 25,01cm',
                                    template: pageSizeTemplate,
                                    checkable: true,
                                    toggleGroup: 'menuPageSize',
                                    value: [176, 250]
                                },
                                {
                                    caption: 'Envelope #10',
                                    subtitle: '10,48cm x 24,13cm',
                                    template: pageSizeTemplate,
                                    checkable: true,
                                    toggleGroup: 'menuPageSize',
                                    value: [104.8, 241.3]
                                },
                                {
                                    caption: 'Envelope DL',
                                    subtitle: '11,01cm x 22,01cm',
                                    template: pageSizeTemplate,
                                    checkable: true,
                                    toggleGroup: 'menuPageSize',
                                    value: [110, 220]
                                },
                                {
                                    caption: 'Tabloid',
                                    subtitle: '27,94cm x 43,17cm',
                                    template: pageSizeTemplate,
                                    checkable: true,
                                    toggleGroup: 'menuPageSize',
                                    value: [279.4, 431.8]
                                },
                                {
                                    caption: 'A3',
                                    subtitle: '29,7cm x 42,01cm',
                                    template: pageSizeTemplate,
                                    checkable: true,
                                    toggleGroup: 'menuPageSize',
                                    value: [297, 420]
                                },
                                {
                                    caption: 'Tabloid Oversize',
                                    subtitle: '29,69cm x 45,72cm',
                                    template: pageSizeTemplate,
                                    checkable: true,
                                    toggleGroup: 'menuPageSize',
                                    value: [296.9, 457.2]
                                },
                                {
                                    caption: 'ROC 16K',
                                    subtitle: '19,68cm x 27,3cm',
                                    template: pageSizeTemplate,
                                    checkable: true,
                                    toggleGroup: 'menuPageSize',
                                    value: [196.8, 273]
                                },
                                {
                                    caption: 'Envelope Choukei 3',
                                    subtitle: '12cm x 23,5',
                                    template: pageSizeTemplate,
                                    checkable: true,
                                    toggleGroup: 'menuPageSize',
                                    value: [120, 235]
                                },
                                {
                                    caption: 'Super B/A3',
                                    subtitle: '30,5cm x 48,7cm',
                                    template: pageSizeTemplate,
                                    checkable: true,
                                    toggleGroup: 'menuPageSize',
                                    value: [305, 487]
                                },
                                {caption: '--'},
                                {caption: this.textPageSizeCustom, value: 'advanced'}
                            ]
                        }),
                        action: 'page-size',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.toolbarControls.push(this.btnPageSize);

                    this.btnLineNumbers = new Common.UI.Button({
                        id: 'tlbtn-line-numbers',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon ' + (!Common.UI.isRTL() ? 'btn-line-numbering' : 'btn-line-numbering-rtl'),
                        lock: [_set.docPropsLock, _set.inImagePara, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.viewMode],
                        caption: me.capBtnLineNumbers,
                        menu: new Common.UI.Menu({
                            cls: 'ppm-toolbar',
                            items: [
                                {
                                    caption: this.textNone,
                                    checkable: true,
                                    toggleGroup: 'menuLineNumbers',
                                    value: 0
                                },
                                {
                                    caption: this.textContinuous,
                                    checkable: true,
                                    toggleGroup: 'menuLineNumbers',
                                    value: 1
                                },
                                {
                                    caption: this.textRestartEachPage,
                                    checkable: true,
                                    toggleGroup: 'menuLineNumbers',
                                    value: 2
                                },
                                {
                                    caption: this.textRestartEachSection,
                                    checkable: true,
                                    toggleGroup: 'menuLineNumbers',
                                    value: 3
                                },
                                {
                                    caption: this.textSuppressForCurrentParagraph,
                                    checkable: true,
                                    allowDepress: true,
                                    value: 4
                                },
                                {caption: '--'},
                                {
                                    caption: this.textCustomLineNumbers,
                                    value: 5
                                }
                            ]
                        }),
                        action: 'line-numbers',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.toolbarControls.push(this.btnLineNumbers);

                    this.btnHyphenation = new Common.UI.Button({
                        id: 'tlbtn-line-hyphenation',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-hyphenation',
                        lock: [_set.docPropsLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewIns, _set.docLockForms, _set.docLockCommentsIns, _set.viewMode],
                        caption: this.capBtnHyphenation,
                        menu: new Common.UI.Menu({
                            cls: 'ppm-toolbar',
                            items: [
                                {
                                    caption: this.textNone,
                                    checkable: true,
                                    toggleGroup: 'menuHyphenation',
                                    value: 0
                                },
                                {
                                    caption: this.textAuto,
                                    checkable: true,
                                    toggleGroup: 'menuHyphenation',
                                    value: 1
                                },
                                {caption: '--'},
                                {
                                    caption: this.textCustomHyphen,
                                    value: 'custom'
                                }
                            ]
                        }),
                        action: 'change-hyphenation',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.toolbarControls.push(this.btnHyphenation);

                    this.btnClearStyle = new Common.UI.Button({
                        id: 'id-toolbar-btn-clearstyle',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-clearstyle',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.inChart, _set.inSmartart, _set.inSmartartInternal, _set.previewReviewMode, _set.viewFormMode,
                            _set.lostConnect, _set.disableOnStart, _set.docLockViewText, _set.docLockForms, _set.docLockCommentsText, _set.viewMode],
                        dataHint: '1',
                        dataHintDirection: 'bottom'
                    });
                    this.toolbarControls.push(this.btnClearStyle);

                    this.btnCopyStyle = new Common.UI.Button({
                        id: 'id-toolbar-btn-copystyle',
                        cls: 'btn-toolbar',
                        iconCls: 'toolbar__icon btn-copystyle',
                        lock: [ _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockForms, _set.viewMode],
                        enableToggle: true,
                        dataHint: '1',
                        dataHintDirection: 'bottom'
                    });
                    this.toolbarControls.push(this.btnCopyStyle);

                    this.btnColorSchemas = new Common.UI.Button({
                        id: 'id-toolbar-btn-colorschemas',
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-big-colorschemas',
                        lock: [_set.docSchemaLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockView, _set.docLockForms, _set.docLockComments, _set.viewMode],
                        caption: me.capColorScheme,
                        menu: new Common.UI.Menu({
                            cls: 'shifted-left',
                            items: [],
                            restoreHeight: true
                        }),
                        action: 'theme-colors',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.toolbarControls.push(this.btnColorSchemas);

                    me.btnImgAlign = new Common.UI.Button({
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-img-align',
                        lock: [_set.imageLock, _set.contentLock, _set.inImageInline, _set.noObjectSelected, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockView, _set.docLockForms, _set.docLockComments, _set.viewMode],
                        caption: me.capImgAlign,
                        menu: true,
                        action: 'object-align',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });

                    me.btnImgGroup = new Common.UI.Button({
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-img-group',
                        lock: [_set.imageLock, _set.contentLock, _set.inImageInline, _set.noObjectSelected, _set.cantGroup, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockView, _set.docLockForms, _set.docLockComments, _set.viewMode],
                        caption: me.capImgGroup,
                        menu: true,
                        action: 'object-group',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });

                    me.btnShapesMerge = new Common.UI.Button({
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-merge-shapes',
                        lock: [_set.imageLock, _set.contentLock, _set.noObjectSelected, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockView, _set.docLockForms, _set.docLockComments, _set.viewMode, _set.cantMergeShape],
                        caption: me.capShapesMerge,
                        menu: true,
                        action: 'shapes-merge',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });

                    me.btnImgForward = new Common.UI.Button({
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-img-frwd',
                        lock: [_set.cantArrange, _set.lostConnect, _set.contentLock, _set.noObjectSelected, _set.inSmartartInternal, _set.previewReviewMode, _set.viewFormMode, _set.disableOnStart, _set.docLockView, _set.docLockForms, _set.docLockComments, _set.viewMode],
                        caption: me.capImgForward,
                        split: true,
                        menu: true,
                        action: 'object-forward',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    me.btnImgBackward = new Common.UI.Button({
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-img-bkwd',
                        lock: [_set.cantArrange, _set.lostConnect, _set.contentLock, _set.noObjectSelected, _set.inSmartartInternal, _set.previewReviewMode, _set.viewFormMode, _set.disableOnStart, _set.docLockView, _set.docLockForms, _set.docLockComments, _set.viewMode],
                        caption: me.capImgBackward,
                        split: true,
                        menu: true,
                        action: 'object-backward',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    me.btnImgWrapping = new Common.UI.Button({
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-img-wrap',
                        lock: [_set.cantWrap, _set.imageLock, _set.contentLock, _set.noObjectSelected, _set.lostConnect, _set.previewReviewMode, _set.viewFormMode, _set.disableOnStart, _set.docLockView, _set.docLockForms, _set.docLockComments, _set.viewMode],
                        caption: me.capImgWrapping,
                        menu: true,
                        action: 'object-wrap',
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });

                    me.btnWatermark = new Common.UI.Button({
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-watermark',
                        lock: [_set.headerLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockView, _set.docLockForms, _set.docLockComments, _set.viewMode],
                        caption: me.capBtnWatermark,
                        action: 'insert-watermark',
                        menu: new Common.UI.Menu({
                            cls: 'ppm-toolbar',
                            items: [
                                {
                                    caption: this.textEditWatermark,
                                    value: 'edit'
                                },
                                {
                                    caption: this.textRemWatermark,
                                    value: 'remove'
                                }
                            ]
                        }),
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });

                    me.btnPageColor = new Common.UI.ButtonColored({
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-page-color',
                        lock: [_set.docPropsLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockView, _set.docLockForms, _set.docLockComments, _set.viewMode],
                        caption: me.capBtnPageColor,
                        menu: true,
                        eyeDropper: false,
                        colorLine: false,
                        additionalItemsBefore: [
                            me.mnuPageNoFill = new Common.UI.MenuItem({
                                caption: me.strMenuNoFill,
                                style: Common.UI.isRTL() ? 'padding-right:20px;' : 'padding-left:20px;',
                                checkable: true
                            }),
                            {caption: '--'}
                        ],
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });

                    me.toolbarControls.push(me.btnImgAlign,
                        me.btnImgGroup, me.btnImgForward, me.btnImgBackward, me.btnImgWrapping, me.btnWatermark, me.btnPageColor, me.btnShapesMerge);

                    //
                    // Menus
                    //

                    this.mnuLineSpace = this.btnLineSpace.menu;
                    this.mnuNonPrinting = this.btnShowHidenChars.menu;
                    this.mnuInsertTable = this.btnInsertTable.menu;
                    this.mnuInsertImage = this.btnInsertImage.menu;
                    this.mnuPageSize = this.btnPageSize.menu;
                    this.mnuColorSchema = this.btnColorSchemas.menu;
                    this.mnuChangeCase = this.btnChangeCase.menu;

                    this.cmbFontSize = new Common.UI.ComboBox({
                        cls: 'input-group-nr',
                        menuCls: 'scrollable-menu',
                        menuStyle: 'min-width: 55px;max-height: 454px;',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewText, _set.docLockForms, _set.docLockCommentsText, _set.viewMode],
                        hint: this.tipFontSize,
                        dataHint: '1',
                        dataHintDirection: 'top'
                    });
                    this.paragraphControls.push(this.cmbFontSize);

                    this.cmbFontName = new Common.UI.ComboBoxFonts({
                        cls: 'input-group-nr',
                        menuCls: 'scrollable-menu',
                        menuStyle: 'min-width: 325px;',
                        lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewText, _set.docLockForms, _set.docLockCommentsText, _set.viewMode],
                        hint: this.tipFontName,
                        store: new Common.Collections.Fonts(),
                        dataHint: '1',
                        dataHintDirection: 'top'
                    });
                    this.paragraphControls.push(this.cmbFontName);

                    this.listStylesAdditionalMenuItem = new Common.UI.MenuItem({
                        cls: 'save-style-container',
                        iconCls: 'menu__icon btn-zoomup',
                        caption: me.textStyleMenuNew
                    });

                    var itemWidth = 104,
                        itemHeight = 40;
                    this.listStyles = new Common.UI.ComboDataView({
                        cls: 'combo-styles',
                        lock: [_set.noStyles, _set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.inChart, _set.inSmartart, _set.inSmartartInternal, _set.previewReviewMode,
                            _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockViewText, _set.docLockForms, _set.docLockCommentsText, _set.viewMode],
                        itemWidth: itemWidth,
                        itemHeight: itemHeight,
                        style: 'min-width:139px;',
//                hint        : this.tipParagraphStyle,
                        dataHint: '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: '-16, -4',
                        enableKeyEvents: true,
                        additionalMenuItems: [this.listStylesAdditionalMenuItem],
                        delayRenderTips: true,
                        autoWidth:       true,
                        itemTemplate: _.template([
                            '<div class="style" id="<%= id %>">',
                                '<div style="background-image: url(<%= imageUrl %>); width: ' + itemWidth + 'px; height: ' + itemHeight + 'px;"></div>',
                            '</div>'
                        ].join('')),
                        beforeOpenHandler: function (e) {
                            var cmp = this,
                                menu = cmp.openButton.menu,
                                minMenuColumn = 6;

                            if (menu.cmpEl) {
                                var itemEl = $(cmp.cmpEl.find('.dataview.inner .style').get(0)).parent();
                                var itemMargin = parseFloat(itemEl.css('margin-right'));
                                // Common.Utils.applicationPixelRatio() > 1 && Common.Utils.applicationPixelRatio() !== 2 && (itemMargin = -1 / Common.Utils.applicationPixelRatio());
                                var _width = itemEl.is(':visible') ? parseFloat(itemEl.css('width')) :
                                    (cmp.itemWidth + parseFloat(itemEl.css('padding-left')) + parseFloat(itemEl.css('padding-right')) +
                                        parseFloat(itemEl.css('border-left-width')) + parseFloat(itemEl.css('border-right-width')));

                                var minCount = cmp.menuPicker.store.length >= minMenuColumn ? minMenuColumn : cmp.menuPicker.store.length,
                                    columnCount = Math.min(cmp.menuPicker.store.length, Math.round($('.dataview', $(cmp.fieldPicker.el)).width() / (itemMargin + _width)));

                                columnCount = columnCount < minCount ? minCount : columnCount;
                                menu.menuAlignEl = cmp.cmpEl;

                                menu.menuAlign = 'tl-tl';
                                var menuWidth = columnCount * (itemMargin + _width),
                                    buttonOffsetLeft = Common.Utils.getOffset(cmp.openButton.$el).left;
                                // if (menuWidth>buttonOffsetLeft)
                                //     menuWidth = Math.max(Math.floor(buttonOffsetLeft/(itemMargin + _width)), 2) * (itemMargin + _width);
                                if (menuWidth>Common.Utils.innerWidth())
                                    menuWidth = Math.max(Math.floor(Common.Utils.innerWidth()/(itemMargin + _width)), 2) * (itemMargin + _width);
                                menuWidth = Math.ceil(menuWidth * 10)/10;
                                var offset = cmp.cmpEl.width() - cmp.openButton.$el.width() - Math.min(menuWidth, buttonOffsetLeft);
                                if (Common.UI.isRTL()) {
                                    offset = cmp.openButton.$el.width();
                                }
                                menu.setOffset(Common.UI.isRTL() ? offset : Math.min(offset, 0));

                                menu.cmpEl.css({
                                    'width': menuWidth,
                                    'min-height': cmp.cmpEl.height()
                                });
                            }

                            if (cmp.menuPicker.scroller) {
                                cmp.menuPicker.scroller.update({
                                    includePadding: true,
                                    suppressScrollX: true
                                });
                            }

                            cmp.removeTips();
                        }
                    });

                    this.paragraphControls.push(this.listStyles);
                    this.textOnlyControls.push(this.listStyles);
                    this.lockToolbar(Common.enumLock.noStyles, !window.styles_loaded, {array: [this.listStyles]})

                    // Disable all components before load document
                    this.lockControls = me.toolbarControls.concat(me.paragraphControls);
                    Common.UI.LayoutManager.addControls(this.lockControls);
                    this.lockToolbar(Common.enumLock.disableOnStart, true, {array: this.lockControls});

                    var editStyleMenuUpdate = new Common.UI.MenuItem({
                        caption: me.textStyleMenuUpdate
                    }).on('click', _.bind(me.onStyleMenuUpdate, me));

                    var editStyleMenuRestore = new Common.UI.MenuItem({
                        caption: me.textStyleMenuDelete
                    }).on('click', _.bind(me.onStyleMenuDelete, me));

                    var editStyleMenuDelete = new Common.UI.MenuItem({
                        caption: me.textStyleMenuRestore
                    }).on('click', _.bind(me.onStyleMenuDelete, me));

                    var editStyleMenuRestoreAll = new Common.UI.MenuItem({
                        caption: me.textStyleMenuRestoreAll
                    }).on('click', _.bind(me.onStyleMenuRestoreAll, me));

                    var editStyleMenuDeleteAll = new Common.UI.MenuItem({
                        caption: me.textStyleMenuDeleteAll
                    }).on('click', _.bind(me.onStyleMenuDeleteAll, me));

                    if (this.styleMenu == null) {
                        this.styleMenu = new Common.UI.Menu({
                            items: [
                                editStyleMenuUpdate,
                                editStyleMenuRestore,
                                editStyleMenuDelete,
                                editStyleMenuRestoreAll,
                                editStyleMenuDeleteAll
                            ]
                        });
                    }
                    this.on('render:after', _.bind(this.onToolbarAfterRender, this));
                } else {
                    Common.UI.Mixtbar.prototype.initialize.call(this, {
                            template: _.template(template_view),
                            tabs: [
                                {caption: me.textTabFile, action: 'file', layoutname: 'toolbar-file', haspanel: false, dataHintTitle: 'F'}
                            ],
                            config: config
                        }
                    );
                    if (config.isRestrictedEdit && config.canFillForms && config.isPDFForm) {
                        this.btnSaveCls = config.canSaveToFile || config.isDesktopApp && config.isOffline ? 'btn-save' : 'btn-download';
                        this.btnSaveTip = config.canSaveToFile || config.isDesktopApp && config.isOffline ? this.tipSave + Common.Utils.String.platformKey('Ctrl+S') : this.tipDownload;

                        this.btnPrint = new Common.UI.Button({
                            id: 'id-toolbar-btn-print',
                            cls: 'btn-toolbar',
                            iconCls: 'toolbar__icon btn-print no-mask',
                            lock: [_set.cantPrint, _set.disableOnStart],
                            signals: ['disabled'],
                            split: config.canQuickPrint,
                            menu: config.canQuickPrint,
                            dataHint: '1',
                            dataHintDirection: 'bottom',
                            dataHintTitle: 'P',
                            printType: 'print'
                        });
                        this.toolbarControls.push(this.btnPrint);

                        this.btnSave = new Common.UI.Button({
                            id: 'id-toolbar-btn-save',
                            cls: 'btn-toolbar',
                            iconCls: 'toolbar__icon no-mask ' + this.btnSaveCls,
                            lock: [_set.cantSave, _set.previewReviewMode, _set.lostConnect, _set.disableOnStart, _set.viewMode],
                            signals: ['disabled'],
                            dataHint: '1',
                            dataHintDirection: 'top',
                            dataHintTitle: 'S'
                        });
                        this.toolbarControls.push(this.btnSave);
                        this.btnCollabChanges = this.btnSave;

                        this.btnUndo = new Common.UI.Button({
                            id: 'id-toolbar-btn-undo',
                            cls: 'btn-toolbar',
                            iconCls: 'toolbar__icon btn-undo icon-rtl',
                            lock: [_set.undoLock, _set.previewReviewMode, _set.lostConnect, _set.disableOnStart, _set.viewMode],
                            signals: ['disabled'],
                            dataHint: '1',
                            dataHintDirection: 'bottom',
                            dataHintTitle: 'Z'
                        });
                        this.toolbarControls.push(this.btnUndo);

                        this.btnRedo = new Common.UI.Button({
                            id: 'id-toolbar-btn-redo icon-rtl',
                            cls: 'btn-toolbar',
                            iconCls: 'toolbar__icon btn-redo',
                            lock: [_set.redoLock, _set.previewReviewMode, _set.lostConnect, _set.disableOnStart, _set.viewMode],
                            signals: ['disabled'],
                            dataHint: '1',
                            dataHintDirection: 'bottom',
                            dataHintTitle: 'Y'
                        });
                        this.toolbarControls.push(this.btnRedo);

                        this.btnCopy = new Common.UI.Button({
                            id: 'id-toolbar-btn-copy',
                            cls: 'btn-toolbar',
                            iconCls: 'toolbar__icon btn-copy',
                            lock: [_set.copyLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart],
                            dataHint: '1',
                            dataHintDirection: 'top',
                            dataHintTitle: 'C'
                        });
                        this.toolbarControls.push(this.btnCopy);

                        this.btnPaste = new Common.UI.Button({
                            id: 'id-toolbar-btn-paste',
                            cls: 'btn-toolbar',
                            iconCls: 'toolbar__icon btn-paste',
                            lock: [_set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockView, _set.docLockComments, _set.viewMode],
                            dataHint: '1',
                            dataHintDirection: 'top',
                            dataHintTitle: 'V'
                        });
                        this.paragraphControls.push(this.btnPaste);

                        this.btnCut = new Common.UI.Button({
                            id: 'id-toolbar-btn-cut',
                            cls: 'btn-toolbar',
                            iconCls: 'toolbar__icon btn-cut',
                            lock: [_set.copyLock, _set.paragraphLock, _set.headerLock, _set.richEditLock, _set.plainEditLock, _set.imageLock, _set.previewReviewMode, _set.viewFormMode, _set.lostConnect, _set.disableOnStart, _set.docLockView, _set.docLockComments, _set.viewMode],
                            dataHint: '1',
                            dataHintDirection: 'top',
                            dataHintTitle: 'X'
                        });
                        this.paragraphControls.push(this.btnCut);

                        this.btnSelectAll = new Common.UI.Button({
                            id: 'id-toolbar-btn-select-all',
                            cls: 'btn-toolbar',
                            iconCls: 'toolbar__icon btn-select-all',
                            lock: [_set.viewFormMode, _set.disableOnStart],
                            dataHint: '1',
                            dataHintDirection: 'bottom'
                        });
                        this.toolbarControls.push(this.btnSelectAll);

                        this.btnSelectTool = new Common.UI.Button({
                            id: 'tlbtn-selecttool',
                            cls: 'btn-toolbar x-huge icon-top',
                            iconCls: 'toolbar__icon btn-select',
                            lock: [_set.disableOnStart],
                            caption: me.capBtnSelect,
                            toggleGroup: 'select-tools-tb',
                            enableToggle: true,
                            allowDepress: false,
                            dataHint: '1',
                            dataHintDirection: 'bottom',
                            dataHintOffset: 'small'
                        });
                        this.toolbarControls.push(this.btnSelectTool);

                        this.btnHandTool = new Common.UI.Button({
                            id: 'tlbtn-handtool',
                            cls: 'btn-toolbar x-huge icon-top',
                            iconCls: 'toolbar__icon btn-big-hand-tool',
                            lock: [_set.disableOnStart],
                            caption: me.capBtnHand,
                            toggleGroup: 'select-tools-tb',
                            enableToggle: true,
                            allowDepress: false,
                            dataHint: '1',
                            dataHintDirection: 'bottom',
                            dataHintOffset: 'small'
                        });
                        this.toolbarControls.push(this.btnHandTool);

                        // this.btnEditMode = new Common.UI.Button({
                        //     cls: 'btn-toolbar x-huge icon-top',
                        //     iconCls: 'toolbar__icon btn-edit-text',
                        //     style: 'min-width: 45px;',
                        //     lock: [_set.lostConnect, _set.disableOnStart],
                        //     caption: this.textEditMode,
                        //     dataHint: '1',
                        //     dataHintDirection: 'bottom',
                        //     dataHintOffset: 'small'
                        // });
                        // this.toolbarControls.push(this.btnEditMode);

                        this.lockControls = this.toolbarControls.concat(this.paragraphControls);
                        Common.UI.LayoutManager.addControls(this.lockControls);
                        this.lockToolbar(Common.enumLock.disableOnStart, true, {array: this.lockControls});
                    }
                }
                return this;
            },

            render: function (mode) {
                var me = this;

                /**
                 * Render UI layout
                 */

                this.fireEvent('render:before', [this]);

                me.isCompactView = mode.isCompactView;
                if ( mode.isEdit ) {
                    me.$el.html(me.rendererComponents(me.$layout));
                } else if (mode.isRestrictedEdit && mode.canFillForms && mode.isPDFForm) {
                    me.$el.html(me.rendererComponentsRestrictedEditForms(me.$layout));
                } else {
                    me.$layout.find('.canedit').hide();
                    me.isCompactView && me.$layout.addClass('folded');
                    me.$el.html(me.$layout);
                }

                this.fireEvent('render:after', [this]);
                Common.UI.Mixtbar.prototype.afterRender.call(this);

                Common.NotificationCenter.on({
                    'window:resize': function() {
                        Common.UI.Mixtbar.prototype.onResize.apply(me, arguments);
                    }
                });

                if ( mode.isEdit ) {
                    /** coauthoring begin **/
                    this.showSynchTip = !Common.localStorage.getBool("de-hide-synch");
                    this.needShowSynchTip = false;
                    /** coauthoring end **/

                    me.setTab('home');

                    me.onUpdateLastCustomMargins();
                    Common.NotificationCenter.on('margins:update', _.bind(me.onUpdateLastCustomMargins, me));
                    Common.NotificationCenter.on('desktop:window', _.bind(me.onDesktopWindow, me));
                }

                if ( me.isCompactView )
                    me.setFolded(true);

                return this;
            },

            onTabClick: function (e) {
                var me = this,
                    tab = $(e.currentTarget).find('> a[data-tab]').data('tab'),
                    is_file_active = me.isTabActive('file');

                if (!me._isDocReady || tab === 'file' && !Common.Controllers.LaunchController.isScriptLoaded()) return;

                Common.UI.Mixtbar.prototype.onTabClick.apply(me, arguments);

                if ( is_file_active ) {
                    me.fireEvent('file:close');
                } else
                if ( tab == 'file' ) {
                    me.fireEvent('file:open');
                    me.setTab(tab);
                }

                if ( me.isTabActive('home'))
                    me.fireEvent('home:open');
            },

            rendererComponentsRestrictedEditForms: function(html) {
                var $host = $(html);
                var _injectComponent = function (id, cmp) {
                    Common.Utils.injectComponent($host.findById(id), cmp);
                };
                _injectComponent('#slot-btn-print', this.btnPrint);
                _injectComponent('#slot-btn-save', this.btnSave);
                _injectComponent('#slot-btn-undo', this.btnUndo);
                _injectComponent('#slot-btn-redo', this.btnRedo);
                _injectComponent('#slot-btn-copy', this.btnCopy);
                _injectComponent('#slot-btn-paste', this.btnPaste);
                _injectComponent('#slot-btn-cut', this.btnCut);
                _injectComponent('#slot-btn-select-all', this.btnSelectAll);
                _injectComponent('#slot-btn-select-tool', this.btnSelectTool);
                _injectComponent('#slot-btn-hand-tool', this.btnHandTool);
                // _injectComponent('#slot-btn-tb-edit-mode', this.btnEditMode);

                return $host;
            },

            rendererComponents: function (html) {
                var $host = $(html);
                var _injectComponent = function (id, cmp) {
                    Common.Utils.injectComponent($host.findById(id), cmp);
                };

                _injectComponent('#slot-btn-text-from-file', this.btnTextFromFile);
                _injectComponent('#slot-field-fontname', this.cmbFontName);
                _injectComponent('#slot-field-fontsize', this.cmbFontSize);
                _injectComponent('#slot-btn-print', this.btnPrint);
                _injectComponent('#slot-btn-save', this.btnSave);
                _injectComponent('#slot-btn-undo', this.btnUndo);
                _injectComponent('#slot-btn-redo', this.btnRedo);
                _injectComponent('#slot-btn-copy', this.btnCopy);
                _injectComponent('#slot-btn-paste', this.btnPaste);
                _injectComponent('#slot-btn-cut', this.btnCut);
                _injectComponent('#slot-btn-select-all', this.btnSelectAll);
                _injectComponent('#slot-btn-replace', this.btnReplace);
                _injectComponent('#slot-btn-incfont', this.btnIncFontSize);
                _injectComponent('#slot-btn-decfont', this.btnDecFontSize);
                _injectComponent('#slot-btn-bold', this.btnBold);
                _injectComponent('#slot-btn-italic', this.btnItalic);
                _injectComponent('#slot-btn-underline', this.btnUnderline);
                _injectComponent('#slot-btn-strikeout', this.btnStrikeout);
                _injectComponent('#slot-btn-superscript', this.btnSuperscript);
                _injectComponent('#slot-btn-subscript', this.btnSubscript);
                _injectComponent('#slot-btn-highlight', this.btnHighlightColor);
                _injectComponent('#slot-btn-fontcolor', this.btnFontColor);
                _injectComponent('#slot-btn-changecase', this.btnChangeCase);
                _injectComponent('#slot-btn-align-left', this.btnAlignLeft);
                _injectComponent('#slot-btn-align-center', this.btnAlignCenter);
                _injectComponent('#slot-btn-align-right', this.btnAlignRight);
                _injectComponent('#slot-btn-align-just', this.btnAlignJust);
                _injectComponent('#slot-btn-incoffset', this.btnIncLeftOffset);
                _injectComponent('#slot-btn-decoffset', this.btnDecLeftOffset);
                _injectComponent('#slot-btn-linespace', this.btnLineSpace);
                _injectComponent('#slot-btn-direction', this.btnTextDir);
                _injectComponent('#slot-btn-hidenchars', this.btnShowHidenChars);
                _injectComponent('#slot-btn-markers', this.btnMarkers);
                _injectComponent('#slot-btn-numbering', this.btnNumbers);
                _injectComponent('#slot-btn-multilevels', this.btnMultilevels);
                _injectComponent('#slot-btn-instable', this.btnInsertTable);
                _injectComponent('#slot-btn-insimage', this.btnInsertImage);
                _injectComponent('#slot-btn-inschart', this.btnInsertChart);
                _injectComponent('#slot-btn-instext', this.btnInsertText);
                _injectComponent('#slot-btn-instextart', this.btnInsertTextArt);
                _injectComponent('#slot-btn-dropcap', this.btnDropCap);
                _injectComponent('#slot-btn-controls', this.btnContentControls);
                _injectComponent('#slot-btn-columns', this.btnColumns);
                _injectComponent('#slot-btn-line-numbers', this.btnLineNumbers);
                _injectComponent('#slot-btn-editheader', this.btnEditHeader);
                _injectComponent('#slot-btn-datetime', this.btnInsDateTime);
                _injectComponent('#slot-btn-insfield', this.btnInsField);
                _injectComponent('#slot-btn-blankpage', this.btnBlankPage);
                _injectComponent('#slot-btn-insshape', this.btnInsertShape);
                _injectComponent('#slot-btn-inssmartart', this.btnInsertSmartArt);
                _injectComponent('#slot-btn-insequation', this.btnInsertEquation);
                _injectComponent('#slot-btn-inssymbol', this.btnInsertSymbol);
                _injectComponent('#slot-btn-pageorient', this.btnPageOrient);
                _injectComponent('#slot-btn-pagemargins', this.btnPageMargins);
                _injectComponent('#slot-btn-pagesize', this.btnPageSize);
                _injectComponent('#slot-btn-clearstyle', this.btnClearStyle);
                _injectComponent('#slot-btn-copystyle', this.btnCopyStyle);
                _injectComponent('#slot-btn-colorschemas', this.btnColorSchemas);
                _injectComponent('#slot-btn-paracolor', this.btnParagraphColor);
                _injectComponent('#slot-btn-borders', this.btnBorders);
                _injectComponent('#slot-field-styles', this.listStyles);
                _injectComponent('#slot-img-align', this.btnImgAlign);
                _injectComponent('#slot-img-group', this.btnImgGroup); 
                _injectComponent('#slot-img-movefrwd', this.btnImgForward);
                _injectComponent('#slot-img-movebkwd', this.btnImgBackward);
                _injectComponent('#slot-img-wrapping', this.btnImgWrapping);
                _injectComponent('#slot-shapes-merge', this.btnShapesMerge);
                _injectComponent('#slot-btn-watermark', this.btnWatermark);
                _injectComponent('#slot-btn-hyphenation', this.btnHyphenation);
                _injectComponent('#slot-spin-ind-left', this.numIndentsLeft);
                _injectComponent('#slot-spin-ind-right', this.numIndentsRight);
                _injectComponent('#slot-lbl-ind-left', this.lblIndentsLeft);
                _injectComponent('#slot-lbl-ind-right', this.lblIndentsRight);
                _injectComponent('#slot-spin-space-before', this.numSpacingBefore);
                _injectComponent('#slot-spin-space-after', this.numSpacingAfter);
                _injectComponent('#slot-lbl-space-before', this.lblSpacingBefore);
                _injectComponent('#slot-lbl-space-after', this.lblSpacingAfter);
                _injectComponent('#slot-btn-pagecolor', this.btnPageColor);

                this.btnsPageBreak = Common.Utils.injectButtons($host.find('.btn-slot.btn-pagebreak'), '', 'toolbar__icon btn-pagebreak', this.capBtnInsPagebreak,
                    [Common.enumLock.paragraphLock, Common.enumLock.headerLock, Common.enumLock.richEditLock, Common.enumLock.plainEditLock, Common.enumLock.inEquation, Common.enumLock.richDelLock,
                        Common.enumLock.plainDelLock, Common.enumLock.inHeader, Common.enumLock.inFootnote, Common.enumLock.inControl, Common.enumLock.cantPageBreak, Common.enumLock.previewReviewMode,
                        Common.enumLock.viewFormMode, Common.enumLock.lostConnect, Common.enumLock.disableOnStart, Common.enumLock.docLockViewIns, Common.enumLock.docLockForms, Common.enumLock.docLockCommentsIns, Common.enumLock.viewMode],
                        true, true, undefined, '1', 'bottom', 'small', undefined, 'page-break');
                Array.prototype.push.apply(this.paragraphControls, this.btnsPageBreak);
                Array.prototype.push.apply(this.lockControls, this.btnsPageBreak);
                Common.UI.LayoutManager.addControls(this.btnsPageBreak);
                this.btnPrint.menu && this.btnPrint.$el.addClass('split');
                return $host;
            },

            onAppReady: function (config) {
                var me = this;
                me._isDocReady = true;
                if (me.cmbFontSize) {
                    var lang = config.lang ? config.lang.toLowerCase() : 'en',
                        langPrefix = lang.split(/[\-_]/)[0],
                        fontSizeData = [
                                           {value: 8, displayValue: "8"},
                                           {value: 9, displayValue: "9"},
                                           {value: 10, displayValue: "10"},
                                           {value: 11, displayValue: "11"},
                                           {value: 12, displayValue: "12"},
                                           {value: 14, displayValue: "14"},
                                           {value: 16, displayValue: "16"},
                                           {value: 18, displayValue: "18"},
                                           {value: 20, displayValue: "20"},
                                           {value: 22, displayValue: "22"},
                                           {value: 24, displayValue: "24"},
                                           {value: 26, displayValue: "26"},
                                           {value: 28, displayValue: "28"},
                                           {value: 36, displayValue: "36"},
                                           {value: 48, displayValue: "48"},
                                           {value: 72, displayValue: "72"},
                                           {value: 96, displayValue: "96"}
                                       ];

                    if (langPrefix === 'zh' && lang !== 'zh-tw' && lang !== 'zh_tw') {
                        Common.Utils.InternalSettings.set("de-settings-western-font-size", Common.localStorage.getBool("de-settings-western-font-size", !!config.customization && !!config.customization.forceWesternFontSize));
                        me._fontSizeChinese = [
                            {value: '42_str', displayValue: "初号"},
                            {value: '36_str', displayValue: "小初"},
                            {value: '26_str', displayValue: "一号"},
                            {value: '24_str', displayValue: "小一"},
                            {value: '22_str', displayValue: "二号"},
                            {value: '18_str', displayValue: "小二"},
                            {value: '16_str', displayValue: "三号"},
                            {value: '15_str', displayValue: "小三"},
                            {value: '14_str', displayValue: "四号"},
                            {value: '12_str', displayValue: "小四"},
                            {value: '10.5_str', displayValue: "五号"},
                            {value: '9_str', displayValue: "小五"},
                            {value: '7.5_str', displayValue: "六号"},
                            {value: '6.5_str', displayValue: "小六"},
                            {value: '5.5_str', displayValue: "七号"},
                            {value: '5_str', displayValue: "八号"}
                        ];
                        me._fontSizeWestern = [
                            {value: 5, displayValue: "5"},
                            {value: 5.5, displayValue: "5.5"},
                            {value: 6.5, displayValue: "6.5"},
                            {value: 7.5, displayValue: "7.5"},
                            {value: 8, displayValue: "8"},
                            {value: 9, displayValue: "9"},
                            {value: 10, displayValue: "10"},
                            {value: 10.5, displayValue: "10.5"},
                            {value: 11, displayValue: "11"},
                            {value: 12, displayValue: "12"},
                            {value: 14, displayValue: "14"},
                            {value: 15, displayValue: "15"},
                            {value: 16, displayValue: "16"},
                            {value: 18, displayValue: "18"},
                            {value: 20, displayValue: "20"},
                            {value: 22, displayValue: "22"},
                            {value: 24, displayValue: "24"},
                            {value: 26, displayValue: "26"},
                            {value: 28, displayValue: "28"},
                            {value: 36, displayValue: "36"},
                            {value: 42, displayValue: "42"},
                            {value: 48, displayValue: "48"},
                            {value: 72, displayValue: "72"},
                            {value: 96, displayValue: "96"}
                        ];
                        fontSizeData = Common.Utils.InternalSettings.get("de-settings-western-font-size") ? me._fontSizeWestern.concat(me._fontSizeChinese) : me._fontSizeChinese.concat(me._fontSizeWestern);
                    }
                    me.cmbFontSize.setData(fontSizeData);
                }
                (new Promise( function(resolve, reject) {
                    resolve();
                })).then(function () {
                    if(me.btnPrint && me.btnPrint.menu){
                        me.btnPrint.setMenu(
                            new Common.UI.Menu({
                                items:[
                                    {
                                        caption:            me.tipPrint,
                                        iconCls:            'menu__icon btn-print',
                                        toggleGroup:        'viewPrint',
                                        value:              'print',
                                        iconClsForMainBtn:  'btn-print',
                                        platformKey:         Common.Utils.String.platformKey('Ctrl+P')
                                    },
                                    {
                                        caption:            me.tipPrintQuick,
                                        iconCls:            'menu__icon btn-quick-print',
                                        toggleGroup:        'viewPrint',
                                        value:              'print-quick',
                                        iconClsForMainBtn:  'btn-quick-print',
                                        platformKey:        ''
                                    }
                                ]
                            }));
                    }

                    if ( !config.isEdit ) return;

                    me.btnsPageBreak.forEach( function(btn) {
                        btn.updateHint( [me.textInsPageBreak, me.tipPageBreak] );

                        var _menu_section_break = new Common.UI.Menu({
                            menuAlign: 'tl-tr',
                            items: [
                                {caption: me.textNextPage, value: Asc.c_oAscSectionBreakType.NextPage},
                                {caption: me.textContPage, value: Asc.c_oAscSectionBreakType.Continuous},
                                {caption: me.textEvenPage, value: Asc.c_oAscSectionBreakType.EvenPage},
                                {caption: me.textOddPage, value: Asc.c_oAscSectionBreakType.OddPage}
                            ]
                        });

                        var _menu = new Common.UI.Menu({
                            items: [
                                {caption: me.textInsPageBreak, value: 'page'},
                                {caption: me.textInsColumnBreak, value: 'column'},
                                {caption: me.textInsSectionBreak, value: 'section', menu: _menu_section_break}
                            ]
                        });

                        btn.setMenu(_menu);
                    });

                    var _holder_view = DE.getController('DocumentHolder').getView();
                    me.btnImgForward.updateHint(me.tipSendForward);
                    me.btnImgForward.setMenu(new Common.UI.Menu({
                        items: [{
                                caption : _holder_view.textArrangeFront,
                                iconCls : 'menu__icon btn-arrange-front',
                                valign  : Asc.c_oAscChangeLevel.BringToFront
                            }, {
                                caption : _holder_view.textArrangeForward,
                                iconCls : 'menu__icon btn-arrange-forward',
                                valign  : Asc.c_oAscChangeLevel.BringForward
                            }
                        ]})
                    );

                    me.btnImgBackward.updateHint(me.tipSendBackward);
                    me.btnImgBackward.setMenu(new Common.UI.Menu({
                        items: [{
                                caption : _holder_view.textArrangeBack,
                                iconCls : 'menu__icon btn-arrange-back',
                                valign  : Asc.c_oAscChangeLevel.SendToBack
                            }, {
                                caption : _holder_view.textArrangeBackward,
                                iconCls : 'menu__icon btn-arrange-backward',
                                valign  : Asc.c_oAscChangeLevel.BringBackward
                            }]
                    }));

                    me.btnImgAlign.updateHint(me.tipImgAlign);

                    me.mniAlignToPage = new Common.UI.MenuItem({
                        caption: me.txtPageAlign,
                        checkable: true,
                        toggleGroup: 'imgalign',
                        value: -1
                    }).on('click', function (mnu) {
                        Common.Utils.InternalSettings.set("de-img-align-to", 1);
                    });
                    me.mniAlignToMargin = new Common.UI.MenuItem({
                        caption: me.txtMarginAlign,
                        checkable: true,
                        toggleGroup: 'imgalign',
                        value: -1
                    }).on('click', function (mnu) {
                        Common.Utils.InternalSettings.set("de-img-align-to", 2);
                    });
                    me.mniAlignObjects = new Common.UI.MenuItem({
                        caption: me.txtObjectsAlign,
                        checkable: true,
                        toggleGroup: 'imgalign',
                        value: -1
                    }).on('click', function (mnu) {
                        Common.Utils.InternalSettings.set("de-img-align-to", 3);
                    });

                    me.mniDistribHor = new Common.UI.MenuItem({
                        caption: me.txtDistribHor,
                        iconCls: 'menu__icon btn-shape-distribute-hor',
                        value: 6
                    });
                    me.mniDistribVert = new Common.UI.MenuItem({
                        caption: me.txtDistribVert,
                        iconCls: 'menu__icon btn-shape-distribute-vert',
                        value: 7
                    });

                    me.btnImgAlign.setMenu(new Common.UI.Menu({
                        cls: 'shifted-right',
                        items: [{
                                caption : _holder_view.textShapeAlignLeft,
                                iconCls : 'menu__icon btn-shape-align-left',
                                value: Asc.c_oAscAlignShapeType.ALIGN_LEFT
                            }, {
                                caption : _holder_view.textShapeAlignCenter,
                                iconCls : 'menu__icon btn-shape-align-center',
                                value: Asc.c_oAscAlignShapeType.ALIGN_CENTER
                            }, {
                                caption : _holder_view.textShapeAlignRight,
                                iconCls : 'menu__icon btn-shape-align-right',
                                value: Asc.c_oAscAlignShapeType.ALIGN_RIGHT
                            }, {
                                caption : _holder_view.textShapeAlignTop,
                                iconCls : 'menu__icon btn-shape-align-top',
                                value: Asc.c_oAscAlignShapeType.ALIGN_TOP
                            }, {
                                caption : _holder_view.textShapeAlignMiddle,
                                iconCls : 'menu__icon btn-shape-align-middle',
                                value: Asc.c_oAscAlignShapeType.ALIGN_MIDDLE
                            }, {
                                caption : _holder_view.textShapeAlignBottom,
                                iconCls : 'menu__icon btn-shape-align-bottom',
                                value: Asc.c_oAscAlignShapeType.ALIGN_BOTTOM
                            },
                            {caption: '--'},
                            me.mniDistribHor,
                            me.mniDistribVert,
                            {caption: '--'},
                            me.mniAlignToPage,
                            me.mniAlignToMargin,
                            me.mniAlignObjects
                        ]
                    }));

                    me.btnShapesMerge.updateHint(me.tipShapesMerge);
                    me.btnShapesMerge.setMenu(new Common.UI.Menu({
                        cls: 'shifted-right',
                        items: [
                            {
                                caption: me.textShapesUnion, 
                                iconCls: 'menu__icon btn-union-shapes',
                                value: 'unite',
                            },
                            {
                                caption: me.textShapesCombine, 
                                iconCls: 'menu__icon btn-combine-shapes',
                                value: 'exclude',
                            },
                            {
                                caption: me.textShapesFragment, 
                                iconCls: 'menu__icon btn-fragment-shapes',
                                value: 'divide',
                            },
                            {
                                caption: me.textShapesIntersect, 
                                iconCls: 'menu__icon btn-intersect-shapes',
                                value: 'intersect',
                            },
                            {
                                caption: me.textShapesSubstract, 
                                iconCls: 'menu__icon btn-substract-shapes',
                                value: 'subtract',
                            },
                        ]
                    }));

                    me.btnImgGroup.updateHint(me.tipImgGroup);
                    me.btnImgGroup.setMenu(new Common.UI.Menu({
                        items: [{
                            caption : _holder_view.txtGroup,
                            iconCls : 'menu__icon btn-shape-group',
                            groupval: 1
                        }, {
                            caption : _holder_view.txtUngroup,
                            iconCls : 'menu__icon btn-shape-ungroup',
                            groupval: -1
                        }]
                    }));

                    me.btnImgWrapping.updateHint(me.tipImgWrapping);
                    me.btnImgWrapping.setMenu(new Common.UI.Menu({
                        cls: 'ppm-toolbar shifted-right',
                        items: [{
                                caption     : _holder_view.txtInline,
                                iconCls     : 'menu__icon btn-small-wrap-inline',
                                toggleGroup : 'imgwrapping',
                                wrapType    : Asc.c_oAscWrapStyle2.Inline,
                                checkmark   : false,
                                checkable   : true
                            },
                            { caption: '--' },
                            {
                                caption     : _holder_view.txtSquare,
                                iconCls     : 'menu__icon btn-small-wrap-square',
                                toggleGroup : 'imgwrapping',
                                wrapType    : Asc.c_oAscWrapStyle2.Square,
                                checkmark   : false,
                                checkable   : true
                            }, {
                                caption     : _holder_view.txtTight,
                                iconCls     : 'menu__icon btn-small-wrap-tight',
                                toggleGroup : 'imgwrapping',
                                wrapType    : Asc.c_oAscWrapStyle2.Tight,
                                checkmark   : false,
                                checkable   : true
                            }, {
                                caption     : _holder_view.txtThrough,
                                iconCls     : 'menu__icon btn-small-wrap-through',
                                toggleGroup : 'imgwrapping',
                                wrapType    : Asc.c_oAscWrapStyle2.Through,
                                checkmark   : false,
                                checkable   : true
                            }, {
                                caption     : _holder_view.txtTopAndBottom,
                                iconCls     : 'menu__icon btn-small-wrap-topandbottom',
                                toggleGroup : 'imgwrapping',
                                wrapType    : Asc.c_oAscWrapStyle2.TopAndBottom,
                                checkmark   : false,
                                checkable   : true
                            },
                            { caption: '--' },
                            {
                                caption     : _holder_view.txtInFront,
                                iconCls     : 'menu__icon btn-small-wrap-infront',
                                toggleGroup : 'imgwrapping',
                                wrapType    : Asc.c_oAscWrapStyle2.InFront,
                                checkmark   : false,
                                checkable   : true
                            }, {
                                caption     : _holder_view.txtBehind,
                                iconCls     : 'menu__icon btn-small-wrap-behind',
                                toggleGroup : 'imgwrapping',
                                wrapType    : Asc.c_oAscWrapStyle2.Behind,
                                checkmark   : false,
                                checkable   : true
                            },
                            { caption: '--' },
                            {
                                caption     : _holder_view.textEditWrapBoundary,
                                wrapType    : 'edit'
                            }
                        ]
                    }));

                    me.btnWatermark.updateHint(me.tipWatermark);

                    me.btnTextFromFile.setMenu(new Common.UI.Menu({
                        items: [
                            { caption: me.mniTextFromLocalFile, value: 'file' },
                            { caption: me.mniTextFromURL, value: 'url' },
                            { caption: me.mniTextFromStorage, value: 'storage' }
                        ]
                    }));
                    me.btnTextFromFile.menu.items[2].setVisible(config.canRequestSelectDocument || config.fileChoiceUrl && config.fileChoiceUrl.indexOf("{documentType}")>-1);
                    me.btnTextFromFile.menu.items[1].setDisabled(config.disableNetworkFunctionality);
                    me.btnTextFromFile.menu.items[2].setDisabled(config.disableNetworkFunctionality);
                    me.btnTextFromFile.updateHint(me.tipTextFromFile);

                    if (!config.canFeatureContentControl && me.btnContentControls.cmpEl) {
                        me.btnContentControls.cmpEl.parents('.group').hide().prev('.separator').hide();
                    }
                });
            },

            createDelayedElementsRestrictedEditForms: function() {
                if (!this.mode.isRestrictedEdit || !this.mode.canFillForms || !this.mode.isPDFForm) return;

                this.btnPrint.updateHint(this.tipPrint + Common.Utils.String.platformKey('Ctrl+P'));
                this.btnSave.updateHint(this.btnSaveTip);
                this.btnUndo.updateHint(this.tipUndo + Common.Utils.String.platformKey('Ctrl+Z'));
                this.btnRedo.updateHint(this.tipRedo + Common.Utils.String.platformKey('Ctrl+Y'));
                this.btnCopy.updateHint(this.tipCopy + Common.Utils.String.platformKey('Ctrl+C'));
                this.btnPaste.updateHint(this.tipPaste + Common.Utils.String.platformKey('Ctrl+V'));
                this.btnCut.updateHint(this.tipCut + Common.Utils.String.platformKey('Ctrl+X'));
                this.btnSelectAll.updateHint(this.tipSelectAll + Common.Utils.String.platformKey('Ctrl+A'));
                this.btnSelectTool.updateHint(this.tipSelectTool);
                this.btnHandTool.updateHint(this.tipHandTool);
                // this.btnEditMode.updateHint(this.tipEditMode, true);
            },

            createDelayedElements: function () {
                if (this.api) {
                    this.mnuNonPrinting.items[0].setChecked(this.api.get_ShowParaMarks(), true);
                    this.mnuNonPrinting.items[1].setChecked(this.api.get_ShowTableEmptyLine(), true);
                    this.btnShowHidenChars.toggle(this.mnuNonPrinting.items[0].checked, true);

                    this.updateMetricUnit();
                }

                // set hints
                this.btnPrint.updateHint(this.tipPrint + Common.Utils.String.platformKey('Ctrl+P'));
                this.btnSave.updateHint(this.btnSaveTip);
                this.btnUndo.updateHint(this.tipUndo + Common.Utils.String.platformKey('Ctrl+Z'));
                this.btnRedo.updateHint(this.tipRedo + Common.Utils.String.platformKey('Ctrl+Y'));
                this.btnCopy.updateHint(this.tipCopy + Common.Utils.String.platformKey('Ctrl+C'));
                this.btnPaste.updateHint(this.tipPaste + Common.Utils.String.platformKey('Ctrl+V'));
                this.btnCut.updateHint(this.tipCut + Common.Utils.String.platformKey('Ctrl+X'));
                this.btnSelectAll.updateHint(this.tipSelectAll + Common.Utils.String.platformKey('Ctrl+A'));
                this.btnReplace.updateHint(this.tipReplace + ' (' + Common.Utils.String.textCtrl + '+H)');
                this.btnIncFontSize.updateHint(this.tipIncFont + Common.Utils.String.platformKey('Ctrl+]'));
                this.btnDecFontSize.updateHint(this.tipDecFont + Common.Utils.String.platformKey('Ctrl+['));
                this.btnBold.updateHint(this.textBold + Common.Utils.String.platformKey('Ctrl+B'));
                this.btnItalic.updateHint(this.textItalic + Common.Utils.String.platformKey('Ctrl+I'));
                this.btnUnderline.updateHint(this.textUnderline + Common.Utils.String.platformKey('Ctrl+U'));
                this.btnStrikeout.updateHint(this.textStrikeout);
                this.btnSuperscript.updateHint(this.textSuperscript);
                this.btnSubscript.updateHint(this.textSubscript);
                this.btnHighlightColor.updateHint(this.tipHighlightColor);
                this.btnFontColor.updateHint(this.tipFontColor);
                this.btnParagraphColor.updateHint(this.tipPrColor);
                this.btnBorders.updateHint(this.tipBorders);
                this.btnChangeCase.updateHint(this.tipChangeCase);
                this.btnAlignLeft.updateHint(this.tipAlignLeft + Common.Utils.String.platformKey('Ctrl+L'));
                this.btnAlignCenter.updateHint(this.tipAlignCenter + Common.Utils.String.platformKey('Ctrl+E'));
                this.btnAlignRight.updateHint(this.tipAlignRight + Common.Utils.String.platformKey('Ctrl+R'));
                this.btnAlignJust.updateHint(this.tipAlignJust + Common.Utils.String.platformKey('Ctrl+J'));
                this.btnDecLeftOffset.updateHint(this.tipDecPrLeft + Common.Utils.String.platformKey('Ctrl+Shift+M'));
                this.btnIncLeftOffset.updateHint(this.tipIncPrLeft + Common.Utils.String.platformKey('Ctrl+M'));
                this.btnLineSpace.updateHint(this.tipLineSpace);
                this.btnTextDir.updateHint(this.tipTextDir);
                this.btnShowHidenChars.updateHint(this.tipShowHiddenChars + Common.Utils.String.platformKey('Shift+8', ' (' + Common.Utils.String.textCtrl + '+{0})'));
                this.btnMarkers.updateHint(this.tipMarkers);
                this.btnNumbers.updateHint(this.tipNumbers);
                this.btnMultilevels.updateHint(this.tipMultilevels);
                this.btnInsertTable.updateHint(this.tipInsertTable);
                this.btnInsertImage.updateHint(this.tipInsertImage);
                this.btnInsertChart.updateHint(this.tipInsertChart);
                this.btnInsertText.updateHint([this.tipInsertHorizontalText ,this.tipInsertText]);
                this.btnInsertTextArt.updateHint(this.tipInsertTextArt);
                this.btnEditHeader.updateHint(this.tipEditHeader);
                this.btnInsDateTime.updateHint(this.tipDateTime);
                this.btnInsField.updateHint(this.tipInsField);
                this.btnBlankPage.updateHint(this.tipBlankPage);
                this.btnInsertShape.updateHint(this.tipInsertShape);
                this.btnInsertSmartArt.updateHint(this.tipInsertSmartArt);
                this.btnInsertEquation.updateHint(this.tipInsertEquation);
                this.btnInsertSymbol.updateHint(this.tipInsertSymbol);
                this.btnDropCap.updateHint(this.tipDropCap);
                this.btnContentControls.updateHint(this.tipControls);
                this.btnColumns.updateHint(this.tipColumns);
                this.btnPageOrient.updateHint(this.tipPageOrient);
                this.btnPageSize.updateHint(this.tipPageSize);
                this.btnPageMargins.updateHint(this.tipPageMargins);
                this.btnLineNumbers.updateHint(this.tipLineNumbers);
                this.btnClearStyle.updateHint(this.tipClearStyle);
                this.btnCopyStyle.updateHint(this.tipCopyStyle + Common.Utils.String.platformKey('Alt+Ctrl+C'));
                this.btnColorSchemas.updateHint(this.tipColorSchemas);
                this.btnHyphenation.updateHint(this.tipHyphenation);
                this.btnPageColor.updateHint(this.tipPageColor);


                // set menus

                var me = this;
                var levelTemplate = _.template('<a id="<%= id %>" tabindex="-1" type="menuitem"><div id="<%= options.previewId %>" class="menu-list-preview" style="width: 200px; height: 30px;"></div></a>');
                var items = [], ids = [];
                for (var i=0; i<9; i++) {
                    ids.push('id-toolbar-menu-markers-level-' + i);
                    items.push({template: levelTemplate, previewId: ids[i], level: i, checkable: true });
                }

                this.btnMarkers.setMenu(
                    new Common.UI.Menu({
                        cls: 'shifted-left',
                        style: 'min-width: 145px',
                        items: [
                            {template: _.template('<div id="id-toolbar-menu-markers" class="menu-markers" style="width: 153px;"></div>')},
                            {caption: '--'},
                            this.mnuMarkerChangeLevel = new Common.UI.MenuItem({
                                cls: 'list-level',
                                caption: this.textChangeLevel,
                                disabled: (this.mnuMarkersPicker.conf.index || 0)==0,
                                menu: new Common.UI.Menu({
                                    cls: 'list-settings-level',
                                    menuAlign: 'tl-tr',
                                    items: items,
                                    previewIds: ids
                                })
                            }),
                            this.mnuMarkerSettings = new Common.UI.MenuItem({
                                caption: this.textListSettings,
                                value: 'settings'
                            })
                        ]
                    })
                );

                items = []; ids = [];
                for (var i=0; i<9; i++) {
                    ids.push('id-toolbar-menu-numbering-level-' + i);
                    items.push({template: levelTemplate, previewId: ids[i], level: i, checkable: true });
                }
                this.btnNumbers.setMenu(
                    new Common.UI.Menu({
                        cls: 'shifted-left',
                        items: [
                            {template: _.template('<div id="id-toolbar-menu-numbering" class="menu-markers" style="width: 361px;"></div>')},
                            {caption: '--'},
                            this.mnuNumberChangeLevel = new Common.UI.MenuItem({
                                cls: 'list-level',
                                caption: this.textChangeLevel,
                                disabled: (this.mnuNumbersPicker.conf.index || 0)==0,
                                menu: new Common.UI.Menu({
                                    cls: 'list-settings-level',
                                    menuAlign: 'tl-tr',
                                    items: items,
                                    previewIds: ids
                                })
                            }),
                            this.mnuNumberSettings = new Common.UI.MenuItem({
                                caption: this.textListSettings,
                                value: 'settings'
                            })
                        ]
                    })
                );
                items = []; ids = [];
                for (var i=0; i<9; i++) {
                    ids.push('id-toolbar-menu-multilevels-level-' + i);
                    items.push({template: levelTemplate, previewId: ids[i], level: i, checkable: true });
                }
                this.btnMultilevels.setMenu(
                    new Common.UI.Menu({
                        cls: 'shifted-left',
                        style: 'min-width: 177px',
                        items: [
                            {template: _.template('<div id="id-toolbar-menu-multilevels" class="menu-markers" style="width: 362px;"></div>')},
                            {caption: '--'},
                            this.mnuMultiChangeLevel = new Common.UI.MenuItem({
                                cls: 'list-level',
                                caption: this.textChangeLevel,
                                disabled: (this.mnuMultilevelPicker.conf.index || 0)==0,
                                menu: new Common.UI.Menu({
                                    cls: 'list-settings-level',
                                    menuAlign: 'tl-tr',
                                    items: items,
                                    previewIds: ids
                                })
                            }),
                            this.mnuMultilevelSettings = new Common.UI.MenuItem({
                                caption: this.textListSettings,
                                value: 'settings'
                            })
                        ]
                    })
                );

                var keepStateCurr = this.mnuPageNumCurrentPos.keepState,
                    keepStateCount = this.mnuInsertPageCount.keepState,
                    keepStateNum = this.mnuInsertPageNum.keepState;
                this.btnEditHeader.setMenu(
                    new Common.UI.Menu({
                        items: [
                            {caption: this.mniEditHeader, value: 'header'},
                            {caption: this.mniEditFooter, value: 'footer'},
                            {caption: '--'},
                            {caption: this.mniRemoveHeader, value: 'header-remove'},
                            {caption: this.mniRemoveFooter, value: 'footer-remove'},
                            {caption: '--'},
                            this.mnuInsertPageNum = new Common.UI.MenuItem({
                                caption: this.textInsertPageNumber,
                                lock: this.mnuInsertPageNum.options.lock,
                                disabled: this.mnuInsertPageNum.isDisabled(),
                                menu: new Common.UI.Menu({
                                    cls: 'shifted-left',
                                    menuAlign: 'tl-tr',
                                    style: 'min-width: 90px;',
                                    items: [
                                        {template: _.template('<div id="id-toolbar-menu-pageposition" class="menu-pageposition"></div>')},
                                        this.mnuPageNumCurrentPos = new Common.UI.MenuItem({
                                            caption: this.textToCurrent,
                                            lock: this.mnuPageNumCurrentPos.options.lock,
                                            disabled: this.mnuPageNumCurrentPos.isDisabled(),
                                            value: 'current'
                                        })
                                    ]
                                })
                            }),
                            this.mnuInsertPageCount = new Common.UI.MenuItem({
                                caption: this.textInsertPageCount,
                                    lock: this.mnuInsertPageCount.options.lock,
                                disabled: this.mnuInsertPageCount.isDisabled()
                            })
                        ]
                    })
                );
                this.mnuInsertPageNum.keepState = keepStateNum;
                this.mnuPageNumCurrentPos.keepState = keepStateCurr;
                this.paragraphControls.push(this.mnuPageNumCurrentPos);
                this.lockControls.push(this.mnuPageNumCurrentPos);
                this.mnuInsertPageCount.keepState = keepStateCount;
                this.paragraphControls.push(this.mnuInsertPageCount);
                this.lockControls.push(this.mnuInsertPageCount);

                this.btnInsertChart.setMenu( new Common.UI.Menu({
                    style: 'width: 364px;padding-top: 12px;',
                    items: [
                        {template: _.template('<div id="id-toolbar-menu-insertchart" class="menu-insertchart"></div>')}
                    ]
                }));

                var onShowBefore = function(menu) {
                    var picker = new Common.UI.DataView({
                        el: $('#id-toolbar-menu-insertchart'),
                        parentMenu: menu,
                        outerMenu: {menu: menu, index:0},
                        showLast: false,
                        restoreHeight: 535,
                        groups: new Common.UI.DataViewGroupStore(Common.define.chartData.getChartGroupData()),
                        store: new Common.UI.DataViewStore(Common.define.chartData.getChartData()),
                        itemTemplate: _.template('<div id="<%= id %>" class="item-chartlist"><svg width="40" height="40" class=\"icon uni-scale\"><use xlink:href=\"#chart-<%= iconCls %>\"></use></svg></div>')
                    });
                    picker.on('item:click', function (picker, item, record, e) {
                        if (record)
                            me.fireEvent('add:chart', [record.get('type')]);
                    });
                    menu.off('show:before', onShowBefore);
                    menu.setInnerMenu([{menu: picker, index: 0}]);
                };
                this.btnInsertChart.menu.on('show:before', onShowBefore);

                this.btnInsertSmartArt.setMenu(new Common.UI.Menu({
                    cls: 'shifted-right',
                    items: []
                }));

                if (this.btnBorders && this.btnBorders.rendered) {
                    this.btnBorders.setMenu(new Common.UI.Menu({
                        cls: 'shifted-right',
                        items:[
                            {
                                caption: this.textBottomBorders,
                                iconCls: 'menu__icon btn-border-bottom',
                                icls: 'btn-border-bottom',
                                borderId: 'bottom',
                            },
                            {
                                caption: this.textTopBorders,
                                iconCls: 'menu__icon btn-border-top',
                                icls: 'btn-border-top',
                                borderId: 'top',
                            },
                            {
                                caption: this.textLeftBorders,
                                iconCls: 'menu__icon btn-border-left',
                                icls: 'btn-border-left',
                                borderId: 'left',
                            },
                            {
                                caption: this.textRightBorders,
                                iconCls: 'menu__icon btn-border-right',
                                icls: 'btn-border-right',
                                borderId: 'right',
                            },
                            { caption: '--' },
                            {
                                caption: this.textNoBorders,
                                iconCls: 'menu__icon btn-border-no',
                                icls: 'btn-border-no',
                                borderId: 'none',
                            },
                            {
                                caption: this.textAllBorders,
                                iconCls: 'menu__icon btn-border-all',
                                icls: 'btn-border-all',
                                borderId: 'all',
                            },
                            {
                                caption: this.textOutBorders,
                                iconCls: 'menu__icon btn-border-out',
                                icls: 'btn-border-out',
                                borderId: 'outer',
                            },
                            {
                                caption: this.textInsideBorders,
                                iconCls: 'menu__icon btn-border-inside',
                                icls: 'btn-border-inside',
                                borderId: 'inner',
                            },
                            { caption: '--' },
                            {
                                id: 'id-toolbar-menu-item-border-width',
                                caption: this.textBordersStyle,
                                iconCls: 'menu__icon btn-border-style',
                                menu: (function () {
                                    var txtPt = ' ' + Common.Utils.Metric.getMetricName(Common.Utils.Metric.c_MetricUnits.pt); 
                                    var itemTemplate = _.template(
                                        '<a id="<%= id %>" tabindex="-1" type="menuitem">' +
                                          '<div class="border-size-item">' +
                                            '<span class="border-size-text"><%= options.displayValue %></span>' +
                                            '<svg><use xlink:href="#<%= options.imgId %>"></use></svg>' + 
                                          '</div>' +
                                        '</a>'
                                      );
                                    me.mnuBorderWidth = new Common.UI.Menu({
                                        style: 'min-width: 100px;',
                                        cls: 'shifted-right',
                                        menuAlign: 'tl-tr',
                                        id: 'toolbar-menu-borders-width',
                                        items: [
                                            { template: itemTemplate, stopPropagation: true, checkable: true, toggleGroup: 'border-width', displayValue: '0.5' + txtPt,   value: 0.5,  pxValue: 0.5,  imgId: 'half-pt', checked:true},
                                            { template: itemTemplate, stopPropagation: true, checkable: true, toggleGroup: 'border-width', displayValue: '1 ' + txtPt,    value: 1,    pxValue: 1,    imgId: 'one-pt' },
                                            { template: itemTemplate, stopPropagation: true, checkable: true, toggleGroup: 'border-width', displayValue: '1.5 ' + txtPt,  value: 1.5,  pxValue: 2,    imgId: 'one-and-half-pt' },
                                            { template: itemTemplate, stopPropagation: true, checkable: true, toggleGroup: 'border-width', displayValue: '2.25 ' + txtPt, value: 2.25, pxValue: 3,    imgId: 'two-and-quarter-pt' },
                                            { template: itemTemplate, stopPropagation: true, checkable: true, toggleGroup: 'border-width', displayValue: '3 ' + txtPt,    value: 3,    pxValue: 4,    imgId: 'three-pt' },
                                            { template: itemTemplate, stopPropagation: true, checkable: true, toggleGroup: 'border-width', displayValue: '4.5 ' + txtPt,  value: 4.5,  pxValue: 6,    imgId: 'four-and-half-pt' },
                                            { template: itemTemplate, stopPropagation: true, checkable: true, toggleGroup: 'border-width', displayValue: '6 ' + txtPt,    value: 6,    pxValue: 8,    imgId: 'six-pt' },
                                        ]
                                    });
                                    return me.mnuBorderWidth;
                                })()
                            },
                            this.mnuBorderColor = new Common.UI.MenuItem({
                                id: 'id-toolbar-mnu-item-border-color',
                                caption: this.textBordersColor,
                                iconCls: 'mnu-icon-item mnu-border-color',
                                template    : _.template('<a id="<%= id %>"tabindex="-1" type="menuitem"><span class="menu-item-icon"></span><%= caption %></a>'),
                                menu: new Common.UI.Menu({
                                    menuAlign: 'tl-tr',
                                    cls: 'shifted-left',
                                    items: [
                                        {
                                            id: 'id-toolbar-menu-auto-bordercolor',
                                            caption: this.textAutoColor,
                                            template: _.template('<a tabindex="-1" type="menuitem"><span class="menu-item-icon color-auto"></span><%= caption %></a>'),
                                            stopPropagation: true
                                        },
                                        { caption: '--' },
                                        { template: _.template('<div id="id-toolbar-menu-bordercolor" style="width: 164px;display: inline-block;"></div>'), stopPropagation: true },
                                        { caption: '--' },
                                        {
                                            id: "id-toolbar-menu-new-bordercolor",
                                            template: _.template('<a tabindex="-1" type="menuitem">' + this.textNewColor + '</a>'),
                                            stopPropagation: true
                                        }
                                    ]
                                })
                            })
                        ]
                }))   
                this.mnuBorderColorPicker = new Common.UI.ThemeColorPalette({
                    el: $('#id-toolbar-menu-bordercolor'),
                    outerMenu: {menu: this.mnuBorderColor.menu, index: 2},
                });
                this.mnuBorderColor.menu.setInnerMenu([{menu: this.mnuBorderColorPicker, index: 2}]);
            }    
                    
                var onShowBeforeSmartArt = function (menu) { // + <% if(typeof imageUrl === "undefined" || imageUrl===null || imageUrl==="") { %> style="visibility: hidden;" <% } %>/>',
                    var smartArtData = Common.define.smartArt.getSmartArtData();
                    smartArtData.forEach(function (item, index) {
                        var length = item.items.length,
                            width = 399;
                        if (length < 5) {
                            width = length * (70 + 8) + 9; // 4px margin + 4px margin
                        }
                        me.btnInsertSmartArt.menu.addItem({
                            caption: item.caption,
                            value: item.sectionId,
                            itemId: item.id,
                            itemsLength: length,
                            iconCls: item.icon ? 'menu__icon ' + item.icon : undefined,
                            menu: new Common.UI.Menu({
                                items: [
                                    {template: _.template('<div id="' + item.id + '" class="menu-add-smart-art margin-left-5" style="width: ' + width + 'px; height: 500px;"></div>')}
                                ],
                                menuAlign: 'tl-tr',
                            })}, true);
                    });
                    var sa_items = me.btnInsertSmartArt.menu.getItems(true);
                    sa_items.forEach(function (item, index) {
                        var items = [];
                        for (var i=0; i<item.options.itemsLength; i++) {
                            items.push({
                                isLoading: true
                            });
                        }
                        item.menuPicker = new Common.UI.DataView({
                            el: $('#' + item.options.itemId),
                            parentMenu: sa_items[index].menu,
                            itemTemplate: _.template([
                                '<% if (isLoading) { %>',
                                    '<div class="loading-item" style="width: 70px; height: 70px;">',
                                        '<i class="loading-spinner"></i>',
                                    '</div>',
                                '<% } else { %>',
                                    '<div>',
                                        '<img src="<%= imageUrl %>" width="' + 70 + '" height="' + 70 + '" />',
                                    '</div>',
                                '<% } %>'
                                ].join('')),
                            store: new Common.UI.DataViewStore(items),
                            delayRenderTips: true,
                            scrollAlwaysVisible: true,
                            showLast: false
                        });
                        item.menuPicker.on('item:click', function(picker, item, record, e) {
                            if (record && record.get('value') !== null) {
                                me.fireEvent('insert:smartart', [record.get('value')]);
                            }
                            Common.NotificationCenter.trigger('edit:complete', me);
                        });
                        item.menuPicker.loaded = false;
                        item.$el.on('mouseenter', function () {
                            if (!item.menuPicker.loaded) {
                                me.fireEvent('smartart:mouseenter', [item.value]);
                            }
                        });
                        item.$el.on('mouseleave', function () {
                            me.fireEvent('smartart:mouseleave', [item.value]);
                        });
                    });
                    menu.off('show:before', onShowBeforeSmartArt);
                };
                this.btnInsertSmartArt.menu.on('show:before', onShowBeforeSmartArt);

                var onShowBeforeTextArt = function (menu) {
                    var collection = DE.getCollection('Common.Collections.TextArt');
                    if (collection.length<1)
                        DE.getController('Main').fillTextArt(me.api.asc_getTextArtPreviews());
                    var picker = new Common.UI.DataView({
                        el: $('#id-toolbar-menu-insart'),
                        store: collection,
                        parentMenu: menu,
                        outerMenu: {menu: menu, index:0},
                        showLast: false,
                        itemTemplate: _.template('<div class="item-art"><img src="<%= imageUrl %>" id="<%= id %>" style="width:50px;height:50px;"></div>')
                    });
                    picker.on('item:click', function (picker, item, record, e) {
                        if (record)
                            me.fireEvent('insert:textart', [record.get('data')]);
                        if (e.type !== 'click') menu.hide();
                    });
                    menu.off('show:before', onShowBeforeTextArt);
                    menu.setInnerMenu([{menu: picker, index: 0}]);
                };
                this.btnInsertTextArt.menu.on('show:before', onShowBeforeTextArt);

                this.btnInsertText.setMenu(new Common.UI.Menu({
                    items: [
                        {
                            caption: this.tipInsertHorizontalText,
                            checkable: true,
                            checkmark: false,
                            iconCls     : 'menu__icon btn-text',
                            toggleGroup: 'textbox',
                            value: 'textRect',
                            iconClsForMainBtn: 'btn-big-text'
                        },
                        {
                            caption: this.tipInsertVerticalText,
                            checkable: true,
                            checkmark: false,
                            iconCls     : 'menu__icon btn-text-vertical',
                            toggleGroup: 'textbox',
                            value: 'textRectVertical',
                            iconClsForMainBtn: 'btn-big-text-vertical'
                        },
                    ]
                }));

                // set dataviews
                this.specSymbols = [
                    {symbol: 8226,     description: this.textBullet},
                    {symbol: 8364,     description: this.textEuro},
                    {symbol: 65284,    description: this.textDollar},
                    {symbol: 165,      description: this.textYen},
                    {symbol: 169,      description: this.textCopyright},
                    {symbol: 174,      description: this.textRegistered},
                    {symbol: 189,      description: this.textOneHalf},
                    {symbol: 188,      description: this.textOneQuarter},
                    {symbol: 8800,     description: this.textNotEqualTo},
                    {symbol: 177,      description: this.textPlusMinus},
                    {symbol: 247,      description: this.textDivision},
                    {symbol: 8730,     description: this.textSquareRoot},
                    {symbol: 8804,     description: this.textLessEqual},
                    {symbol: 8805,     description: this.textGreaterEqual},
                    {symbol: 8482,     description: this.textTradeMark},
                    {symbol: 8734,     description: this.textInfinity},
                    {symbol: 126,      description: this.textTilde},
                    {symbol: 176,      description: this.textDegree},
                    {symbol: 167,      description: this.textSection},
                    {symbol: 945,      description: this.textAlpha},
                    {symbol: 946,      description: this.textBetta},
                    {symbol: 960,      description: this.textLetterPi},
                    {symbol: 916,      description: this.textDelta},
                    {symbol: 9786,     description: this.textSmile},
                    {symbol: 9829,     description: this.textBlackHeart}
                ];
                this.mnuInsertSymbolsPicker = new Common.UI.DataView({
                    el: $('#id-toolbar-menu-symbols'),
                    cls: 'no-borders-item',
                    parentMenu: this.btnInsertSymbol.menu,
                    outerMenu: {menu: this.btnInsertSymbol.menu, index:0},
                    restoreHeight: 290,
                    delayRenderTips: true,
                    scrollAlwaysVisible: true,
                    store: new Common.UI.DataViewStore(this.loadRecentSymbolsFromStorage()),
                    itemTemplate: _.template('<div class="item-symbol" dir="ltr" <% if (typeof font !== "undefined" && font !=="") { %> style ="font-family: <%= font %>"<% } %>>&#<%= symbol %></div>')
                });
                this.btnInsertSymbol.menu.setInnerMenu([{menu: this.mnuInsertSymbolsPicker, index: 0}]);
                this.btnInsertSymbol.menu.on('show:before',  _.bind(function() {
                    this.mnuInsertSymbolsPicker.deselectAll();
                }, this));

                // Numbering
                var loadPreset = function(url, lang, callback) {
                    lang = (lang || 'en').replace('_', '-').toLowerCase();
                    Common.Utils.loadConfig(url, function (langJson) {
                        var presets;
                        if (langJson !== 'error') {
                            presets = langJson[lang];
                            if (!presets) {
                                lang = lang.split(/[\-_]/)[0];
                                presets = langJson[lang];
                                // !presets && (presets = langJson['en']);
                            }
                        }
                        callback && callback(presets);
                    });
                };

                var _conf = this.mnuMarkersPicker.conf;
                this._markersArr = [
                    '{"Type":"remove"}',
                    '{"Type":"bullet","Lvl":[{"lvlJc":"left","suff":"tab","numFmt":{"val":"bullet"},"lvlText":"·","rPr":{"rFonts":{"ascii":"Symbol","cs":"Symbol","eastAsia":"Symbol","hAnsi":"Symbol"}}}]}',
                    '{"Type":"bullet","Lvl":[{"lvlJc":"left","suff":"tab","numFmt":{"val":"bullet"},"lvlText":"o","rPr":{"rFonts":{"ascii":"Courier New","cs":"Courier New","eastAsia":"Courier New","hAnsi":"Courier New"}}}]}',
                    '{"Type":"bullet","Lvl":[{"lvlJc":"left","suff":"tab","numFmt":{"val":"bullet"},"lvlText":"§","rPr":{"rFonts":{"ascii":"Wingdings","cs":"Wingdings","eastAsia":"Wingdings","hAnsi":"Wingdings"}}}]}',
                    '{"Type":"bullet","Lvl":[{"lvlJc":"left","suff":"tab","numFmt":{"val":"bullet"},"lvlText":"v","rPr":{"rFonts":{"ascii":"Wingdings","cs":"Wingdings","eastAsia":"Wingdings","hAnsi":"Wingdings"}}}]}',
                    '{"Type":"bullet","Lvl":[{"lvlJc":"left","suff":"tab","numFmt":{"val":"bullet"},"lvlText":"Ø","rPr":{"rFonts":{"ascii":"Wingdings","cs":"Wingdings","eastAsia":"Wingdings","hAnsi":"Wingdings"}}}]}',
                    '{"Type":"bullet","Lvl":[{"lvlJc":"left","suff":"tab","numFmt":{"val":"bullet"},"lvlText":"ü","rPr":{"rFonts":{"ascii":"Wingdings","cs":"Wingdings","eastAsia":"Wingdings","hAnsi":"Wingdings"}}}]}',
                    '{"Type":"bullet","Lvl":[{"lvlJc":"left","suff":"tab","numFmt":{"val":"bullet"},"lvlText":"¨","rPr":{"rFonts":{"ascii":"Symbol","cs":"Symbol","eastAsia":"Symbol","hAnsi":"Symbol"}}}]}',
                    '{"Type":"bullet","Lvl":[{"lvlJc":"left","suff":"tab","numFmt":{"val":"bullet"},"lvlText":"–","rPr":{"rFonts":{"ascii":"Arial","cs":"Arial","eastAsia":"Arial","hAnsi":"Arial"}}}]}'
                ];

                var listSettings = {recentPath: 'de-recent-bullets', recentCount: 6, recentGroup: 'menu-bullets-group-recent', docGroup: 'menu-bullets-group-doc', docName: this.txtGroupBulletDoc},
                    recents = this.loadListPresetsFromStorage(listSettings.recentPath, listSettings.recentGroup, listSettings.recentCount),
                    groups = (recents.length>0) ? [{id: listSettings.recentGroup, caption: this.txtGroupRecent, type: 0}] : [],
                    libGroup = 'menu-bullets-group-lib';
                groups.push({id: libGroup, caption: this.txtGroupBulletLib, type: 1});

                this.mnuMarkersPicker = new Common.UI.DataView({
                    el: $('#id-toolbar-menu-markers'),
                    parentMenu: this.btnMarkers.menu,
                    outerMenu:  {menu: this.btnMarkers.menu, index: 0},
                    restoreHeight: 290,
                    delayRenderTips: true,
                    scrollAlwaysVisible: true,
                    listSettings: listSettings,
                    groups: new Common.UI.DataViewGroupStore(groups),
                    store: new Common.UI.DataViewStore(recents.concat([
                        {id: 'id-markers-' + Common.UI.getId(), numberingInfo: me._markersArr[0], skipRenderOnChange: true, tip: this.textNone, group : libGroup, type: 1},
                        {id: 'id-markers-' + Common.UI.getId(), numberingInfo: me._markersArr[1], skipRenderOnChange: true, tip: this.tipMarkersFRound, group : libGroup, type: 1},
                        {id: 'id-markers-' + Common.UI.getId(), numberingInfo: me._markersArr[2], skipRenderOnChange: true, tip: this.tipMarkersHRound, group : libGroup, type: 1},
                        {id: 'id-markers-' + Common.UI.getId(), numberingInfo: me._markersArr[3], skipRenderOnChange: true, tip: this.tipMarkersFSquare, group : libGroup, type: 1},
                        {id: 'id-markers-' + Common.UI.getId(), numberingInfo: me._markersArr[4], skipRenderOnChange: true, tip: this.tipMarkersStar, group : libGroup, type: 1},
                        {id: 'id-markers-' + Common.UI.getId(), numberingInfo: me._markersArr[5], skipRenderOnChange: true, tip: this.tipMarkersArrow, group : libGroup, type: 1},
                        {id: 'id-markers-' + Common.UI.getId(), numberingInfo: me._markersArr[6], skipRenderOnChange: true, tip: this.tipMarkersCheckmark, group : libGroup, type: 1},
                        {id: 'id-markers-' + Common.UI.getId(), numberingInfo: me._markersArr[7], skipRenderOnChange: true, tip: this.tipMarkersFRhombus, group : libGroup, type: 1},
                        {id: 'id-markers-' + Common.UI.getId(), numberingInfo: me._markersArr[8], skipRenderOnChange: true, tip: this.tipMarkersDash, group : libGroup, type: 1}
                    ])),
                    itemTemplate: _.template('<div id="<%= id %>" class="item-markerlist"></div>')
                });
                this.btnMarkers.menu.setInnerMenu([{menu: this.mnuMarkersPicker, index: 0}]);

                _conf = this.mnuNumbersPicker.conf;
                this._numbersArr = [
                    '{"Type":"remove"}',
                    '{"Type":"number","Lvl":[{"lvlJc":"left","suff":"tab","numFmt":{"val":"upperLetter"},"lvlText":"%1."}]}',
                    '{"Type":"number","Lvl":[{"lvlJc":"left","suff":"tab","numFmt":{"val":"lowerLetter"},"lvlText":"%1)"}]}',
                    '{"Type":"number","Lvl":[{"lvlJc":"left","suff":"tab","numFmt":{"val":"lowerLetter"},"lvlText":"%1."}]}',
                    '{"Type":"number","Lvl":[{"lvlJc":"right","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1."}]}',
                    '{"Type":"number","Lvl":[{"lvlJc":"right","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1)"}]}',
                    '{"Type":"number","Lvl":[{"lvlJc":"right","suff":"tab","numFmt":{"val":"upperRoman"},"lvlText":"%1."}]}',
                    '{"Type":"number","Lvl":[{"lvlJc":"right","suff":"tab","numFmt":{"val":"lowerRoman"},"lvlText":"%1."}]}'
                ];

                listSettings = {recentPath: 'de-recent-numbering', recentCount: 8, recentGroup: 'menu-numbering-group-recent', docGroup: 'menu-numbering-group-doc', docName: this.txtGroupNumDoc};
                _conf.recents = this.loadListPresetsFromStorage(listSettings.recentPath, listSettings.recentGroup, listSettings.recentCount);
                _conf.libGroup = 'menu-numbering-group-lib';
                groups = (_conf.recents.length>0) ? [{id: listSettings.recentGroup, caption: this.txtGroupRecent, type: 0}] : [];
                groups.push({id: _conf.libGroup, caption: this.txtGroupNumLib, type: 1});
                this.mnuNumbersPicker = new Common.UI.DataView({
                    el: $('#id-toolbar-menu-numbering'),
                    parentMenu: this.btnNumbers.menu,
                    outerMenu:  {menu: this.btnNumbers.menu, index: 0},
                    restoreHeight: 403,
                    delayRenderTips: true,
                    scrollAlwaysVisible: true,
                    listSettings: listSettings,
                    groups: new Common.UI.DataViewGroupStore(groups),
                    store: new Common.UI.DataViewStore(),
                    itemTemplate: _.template('<div id="<%= id %>" class="item-multilevellist"></div>')
                });
                this.btnNumbers.menu.setInnerMenu([{menu: this.mnuNumbersPicker, index: 0}]);
                this.mnuNumbersPicker.conf = _conf;

                loadPreset('resources/numbering/numbering-lists.json', this.mode.lang, function (presets) {
                    var libGroup = me.mnuNumbersPicker.conf.libGroup,
                        arr = [
                        {id: 'id-numbers-' + Common.UI.getId(), numberingInfo: me._numbersArr[0], skipRenderOnChange: true, group : libGroup, type: 1},
                        {id: 'id-numbers-' + Common.UI.getId(), numberingInfo: me._numbersArr[1], skipRenderOnChange: true, group : libGroup, type: 1},
                        {id: 'id-numbers-' + Common.UI.getId(), numberingInfo: me._numbersArr[2], skipRenderOnChange: true, group : libGroup, type: 1},
                        {id: 'id-numbers-' + Common.UI.getId(), numberingInfo: me._numbersArr[3], skipRenderOnChange: true, group : libGroup, type: 1},
                        {id: 'id-numbers-' + Common.UI.getId(), numberingInfo: me._numbersArr[4], skipRenderOnChange: true, group : libGroup, type: 1},
                        {id: 'id-numbers-' + Common.UI.getId(), numberingInfo: me._numbersArr[5], skipRenderOnChange: true, group : libGroup, type: 1},
                        {id: 'id-numbers-' + Common.UI.getId(), numberingInfo: me._numbersArr[6], skipRenderOnChange: true, group : libGroup, type: 1},
                        {id: 'id-numbers-' + Common.UI.getId(), numberingInfo: me._numbersArr[7], skipRenderOnChange: true, group : libGroup, type: 1}
                    ];
                    presets && presets.forEach(function (item){
                        arr.push({id: 'id-numbers-' + Common.UI.getId(), numberingInfo: JSON.stringify(item), skipRenderOnChange: true, group : libGroup, type: 1});
                    });
                    me.mnuNumbersPicker.store.reset(me.mnuNumbersPicker.conf.recents.concat(arr));
                });

                _conf = this.mnuMultilevelPicker.conf;
                listSettings = {recentPath: 'de-recent-multilevels', recentCount: 8, recentGroup: 'menu-multilevels-group-recent', docGroup: 'menu-multilevels-group-doc', docName: this.txtGroupMultiDoc};
                _conf.recents = this.loadListPresetsFromStorage(listSettings.recentPath, listSettings.recentGroup, listSettings.recentCount);
                _conf.libGroup = 'menu-multilevels-group-lib';
                groups = (_conf.recents.length>0) ? [{id: listSettings.recentGroup, caption: this.txtGroupRecent, type: 0}] : [];
                groups.push({id: _conf.libGroup, caption: this.txtGroupMultiLib, type: 1});
                this._multilevelArr = [
                    '{"Type":"remove"}',
                    '{"Type":"number","Lvl":[{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1)","pPr":{"ind":{"left":360,"firstLine":-360}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"lowerLetter"},"lvlText":"%2)","pPr":{"ind":{"left":720,"firstLine":-360}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"lowerRoman"},"lvlText":"%3)","pPr":{"ind":{"left":1080,"firstLine":-360}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%4)","pPr":{"ind":{"left":1440,"firstLine":-360}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"lowerLetter"},"lvlText":"%5)","pPr":{"ind":{"left":1800,"firstLine":-360}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"lowerRoman"},"lvlText":"%6)","pPr":{"ind":{"left":2160,"firstLine":-360}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%7)","pPr":{"ind":{"left":2520,"firstLine":-360}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"lowerLetter"},"lvlText":"%8)","pPr":{"ind":{"left":2880,"firstLine":-360}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"lowerRoman"},"lvlText":"%9)","pPr":{"ind":{"left":3240,"firstLine":-360}}}]}',
                    '{"Type":"number","Lvl":[{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1.","pPr":{"ind":{"left":360,"firstLine":-360}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1.%2.","pPr":{"ind":{"left":792,"firstLine":-432}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1.%2.%3.","pPr":{"ind":{"left":1224,"firstLine":-504}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1.%2.%3.%4.","pPr":{"ind":{"left":1728,"firstLine":-648}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1.%2.%3.%4.%5.","pPr":{"ind":{"left":2232,"firstLine":-792}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1.%2.%3.%4.%5.%6.","pPr":{"ind":{"left":2736,"firstLine":-936}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1.%2.%3.%4.%5.%6.%7.","pPr":{"ind":{"left":3240,"firstLine":-1080}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1.%2.%3.%4.%5.%6.%7.%8.","pPr":{"ind":{"left":3744,"firstLine":-1224}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1.%2.%3.%4.%5.%6.%7.%8.%9.","pPr":{"ind":{"left":4320,"firstLine":-1440}}}]}',
                    '{"Type":"bullet","Lvl":[{"lvlJc":"left","suff":"tab","numFmt":{"val":"bullet"},"lvlText":"v","pPr":{"ind":{"left":360,"firstLine":-360}},"rPr":{"rFonts":{"ascii":"Wingdings","cs":"Wingdings","eastAsia":"Wingdings","hAnsi":"Wingdings"}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"bullet"},"lvlText":"Ø","pPr":{"ind":{"left":720,"firstLine":-360}},"rPr":{"rFonts":{"ascii":"Wingdings","cs":"Wingdings","eastAsia":"Wingdings","hAnsi":"Wingdings"}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"bullet"},"lvlText":"§","pPr":{"ind":{"left":1080,"firstLine":-360}},"rPr":{"rFonts":{"ascii":"Wingdings","cs":"Wingdings","eastAsia":"Wingdings","hAnsi":"Wingdings"}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"bullet"},"lvlText":"·","pPr":{"ind":{"left":1440,"firstLine":-360}},"rPr":{"rFonts":{"ascii":"Symbol","cs":"Symbol","eastAsia":"Symbol","hAnsi":"Symbol"}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"bullet"},"lvlText":"¨","pPr":{"ind":{"left":1800,"firstLine":-360}},"rPr":{"rFonts":{"ascii":"Symbol","cs":"Symbol","eastAsia":"Symbol","hAnsi":"Symbol"}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"bullet"},"lvlText":"Ø","pPr":{"ind":{"left":2160,"firstLine":-360}},"rPr":{"rFonts":{"ascii":"Wingdings","cs":"Wingdings","eastAsia":"Wingdings","hAnsi":"Wingdings"}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"bullet"},"lvlText":"§","pPr":{"ind":{"left":2520,"firstLine":-360}},"rPr":{"rFonts":{"ascii":"Wingdings","cs":"Wingdings","eastAsia":"Wingdings","hAnsi":"Wingdings"}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"bullet"},"lvlText":"·","pPr":{"ind":{"left":2880,"firstLine":-360}},"rPr":{"rFonts":{"ascii":"Symbol","cs":"Symbol","eastAsia":"Symbol","hAnsi":"Symbol"}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"bullet"},"lvlText":"¨","pPr":{"ind":{"left":3240,"firstLine":-360}},"rPr":{"rFonts":{"ascii":"Symbol","cs":"Symbol","eastAsia":"Symbol","hAnsi":"Symbol"}}}]}',
                    '{"Type":"number","Headings":true,"Lvl":[{"lvlJc":"left","suff":"tab","numFmt":{"val":"upperRoman"},"lvlText":"%1.","pPr":{"ind":{"left":0,"firstLine":0}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"upperLetter"},"lvlText":"%2.","pPr":{"ind":{"left":720,"firstLine":0}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%3.","pPr":{"ind":{"left":1440,"firstLine":0}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"lowerLetter"},"lvlText":"%4)","pPr":{"ind":{"left":2160,"firstLine":0}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"(%5)","pPr":{"ind":{"left":2880,"firstLine":0}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"lowerLetter"},"lvlText":"(%6)","pPr":{"ind":{"left":3600,"firstLine":0}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"lowerRoman"},"lvlText":"(%7)","pPr":{"ind":{"left":4320,"firstLine":0}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"lowerLetter"},"lvlText":"(%8)","pPr":{"ind":{"left":5040,"firstLine":0}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"lowerRoman"},"lvlText":"(%9)","pPr":{"ind":{"left":5760,"firstLine":0}}}]}',
                    '{"Type":"number","Headings":true,"Lvl":[{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1.","pPr":{"ind":{"left":432,"firstLine":-432}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1.%2.","pPr":{"ind":{"left":576,"firstLine":-576}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1.%2.%3.","pPr":{"ind":{"left":720,"firstLine":-720}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1.%2.%3.%4.","pPr":{"ind":{"left":864,"firstLine":-864}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1.%2.%3.%4.%5.","pPr":{"ind":{"left":1008,"firstLine":-1008}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1.%2.%3.%4.%5.%6.","pPr":{"ind":{"left":1152,"firstLine":-1152}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1.%2.%3.%4.%5.%6.%7.","pPr":{"ind":{"left":1296,"firstLine":-1296}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1.%2.%3.%4.%5.%6.%7.%8.","pPr":{"ind":{"left":1440,"firstLine":-1440}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%1.%2.%3.%4.%5.%6.%7.%8.%9.","pPr":{"ind":{"left":1584,"firstLine":-1584}}}]}',
                    '{"Type":"number","Headings":true,"Lvl":[{"lvlJc":"left","suff":"tab","numFmt":{"val":"upperRoman"},"lvlText":"Article %1.","pPr":{"ind":{"left":0,"firstLine":0}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimalZero"},"lvlText":"Section %1.%2","pPr":{"ind":{"left":0,"firstLine":0}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"lowerLetter"},"lvlText":"(%3)","pPr":{"ind":{"left":720,"firstLine":-432}}},{"lvlJc":"right","suff":"tab","numFmt":{"val":"lowerRoman"},"lvlText":"(%4)","pPr":{"ind":{"left":864,"firstLine":-144}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"decimal"},"lvlText":"%5)","pPr":{"ind":{"left":1008,"firstLine":-432}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"lowerLetter"},"lvlText":"%6)","pPr":{"ind":{"left":1152,"firstLine":-432}}},{"lvlJc":"right","suff":"tab","numFmt":{"val":"lowerRoman"},"lvlText":"%7)","pPr":{"ind":{"left":1296,"firstLine":-288}}},{"lvlJc":"left","suff":"tab","numFmt":{"val":"lowerLetter"},"lvlText":"%8.","pPr":{"ind":{"left":1440,"firstLine":-432}}},{"lvlJc":"right","suff":"tab","numFmt":{"val":"lowerRoman"},"lvlText":"%9.","pPr":{"ind":{"left":1584,"firstLine":-144}}}]}',
                    '{"Type":"number","Headings":true,"Lvl":[{"lvlJc":"left","suff":"space","numFmt":{"val":"decimal"},"lvlText":"Chapter %1","pPr":{"ind":{"left":0,"firstLine":0}}},{"lvlJc":"left","suff":"nothing","numFmt":{"val":"none"},"lvlText":"","pPr":{"ind":{"left":0,"firstLine":0}}},{"lvlJc":"left","suff":"nothing","numFmt":{"val":"none"},"lvlText":"","pPr":{"ind":{"left":0,"firstLine":0}}},{"lvlJc":"left","suff":"nothing","numFmt":{"val":"none"},"lvlText":"","pPr":{"ind":{"left":0,"firstLine":0}}},{"lvlJc":"left","suff":"nothing","numFmt":{"val":"none"},"lvlText":"","pPr":{"ind":{"left":0,"firstLine":0}}},{"lvlJc":"left","suff":"nothing","numFmt":{"val":"none"},"lvlText":"","pPr":{"ind":{"left":0,"firstLine":0}}},{"lvlJc":"left","suff":"nothing","numFmt":{"val":"none"},"lvlText":"","pPr":{"ind":{"left":0,"firstLine":0}}},{"lvlJc":"left","suff":"nothing","numFmt":{"val":"none"},"lvlText":"","pPr":{"ind":{"left":0,"firstLine":0}}},{"lvlJc":"left","suff":"nothing","numFmt":{"val":"none"},"lvlText":"","pPr":{"ind":{"left":0,"firstLine":0}}}]}',
                ];

                this.mnuMultilevelPicker = new Common.UI.DataView({
                    el: $('#id-toolbar-menu-multilevels'),
                    parentMenu: this.btnMultilevels.menu,
                    outerMenu:  {menu: this.btnMultilevels.menu, index: 0},
                    restoreHeight: 403,
                    delayRenderTips: true,
                    scrollAlwaysVisible: true,
                    listSettings: listSettings,
                    groups: new Common.UI.DataViewGroupStore(groups),
                    store: new Common.UI.DataViewStore(),
                    itemTemplate: _.template('<div id="<%= id %>" class="item-multilevellist"></div>')
                });
                this.btnMultilevels.menu.setInnerMenu([{menu: this.mnuMultilevelPicker, index: 0}]);
                this.mnuMultilevelPicker.conf = _conf;

                loadPreset('resources/numbering/multilevel-lists.json', this.mode.lang, function (presets) {
                    var libGroup = me.mnuMultilevelPicker.conf.libGroup,
                        arr = [
                        {id: 'id-multilevels-' + Common.UI.getId(), numberingInfo: me._multilevelArr[0], skipRenderOnChange: true, group : libGroup, type: 1},
                        {id: 'id-multilevels-' + Common.UI.getId(), numberingInfo: me._multilevelArr[1], skipRenderOnChange: true, group : libGroup, type: 1},
                        {id: 'id-multilevels-' + Common.UI.getId(), numberingInfo: me._multilevelArr[2], skipRenderOnChange: true, group : libGroup, type: 1},
                        {id: 'id-multilevels-' + Common.UI.getId(), numberingInfo: me._multilevelArr[3], skipRenderOnChange: true, group : libGroup, type: 1},
                        {id: 'id-multilevels-' + Common.UI.getId(), numberingInfo: me._multilevelArr[4], skipRenderOnChange: true, group : libGroup, type: 1},
                        {id: 'id-multilevels-' + Common.UI.getId(), numberingInfo: me._multilevelArr[5], skipRenderOnChange: true, group : libGroup, type: 1}
                    ];
                    if (presets)
                        presets.forEach(function (item){
                            arr.push({id: 'id-multilevels-' + Common.UI.getId(), numberingInfo: JSON.stringify(item), skipRenderOnChange: true, group : libGroup, type: 1});
                        });
                    else
                        arr = arr.concat([
                        {id: 'id-multilevels-' + Common.UI.getId(), numberingInfo: me._multilevelArr[6], skipRenderOnChange: true, group : libGroup, type: 1},
                        {id: 'id-multilevels-' + Common.UI.getId(), numberingInfo: me._multilevelArr[7], skipRenderOnChange: true, group : libGroup, type: 1}
                    ]);
                    me.mnuMultilevelPicker.store.reset(me.mnuMultilevelPicker.conf.recents.concat(arr));
                });

                _conf = this.mnuPageNumberPosPicker ? this.mnuPageNumberPosPicker.conf : undefined;
                var keepState = this.mnuPageNumberPosPicker ? this.mnuPageNumberPosPicker.keepState : undefined;
                this.mnuPageNumberPosPicker = new Common.UI.DataView({
                    el: $('#id-toolbar-menu-pageposition'),
                    lock: this.mnuPageNumberPosPicker.options.lock,
                    allowScrollbar: false,
                    parentMenu:  this.mnuInsertPageNum.menu,
                    outerMenu:  {menu: this.mnuInsertPageNum.menu, index: 0},
                    showLast: false,
                    store: new Common.UI.DataViewStore([
                        {
                            iconname: 'btn-page-number-top-left',
                            data: {
                                type: c_pageNumPosition.PAGE_NUM_POSITION_TOP,
                                subtype: c_pageNumPosition.PAGE_NUM_POSITION_LEFT
                            }
                        },
                        {
                            iconname: 'btn-page-number-top-center',
                            data: {
                                type: c_pageNumPosition.PAGE_NUM_POSITION_TOP,
                                subtype: c_pageNumPosition.PAGE_NUM_POSITION_CENTER
                            }
                        },
                        {
                            iconname: 'btn-page-number-top-right',
                            data: {
                                type: c_pageNumPosition.PAGE_NUM_POSITION_TOP,
                                subtype: c_pageNumPosition.PAGE_NUM_POSITION_RIGHT
                            }
                        },
                        {
                            iconname: 'btn-page-number-bottom-left',
                            data: {
                                type: c_pageNumPosition.PAGE_NUM_POSITION_BOTTOM,
                                subtype: c_pageNumPosition.PAGE_NUM_POSITION_LEFT
                            }
                        },
                        {
                            iconname: 'btn-page-number-bottom-center',
                            data: {
                                type: c_pageNumPosition.PAGE_NUM_POSITION_BOTTOM,
                                subtype: c_pageNumPosition.PAGE_NUM_POSITION_CENTER
                            }
                        },
                        {
                            iconname: 'btn-page-number-bottom-right',
                            data: {
                                type: c_pageNumPosition.PAGE_NUM_POSITION_BOTTOM,
                                subtype: c_pageNumPosition.PAGE_NUM_POSITION_RIGHT
                            }
                        }
                    ]),
                    itemTemplate: _.template('<div id="<%= id %>" class="item-pagenumber options__icon options__icon-huge <%= iconname %>"></div>')
                });
                this.mnuPageNumberPosPicker.keepState = keepState;
                _conf && this.mnuPageNumberPosPicker.setDisabled(_conf.disabled);
                this.mnuInsertPageNum.menu.setInnerMenu([{menu: this.mnuPageNumberPosPicker, index: 0}]);

                this.mnuTablePicker = new Common.UI.DimensionPicker({
                    el: $('#id-toolbar-menu-tablepicker'),
                    minRows: 8,
                    minColumns: 10,
                    maxRows: 8,
                    maxColumns: 10
                });
            },

            onToolbarAfterRender: function(toolbar) {
                // DataView and pickers
                //
                var colorVal;
                if (this.btnHighlightColor.cmpEl) {
                    this.btnHighlightColor.currentColor = 'FFFF00';
                    this.btnHighlightColor.setColor(this.btnHighlightColor.currentColor);
                    this.mnuHighlightColorPicker = new Common.UI.ThemeColorPalette({
                        el: $('#id-toolbar-menu-highlight'),
                        colors: [
                            'FFFF00', '00FF00', '00FFFF', 'FF00FF', '0000FF', 'FF0000', '00008B', '008B8B',
                            '006400', '800080', '8B0000', '808000', 'FFFFFF', 'D3D3D3', 'A9A9A9', '000000'
                        ],
                        colorHints: [
                            Common.Utils.ThemeColor.txtYellow, Common.Utils.ThemeColor.txtBrightGreen, Common.Utils.ThemeColor.txtTurquosie, Common.Utils.ThemeColor.txtPink,
                            Common.Utils.ThemeColor.txtBlue, Common.Utils.ThemeColor.txtRed, Common.Utils.ThemeColor.txtDarkBlue, Common.Utils.ThemeColor.txtTeal,
                            Common.Utils.ThemeColor.txtGreen, Common.Utils.ThemeColor.txtViolet, Common.Utils.ThemeColor.txtDarkRed, Common.Utils.ThemeColor.txtDarkYellow,
                            Common.Utils.ThemeColor.txtWhite, Common.Utils.ThemeColor.txtGray + '-25%', Common.Utils.ThemeColor.txtGray + '-50%', Common.Utils.ThemeColor.txtBlack
                        ],
                        value: 'FFFF00',
                        dynamiccolors: 0,
                        themecolors: 0,
                        effects: 0,
                        columns: 4,
                        outerMenu: {menu: this.btnHighlightColor.menu, index: 0, focusOnShow: true}
                    });
                    this.btnHighlightColor.setPicker(this.mnuHighlightColorPicker);
                    this.btnHighlightColor.menu.setInnerMenu([{menu: this.mnuHighlightColorPicker, index: 0}]);
                }

                if (this.btnFontColor.cmpEl) {
                    this.btnFontColor.setMenu();
                    this.mnuFontColorPicker = this.btnFontColor.getPicker();
                    this.btnFontColor.setColor(this.btnFontColor.currentColor || 'transparent');
                }

                if (this.btnParagraphColor.cmpEl) {
                    this.btnParagraphColor.setMenu();
                    this.mnuParagraphColorPicker = this.btnParagraphColor.getPicker();
                    this.btnParagraphColor.setColor(this.btnParagraphColor.currentColor || 'transparent');
                }

                if (this.btnContentControls.cmpEl) {
                    this.mnuControlsColorPicker = new Common.UI.ThemeColorPalette({
                        el: $('#id-toolbar-menu-controls-color'),
                        colors: ['000000', '993300', '333300', '003300', '003366', '000080', '333399', '333333', '800000', 'FF6600',
                            '808000', '00FF00', '008080', '0000FF', '666699', '808080', 'FF0000', 'FF9900', '99CC00', '339966',
                            '33CCCC', '3366FF', '800080', '999999', 'FF00FF', 'FFCC00', 'FFFF00', '00FF00', '00FFFF', '00CCFF',
                            '993366', 'C0C0C0', 'FF99CC', 'FFCC99', 'FFFF99', 'CCFFCC', 'CCFFFF', 'C9C8FF', 'CC99FF', 'FFFFFF'
                        ],
                        themecolors: 0,
                        effects: 0,
                        outerMenu: {menu: this.mnuHighlightControls, index: 2}
                    });
                    this.mnuHighlightControls.setInnerMenu([{menu: this.mnuControlsColorPicker, index: 2}]);
                }

                if (this.btnPageColor.cmpEl) {
                    this.btnPageColor.setMenu();
                    this.mnuPageColorPicker = this.btnPageColor.getPicker();
                }
            },

            updateMetricUnit: function () {
                var items = this.btnPageMargins.menu.getItems(true);
                for (var i = 0; i < items.length; i++) {
                    var mnu = items[i];
                    if (mnu.checkable) {
                        var checked = mnu.checked;
                        $(mnu.el).html(mnu.template({
                            id: Common.UI.getId(),
                            caption: mnu.caption,
                            options: mnu.options
                        }));
                        if (checked) mnu.setChecked(checked);
                    }
                }
                items = this.btnPageSize.menu.getItems(true);
                for (var i = 0; i < items.length; i++) {
                    var mnu = items[i];
                    if (mnu.checkable) {
                        var checked = mnu.checked;
                        $(mnu.el).html(mnu.template({
                            id: Common.UI.getId(),
                            caption: mnu.caption,
                            options: mnu.options
                        }));
                        if (checked) mnu.setChecked(checked);
                    }
                }
                if (this.spinners) {
                    for (var i=0; i<this.spinners.length; i++) {
                        var spinner = this.spinners[i].cmp;
                        spinner.setDefaultUnit(Common.Utils.Metric.getCurrentMetricName());
                        spinner.setStep(Common.Utils.Metric.getCurrentMetric()==Common.Utils.Metric.c_MetricUnits.pt ? 1 : this.spinners[i].step);
                    }
                }
            },

            setApi: function (api) {
                this.api = api;
                /** coauthoring begin **/
                this.api.asc_registerCallback('asc_onSendThemeColorSchemes', _.bind(this.onSendThemeColorSchemes, this));
                this.api.asc_registerCallback('asc_onCollaborativeChanges', _.bind(this.onCollaborativeChanges, this));
                this.api.asc_registerCallback('asc_onAuthParticipantsChanged', _.bind(this.onApiUsersChanged, this));
                this.api.asc_registerCallback('asc_onParticipantsChanged', _.bind(this.onApiUsersChanged, this));
                /** coauthoring end **/
                return this;
            },

            setMode: function (mode) {
                if (mode.isDisconnected) {
                    this.lockToolbar(Common.enumLock.lostConnect, true);
                    if ( this.synchTooltip )
                        this.synchTooltip.hide();
                    if (!mode.enableDownload)
                        this.lockToolbar(Common.enumLock.cantPrint, true, {array: [this.btnPrint]});
                } else {
                    this.lockToolbar(Common.enumLock.cantPrint, !mode.canPrint, {array: [this.btnPrint]});
                    !mode.canPrint && this.btnPrint && this.btnPrint.hide();
                }


                this.mode = mode;

                this.listStylesAdditionalMenuItem && this.listStylesAdditionalMenuItem.setVisible(mode.canEditStyles);
                this.btnContentControls && this.btnContentControls.menu.items[10].setVisible(mode.canEditContentControl);
                this.mnuInsertImage && this.mnuInsertImage.items[2].setVisible(this.mode.canRequestInsertImage || this.mode.fileChoiceUrl && this.mode.fileChoiceUrl.indexOf("{documentType}")>-1);
            },

            onSendThemeColorSchemes: function (schemas) {
                this.mnuColorSchema && this.mnuColorSchema.removeAll(true);

                if (this.mnuColorSchema == null) {
                    this.mnuColorSchema = new Common.UI.Menu({
                        cls: 'shifted-left',
                        restoreHeight: true
                    });
                }

                var itemTemplate = _.template([
                    '<a id="<%= id %>"  tabindex="-1" type="menuitem" class="<%= options.cls %>">',
                    '<span class="colors">',
                    '<% _.each(options.colors, function(color) { %>',
                    '<span class="color" style="background: <%= color %>;"></span>',
                    '<% }) %>',
                    '</span>',
                    '<span class="text"><%= caption %></span>',
                    '</a>'
                ].join(''));

                _.each(schemas, function (schema, index) {
                    var colors = schema.get_colors();//schema.colors;
                    var schemecolors = [];
                    for (var j = 2; j < 7; j++) {
                        var clr = '#' + Common.Utils.ThemeColor.getHexColor(colors[j].get_r(), colors[j].get_g(), colors[j].get_b());
                        schemecolors.push(clr);
                    }

                    if (index == 24) {
                        this.mnuColorSchema.addItem({
                            caption: '--'
                        }, true);
                    }
                    this.mnuColorSchema.addItem({
                        template: itemTemplate,
                        cls: 'color-schemas-menu',
                        colors: schemecolors,
                        caption: schema.get_name(),
                        value: index,
                        checkable: true,
                        toggleGroup: 'menuSchema'
                    }, true);
                }, this);
            },

            /** coauthoring begin **/
            onCollaborativeChanges: function () {
                if (this._state.hasCollaborativeChanges) return;
                if (!this.btnCollabChanges.rendered || this._state.previewmode) {
                    this.needShowSynchTip = true;
                    return;
                }

                this._state.hasCollaborativeChanges = true;
                this.btnCollabChanges.cmpEl.addClass('notify');
                if (this.showSynchTip) {
                    this.btnCollabChanges.updateHint('');
                    if (this.synchTooltip === undefined)
                        this.createSynchTip();

                    this.synchTooltip.target = this.btnCollabChanges.$el.is(':visible') ? this.btnCollabChanges.$el : $('[data-layout-name=toolbar-file]', this.$el);
                    this.synchTooltip.show();
                } else {
                    this.btnCollabChanges.updateHint(this.tipSynchronize + Common.Utils.String.platformKey('Ctrl+S'));
                }

                this.lockToolbar(Common.enumLock.cantSave, false, {array: [this.btnSave]});
                Common.Gateway.collaborativeChanges();
            },

            createSynchTip: function () {
                var direction = Common.UI.isRTL() ? 'left' : 'right';
                this.synchTooltip = new Common.UI.SynchronizeTip({
                    extCls: (this.mode.compactHeader) ? undefined : 'inc-index',
                    placement: this.mode.isDesktopApp ? 'bottom-' + direction : direction + '-bottom',
                });
                this.synchTooltip.on('dontshowclick', function () {
                    this.showSynchTip = false;
                    this.synchTooltip.hide();
                    this.btnCollabChanges.updateHint(this.tipSynchronize + Common.Utils.String.platformKey('Ctrl+S'));
                    Common.localStorage.setItem("de-hide-synch", 1);
                }, this);
                this.synchTooltip.on('closeclick', function () {
                    this.synchTooltip.hide();
                    this.btnCollabChanges.updateHint(this.tipSynchronize + Common.Utils.String.platformKey('Ctrl+S'));
                }, this);
            },

            synchronizeChanges: function () {
                if ( !this._state.previewmode && this.btnCollabChanges.rendered ) {
                    var me = this;

                    if ( me.btnCollabChanges.cmpEl.hasClass('notify') ) {
                        me.btnCollabChanges.cmpEl.removeClass('notify');
                        if (this.synchTooltip)
                            this.synchTooltip.hide();
                        this.btnCollabChanges.updateHint(this.btnSaveTip);

                        this.lockToolbar(Common.enumLock.cantSave, !me.mode.forcesave && !me.mode.canSaveDocumentToBinary && me.mode.canSaveToFile || !me.mode.showSaveButton, {array: [this.btnSave]});
                        this._state.hasCollaborativeChanges = false;
                    }
                }
            },

            onApiUsersChanged: function (users) {
                var editusers = [];
                _.each(users, function (item) {
                    if (!item.asc_getView())
                        editusers.push(item);
                });

                var me = this;
                var length = _.size(editusers);
                var cls = (length > 1) ? 'btn-save-coauth' : 'btn-save';
                if ( cls !== me.btnSaveCls && me.btnCollabChanges.rendered ) {
                    me.btnSaveTip = ((length > 1) ? me.tipSaveCoauth : me.tipSave ) + Common.Utils.String.platformKey('Ctrl+S');
                    me.btnCollabChanges.updateHint(me.btnSaveTip);
                    me.btnCollabChanges.changeIcon({next: cls, curr: me.btnSaveCls});
                    me.btnSaveCls = cls;
                }
            },

            /** coauthoring end **/

            onStyleMenuUpdate: function (item, e, eOpt) {
                var me = this;
                if (me.api) {
                    var style = me.api.asc_GetStyleFromFormatting();
                    var title = item.styleTitle;

                    var characterStyle = style.get_Link();
                    style.put_Name(title);
                    characterStyle.put_Name(title + '_character');
                    me.api.asc_AddNewStyle(style);
                    setTimeout(function () {
                        me.listStyles.openButton.menu.hide();
                    }, 100);
                }
            },

            onStyleMenuDelete: function (item, e, eOpt) {
                var me = this;
                if (me.api) {
                    this.api.asc_RemoveStyle(item.styleTitle);
                }
            },

            onStyleMenuRestoreAll: function (item, e, eOpt) {
                var me = this;
                if (me.api) {
                    _.each(window.styles.get_MergedStyles(), function (style) {
                        if (me.api.asc_IsStyleDefault(style.get_Name())) {
                            me.api.asc_RemoveStyle(style.get_Name());
                        }
                    });
                }
            },

            onStyleMenuDeleteAll: function (item, e, eOpt) {
                if (this.api)
                    this.api.asc_RemoveAllCustomStyles();
            },

            onUpdateLastCustomMargins: function(props) {
                if (!this.btnPageMargins) return;

                var top = props ? props.get_TopMargin() : Common.localStorage.getItem("de-pgmargins-top"),
                    left = props ? props.get_LeftMargin() : Common.localStorage.getItem("de-pgmargins-left"),
                    bottom = props ? props.get_BottomMargin() : Common.localStorage.getItem("de-pgmargins-bottom"),
                    right = props ? props.get_RightMargin() : Common.localStorage.getItem("de-pgmargins-right");
                if ( top!==null && left!==null && bottom!==null && right!==null ) {
                    var mnu = this.btnPageMargins.menu.items[0];
                    mnu.options.value = mnu.value = [parseFloat(top), parseFloat(left), parseFloat(bottom), parseFloat(right)];
                    mnu.setVisible(true);
                    $(mnu.el).html(mnu.template({id: Common.UI.getId(), caption : mnu.caption, options : mnu.options}));
                } else
                    this.btnPageMargins.menu.items[0].setVisible(false);
            },

            loadRecentSymbolsFromStorage: function(){
                var recents = Common.localStorage.getItem('de-fastRecentSymbols');
                var arr =(!!recents) ? JSON.parse(recents) :
                    [
                        { symbol: 8226,     font: 'Arial'},
                        { symbol: 8364,     font: 'Arial'},
                        { symbol: 65284,    font: 'Arial'},
                        { symbol: 165,      font: 'Arial'},
                        { symbol: 169,      font: 'Arial'},
                        { symbol: 174,      font: 'Arial'},
                        { symbol: 189,      font: 'Arial'},
                        { symbol: 188,      font: 'Arial'},
                        { symbol: 8800,     font: 'Arial'},
                        { symbol: 177,      font: 'Arial'},
                        { symbol: 247,      font: 'Arial'},
                        { symbol: 8730,     font: 'Arial'},
                        { symbol: 8804,     font: 'Arial'},
                        { symbol: 8805,     font: 'Arial'},
                        { symbol: 8482,     font: 'Arial'},
                        { symbol: 8734,     font: 'Arial'},
                        { symbol: 126,      font: 'Arial'},
                        { symbol: 176,      font: 'Arial'},
                        { symbol: 167,      font: 'Arial'},
                        { symbol: 945,      font: 'Arial'},
                        { symbol: 946,      font: 'Arial'},
                        { symbol: 960,      font: 'Arial'},
                        { symbol: 916,      font: 'Arial'},
                        { symbol: 9786,     font: 'Arial'},
                        { symbol: 9829,     font: 'Arial'}
                    ];
                arr.forEach(function (item){
                    item.tip = this.getSymbolDescription(item.symbol);
                }.bind(this));
                return arr;
            },

            saveSymbol: function(symbol, font) {
                var maxLength =25,
                    picker = this.mnuInsertSymbolsPicker;
                var item = picker.store.find(function(item){
                    return item.get('symbol') == symbol && item.get('font') == font
                });

                item && picker.store.remove(item);
                picker.store.add({symbol: symbol, font: font, tip: this.getSymbolDescription(symbol)},{at:0});
                picker.store.length > maxLength && picker.store.remove(picker.store.last());

                var arr = picker.store.map(function (item){
                    return {symbol: item.get('symbol'), font: item.get('font')};
                });
                var sJSON = JSON.stringify(arr);
                Common.localStorage.setItem( 'de-fastRecentSymbols', sJSON);
            },

            getSymbolDescription: function(symbol){
                var  specSymbol = this.specSymbols.find(function (item){return item.symbol == symbol});
                return !!specSymbol ? specSymbol.description : this.capBtnInsSymbol + ': ' + symbol;
            },

            loadListPresetsFromStorage: function(path, groupId, recentCount) {
                var recents = Common.localStorage.getItem(path),
                    arr = [];
                recents = recents ? JSON.parse(recents) : [];
                for (var i=0; i<recents.length && i<recentCount; i++) {
                    arr.push({id: 'id-recent-list-' + Common.UI.getId(), numberingInfo: recents[i], skipRenderOnChange: true, group : groupId, type: 0});
                }
                return arr;
            },

            saveListPresetToStorage: function(picker) {
                if (picker) {
                    var arr = [];
                    _.each(picker.store.where({type: 0}), function(rec){
                        arr.push(rec.get('numberingInfo'));
                    });
                    Common.localStorage.setItem(picker.options.listSettings.recentPath, JSON.stringify(arr));
                }
            },

            onDesktopWindow: function() {
                if (this.synchTooltip && this.synchTooltip.isVisible()) {
                    this.synchTooltip.show(); // change position for visible tip
                }
            },

            lockToolbar: function (causes, lock, opts) {
                Common.Utils.lockControls(causes, lock, opts, this.lockControls);
            }
        }
    })(), DE.Views.Toolbar || {}));
});
