/**
 * Copyright (C) 2013-2016 OpenMediaVault Plugin Developers
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
// require("js/omv/WorkspaceManager.js")
// require("js/omv/workspace/form/Panel.js")
// require("js/omv/workspace/window/Form.js")
// require("js/omv/data/Store.js")
// require("js/omv/data/Model.js")
// require("js/omv/data/proxy/Rpc.js")
// require("js/omv/workspace/window/plugin/ConfigObject.js")
// require("js/omv/form/field/SharedFolderComboBox.js")

Ext.define("OMV.module.admin.system.backup.PhotoRec", {
    extend : "OMV.workspace.form.Panel",
    uses   : [
        "OMV.data.Model",
        "OMV.data.Store"
    ],

    rpcService   : "Backup",
    rpcGetMethod : "getPhotorec",
    rpcSetMethod : "setPhotorec",

    hideOkButton : true,

    plugins      : [{
        ptype        : "linkedfields",
        correlations : [{
            name       : [
                "bmp", "bz2", "doc",
                "gz",  "mkv", "mov",
                "mp3", "mpg", "pdf",
                "png", "raw", "tif",
                "tx",  "txt", "zip"
            ],
            conditions : [
                { name  : "everything", value : true }
            ],
            properties : [ "!checked", "disabled" ]
        }]
    }],

    getFormItems : function() {
        var me = this;
        return [{
            xtype    : "fieldset",
            title    : _("Settings"),
            defaults : {
                labelSeparator : ""
            },
            items : [{
                xtype         : "combo",
                name          : "source",
                fieldLabel    : _("Source"),
                emptyText     : _("Select a drive ..."),
                allowBlank    : false,
                allowNone     : false,
                editable      : false,
                triggerAction : "all",
                displayField  : "display",
                valueField    : "drive",
                store         : Ext.create("OMV.data.Store", {
                    autoLoad : true,
                    model    : OMV.data.Model.createImplicit({
                        idProperty : "uuid",
                        fields     : [
                            { name : "drive", type : "string" },
                            { name : "display", type : "string" }
                        ]
                    }),
                    proxy : {
                        type : "rpc",
                        rpcData : {
                            service : "Backup",
                            method  : "getDrives",
                            params  : {
                                extonly : false
                            }
                        },
                        appendSortParams : false
                    },
                    sorters : [{
                        direction : "ASC",
                        property  : "drive"
                    }]
                }),
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("Drive with missing or lost files.")
                }]
            },{
                xtype      : "sharedfoldercombo",
                name       : "destination",
                fieldLabel : _("Destination"),
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("Shared folder where recovered files will be placed.")
                }]
            },{
                xtype      : "checkbox",
                name       : "freespace",
                fieldLabel : _("Freespace"),
                boxLabel   : _("Files will be recovered only from the free space."),
                checked    : false
            },{
                xtype      : "checkbox",
                name       : "everything",
                fieldLabel : _("Everything"),
                boxLabel   : _("All file types known to PhotoRec will attempted to be recovered."),
                checked    : true
            },{
                xtype      : "checkbox",
                name       : "bmp",
                fieldLabel : _("bmp"),
                boxLabel   : _("BMP bitmap image"),
                checked    : false
            },{
                xtype      : "checkbox",
                name       : "bz2",
                fieldLabel : _("bz2"),
                boxLabel   : _("bzip2 compressed data"),
                checked    : false
            },{
                xtype      : "checkbox",
                name       : "doc",
                fieldLabel : _("doc"),
                boxLabel   : _("Microsoft Office Document (doc/xls/ppt/vsd/...), 3ds Max, MetaStock"),
                checked    : false
            },{
                xtype      : "checkbox",
                name       : "gz",
                fieldLabel : _("gz"),
                boxLabel   : _("gzip compressed data"),
                checked    : false
            },{
                xtype      : "checkbox",
                name       : "mkv",
                fieldLabel : _("mkv"),
                boxLabel   : _("Matroska video file"),
                checked    : false
            },{
                xtype      : "checkbox",
                name       : "mov",
                fieldLabel : _("mov"),
                boxLabel   : _("mov/mp4/3gp/3g2/jp2"),
                checked    : false
            },{
                xtype      : "checkbox",
                name       : "mp3",
                fieldLabel : _("mp3"),
                boxLabel   : _("MP3 audio (MPEG ADTS, layer III, v1)"),
                checked    : false
            },{
                xtype      : "checkbox",
                name       : "mpg",
                fieldLabel : _("mpg"),
                boxLabel   : _("Moving Picture Experts Group video"),
                checked    : false
            },{
                xtype      : "checkbox",
                name       : "pdf",
                fieldLabel : _("pdf"),
                boxLabel   : _("Portable Document Format, Adobe Illustrator"),
                checked    : false
            },{
                xtype      : "checkbox",
                name       : "png",
                fieldLabel : _("png"),
                boxLabel   : _("Portable/JPEG/Multiple-Image Network Graphics"),
                checked    : false
            },{
                xtype      : "checkbox",
                name       : "raw",
                fieldLabel : _("raw"),
                boxLabel   : _("Contax picture, Panasonic/Leica RAW"),
                checked    : false
            },{
                xtype      : "checkbox",
                name       : "tif",
                fieldLabel : _("tif"),
                boxLabel   : _("Tag Image File Format and some raw file formats (pef/nef/dcr/sr2/cr2)"),
                checked    : false
            },{
                xtype      : "checkbox",
                name       : "tx",
                fieldLabel : _("tx?"),
                boxLabel   : _("Text files with header: rtf,xml,xhtml,imm,pm,ram,reg,sh,slk,stp"),
                checked    : false
            },{
                xtype      : "checkbox",
                name       : "txt",
                fieldLabel : _("txt"),
                boxLabel   : _("Other text files: txt,html,asp,bat,C,jsp,perl,php,py/emlx... scripts"),
                checked    : false
            },{
                xtype      : "checkbox",
                name       : "zip",
                fieldLabel : _("zip"),
                boxLabel   : _("zip archive including OpenOffice and MSOffice 2007"),
                checked    : false
            },{
                xtype   : "button",
                name    : "recover",
                text    : _("Recover with output"),
                scope   : this,
                handler : Ext.Function.bind(me.onRecoverButton, me, [ me ]),
                margin  : "5 10 0 0"
            },{
                xtype   : "button",
                name    : "silent",
                text    : _("Silent Recover"),
                scope   : this,
                handler : Ext.Function.bind(me.onSilentButton, me, [ me ]),
                margin  : "5 0 0 0"
            },{
                border : false,
                html   : "<ul><li>" + _("This will attempt recovery of lost files from a damaged drive or accidentally deleted using PhotoRec.") + "</li>" +
                         "<li>" + _("For more information, see PhotoRec wiki") + " - <a href='http://www.cgsecurity.org/wiki/PhotoRec' target=_blank>" + _("link") + "</a></li></ul>"
            }]
        }];
    },

    onRecoverButton: function() {
        var me = this;
        me.doSubmit();
        Ext.create("OMV.window.Execute", {
            title      : _("Recover using Photorec"),
            rpcService : "Backup",
            rpcMethod  : "doRecover",
            listeners  : {
                scope     : me,
                exception : function(wnd, error) {
                    OMV.MessageBox.error(null, error);
                }
            }
        }).show();
    },

    onSilentButton: function() {
        var me = this;
        me.doSubmit();
        OMV.Rpc.request({
            scope       : this,
            relayErrors : false,
            rpcData     : {
                service  : "Backup",
                method   : "doSilent"
            }
        });
    }

});

OMV.WorkspaceManager.registerPanel({
    id        : "photorec",
    path      : "/system/backup",
    text      : _("PhotoRec"),
    position  : 60,
    className : "OMV.module.admin.system.backup.PhotoRec"
});
