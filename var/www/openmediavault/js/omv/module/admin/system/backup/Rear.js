/**
 * Copyright (C) 2010-2012 Ian Moore <imooreyahoo@gmail.com>
 * Copyright (C) 2013-2014 OpenMediaVault Plugin Developers
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
// require("js/omv/data/Store.js")
// require("js/omv/data/Model.js")
// require("js/omv/form/plugin/LinkedFields.js")
// require("js/omv/window/MessageBox.js")

Ext.define("OMV.module.admin.system.backup.Rear", {
    extend : "OMV.workspace.form.Panel",
    uses   : [
        "OMV.data.Model",
        "OMV.data.Store"
    ],

    rpcService   : "Backup",
    rpcGetMethod : "getRear",
    rpcSetMethod : "setRear",

    getButtonItems : function() {
        var me = this;
        var items = me.callParent(arguments);
        items.push({
            id      : me.getId() + "-mkbackuponly",
            xtype   : "button",
            text    : _("Backup"),
            icon    : "images/add.png",
            iconCls : Ext.baseCSSPrefix + "btn-icon-16x16",
            scope   : me,
            handler : Ext.Function.bind(me.onBackupButton, me, [ "only" ])
        },{
            id      : me.getId() + "-mkbackup",
            xtype   : "button",
            text    : _("Backup+Rescue"),
            icon    : "images/add.png",
            iconCls : Ext.baseCSSPrefix + "btn-icon-16x16",
            scope   : me,
            handler : Ext.Function.bind(me.onBackupButton, me, [ "backup" ])
        },{
            id      : me.getId() + "-mkrescue",
            xtype   : "button",
            text    : _("Rescue"),
            icon    : "images/add.png",
            iconCls : Ext.baseCSSPrefix + "btn-icon-16x16",
            scope   : me,
            handler : Ext.Function.bind(me.onBackupButton, me, [ "rescue" ])
        },{
            id      : me.getId() + "-dump",
            xtype   : "button",
            text    : _("Info"),
            icon    : "images/add.png",
            iconCls : Ext.baseCSSPrefix + "btn-icon-16x16",
            scope   : me,
            handler : Ext.Function.bind(me.onDumpButton, me, [ me ])
        });
        return items;
    },

    getFormItems : function() {
        return [{
            xtype    : "fieldset",
            title    : "General settings",
            defaults : {
                labelSeparator : ""
            },
            items : [{
                xtype      : "combo",
                name       : "output",
                fieldLabel : _("Output"),
                mode       : "local",
                store      : new Ext.data.SimpleStore({
                    fields  : [ "value", "text" ],
                    data    : [
                        [ "ISO", _("ISO") ],
                        [ "USB", _("SUB") ]
                    ]
                }),
                displayField  : "text",
                valueField    : "value",
                allowBlank    : false,
                editable      : false,
                triggerAction : "all",
                value         : "ISO",
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("")
                }]
            },{
                xtype      : "combo",
                name       : "backuptype",
                fieldLabel : _("Backup Type"),
                mode       : "local",
                store      : new Ext.data.SimpleStore({
                    fields  : [ "value", "text" ],
                    data    : [
                        [ "incremental", _("Incremental") ],
                        [ "full", _("Full") ]
                    ]
                }),
                displayField  : "text",
                valueField    : "value",
                allowBlank    : false,
                editable      : false,
                triggerAction : "all",
                value         : "incremental",
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("")
                }]
            },{
                xtype      : "textfield",
                name       : "outputurl",
                fieldLabel : _("Output URL"),
                allowBlank : false,
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("OUTPUT_URL=file://  Write the image to disk. The default is in /var/lib/rear/output/.
                               OUTPUT_URL=ftp://   Write the image using lftp and the FTP protocol.
                               OUTPUT_URL=ftps://  Write the image using lftp and the FTPS protocol.
                               OUTPUT_URL=http://  Write the image using lftp and the HTTP (PUT) procotol.
                               OUTPUT_URL=https:// Write the image using lftp and the HTTPS (PUT) protocol.
                               OUTPUT_URL=sftp://  Write the image using lftp and the secure FTP (SFTP) protocol.
                               OUTPUT_URL=rsync:// Write the image using rsync and the RSYNC protocol.")
                }]
            },{
                xtype      : "combo",
                name       : "compressiontype",
                fieldLabel : _("Compression Type"),
                mode       : "local",
                store      : new Ext.data.SimpleStore({
                    fields  : [ "value", "text" ],
                    data    : [
                        [ "--gzip", _("gzip") ],
                        [ "--bzip2", _("bzip2") ],
                        [ "--xz", _("xz") ]
                    ]
                }),
                displayField  : "text",
                valueField    : "value",
                allowBlank    : false,
                editable      : false,
                triggerAction : "all",
                value         : "gzip",
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("")
                }]
            },{
                xtype       : "passwordfield",
                name        : "grubrescuepassword",
                fieldLabel  : _("Grub Rescue Password"),
                allowBlank  : true,
                submitValue : false
            },{
                xtype       : "passwordfield",
                name        : "sshpassword",
                fieldLabel  : _("Password"),
                allowBlank  : true,
                submitValue : false
            }]
        }];
    },

    onBackupButton : function(cmd) {
        var me = this;
        var title = "";
        switch(cmd) {
            case "only":
                title = _("Make backup without rescue ...");
                break;
            case "rescue":
                title = _("Make rescue without backup ...");
                break;
            default:
                title = _("Make backup and rescue ...");
        }
        var wnd = Ext.create("OMV.window.Execute", {
            title           : title,
            rpcService      : "Backup",
            rpcMethod       : "doBackup",
            rpcParams       : {
                "command" : cmd
            },
            rpcIgnoreErrors : true,
            hideStartButton : true,
            hideStopButton  : true,
            listeners       : {
                scope     : me,
                finish    : function(wnd, response) {
                    wnd.appendValue(_("Done..."));
                    wnd.setButtonDisabled("close", false);
                },
                exception : function(wnd, error) {
                    OMV.MessageBox.error(null, error);
                    wnd.setButtonDisabled("close", false);
                },
                close     : function() {
                    this.doReload();
                }
            }
        });
        wnd.setButtonDisabled("close", true);
        wnd.show();
        wnd.start();
    },

    onDumpButton : function(cmd) {
        var me = this;
        var wnd = Ext.create("OMV.window.Execute", {
            title           : "REAR Information",
            rpcService      : "Backup",
            rpcMethod       : "doDump",
            rpcIgnoreErrors : true,
            hideStartButton : true,
            hideStopButton  : true,
            listeners       : {
                scope     : me,
                finish    : function(wnd, response) {
                    wnd.appendValue(_("Done..."));
                    wnd.setButtonDisabled("close", false);
                },
                exception : function(wnd, error) {
                    OMV.MessageBox.error(null, error);
                    wnd.setButtonDisabled("close", false);
                },
                close     : function() {
                    this.doReload();
                }
            }
        });
        wnd.setButtonDisabled("close", true);
        wnd.show();
        wnd.start();
    }
});

OMV.WorkspaceManager.registerPanel({
    id        : "rear",
    path      : "/system/rear",
    text      : _("Relax-and-Recover (REAR)"),
    position  : 10,
    className : "OMV.module.admin.system.backup.Rear"
});
