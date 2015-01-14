/**
 * Copyright (C) 2015 OpenMediaVault Plugin Developers
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
// require("js/omv/data/proxy/Rpc.js")
// require("js/omv/workspace/window/plugin/ConfigObject.js")
// require("js/omv/window/MessageBox.js")

Ext.define("OMV.module.admin.system.backup.Rear", {
    extend : "OMV.workspace.form.Panel",
    uses   : [
        "OMV.data.Model",
        "OMV.data.Store",
        "OMV.workspace.window.plugin.ConfigObject",
        "OMV.form.plugin.LinkedFields"
    ],

    plugins: [{
        ptype        : "linkedfields",
        correlations : [{
            conditions : [{
                name  : "output",
                value : "USB"
            }],
            name       : [
                "fsuuid"
            ],
            properties : [
                "show"
            ]
        },{
            conditions : [{
                name  : "output",
                value : "ISO"
            }],
            name       : [
                "outputurltype",
                "outputurl",
                "outputusername",
                "outputpassword"
            ],
            properties : [
                "show"
            ]
        },{
            conditions : [{
                name  : "output",
                value : "ISO"
            }],
            name       : [
                "outputurl"
            ],
            properties : [
                "!allowBlank"
            ]
        },{
            conditions : [{
                name  : "backuptype",
                value : "incremental"
            }],
            name       : [
                "incrementalday"
            ],
            properties : [
                "show"
            ]
        }]
    }],

    rpcService   : "Backup",
    rpcGetMethod : "getRear",
    rpcSetMethod : "setRear",

    hideOkButton    : false,
    hideResetButton : true,

    getButtonItems : function() {
        var me = this;
        var items = me.callParent(arguments);
        items.push({
            xtype   : "button",
            text    : _("Backup"),
            scope   : me,
            icon    : "images/save.png",
            iconCls : Ext.baseCSSPrefix + "btn-icon-16x16",
            menu    : [{
                text    : _("Backup only"),
                handler : Ext.Function.bind(me.onBackupButton, me, [ "only" ])
            },{
                text    : _("Backup + Rescue"),
                handler : Ext.Function.bind(me.onBackupButton, me, [ "backup" ])
            },{
                text    : _("Rescue only"),
                handler : Ext.Function.bind(me.onBackupButton, me, [ "rescue" ])
            }]
        },{
            xtype   : "button",
            text    : _("Info"),
            icon    : "images/details.png",
            iconCls : Ext.baseCSSPrefix + "btn-icon-16x16",
            scope   : me,
            handler : Ext.Function.bind(me.onDumpButton, me, [ me ])
        });
        return items;
    },

    getFormItems : function() {
        var me = this;
        return [{
            xtype    : "fieldset",
            title    : "General settings",
            defaults : {
                labelSeparator : ""
            },
            items : [{
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
                    text  : _("Incremental")
                }]
            },{
                xtype      : "combo",
                name       : "incrementalday",
                fieldLabel : _("Incremental Day"),
                mode       : "local",
                hidden     : true,
                store      : new Ext.data.SimpleStore({
                    fields  : [ "value", "text" ],
                    data    : [
                        [ "sun", _("Sunday") ],
                        [ "mon", _("Monday") ],
                        [ "tue", _("Tuesday") ],
                        [ "wed", _("Wednesday") ],
                        [ "thu", _("Thursday") ],
                        [ "fri", _("Friday") ],
                        [ "sat", _("Saturday") ]
                    ]
                }),
                displayField  : "text",
                valueField    : "value",
                allowBlank    : false,
                editable      : false,
                triggerAction : "all",
                value         : "mon"
            },{
                xtype      : "combo",
                name       : "output",
                fieldLabel : _("Output"),
                mode       : "local",
                store      : new Ext.data.SimpleStore({
                    fields  : [ "value", "text" ],
                    data    : [
                        [ "ISO", _("ISO") ],
                        [ "USB", _("USB") ]
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
                    text  : _("USB")
                }]
            },{
                xtype         : "combo",
                name          : "fsuuid",
                fieldLabel    : _("Device"),
                emptyText     : _("Select a device ..."),
                allowBlank    : false,
                allowNone     : false,
                editable      : false,
                hidden        : true,
                triggerAction : "all",
                displayField  : "description",
                valueField    : "uuid",
                trigger2Cls   : Ext.baseCSSPrefix + "form-search-trigger",
                store         : Ext.create("OMV.data.Store", {
                    autoLoad : true,
                    model    : OMV.data.Model.createImplicit({
                        idProperty  : "uuid",
                        fields      : [
                            { name : "uuid", type : "string" },
                            { name : "devicefile", type : "string" },
                            { name : "label", type : "string" },
                            { name : "type", type : "string" },
                            { name : "description", type : "string" }
                        ]
                    }),
                    proxy : {
                        type             : "rpc",
                        appendSortParams : false,
                        rpcData          : {
                            service : "UsbBackup",
                            method  : "getCandidates"
                        }
                    },
                    sorters : [{
                        direction : "ASC",
                        property  : "devicefile"
                    }]
                }),
                plugins : [{
                    ptype : "fieldinfo",
                    text  : _("The external storage device.")
                }],
                listeners : {
                    scope       : me,
                    afterrender : function(c, eOpts) {
                        // Add tooltip to trigger button.
                        var trigger2El = c.getTriggerButtonEl(c.trigger2Cls);
                        Ext.tip.QuickTipManager.register({
                            target : trigger2El.id,
                            text   : _("Scan")
                        });
                    }
                },
                onTrigger2Click : function(c) {
                    var me = this;
                    // Reload list of detected external storage devices.
                    delete me.lastQuery;
                    me.store.reload();
                }
            },{
                xtype      : "combo",
                name       : "outputurltype",
                fieldLabel : _("Output URL Type"),
                mode       : "local",
                hidden     : true,
                store      : new Ext.data.SimpleStore({
                    fields  : [ "value", "text" ],
                    data    : [
                        [ "file", _("file") ],
                        [ "ftp", _("ftp") ],
                        [ "ftps", _("ftps") ],
                        [ "http", _("http") ],
                        [ "https", _("https") ],
                        [ "nfs", _("nfs") ],
                        [ "rsync", _("rsync") ],
                        [ "sftp", _("sftp") ],
                        [ "smb", _("smb/cifs") ],
                    ]
                }),
                displayField  : "text",
                valueField    : "value",
                allowBlank    : false,
                editable      : false,
                triggerAction : "all",
                value         : "nfs"
            },{
                xtype      : "textfield",
                name       : "outputurl",
                fieldLabel : _("Output Path/URL"),
                allowBlank : true,
                hidden     : true
            },{
                xtype      : "textfield",
                name       : "outputusername",
                fieldLabel : _("Output Username"),
                allowBlank : true,
                hidden     : true
            },{
                xtype      : "textfield",
                name       : "outputpassword",
                fieldLabel : _("Output Password"),
                allowBlank : true,
                hidden     : true
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
                    text  : _("gzip")
                }]
            },{
                xtype       : "textfield",
                name        : "excludes",
                fieldLabel  : _("Excludes"),
                allowBlank  : true,
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("Put a space between exclusions. Default exclusions:  /tmp/* /dev/shm/* /var/lib/rear/output/*")
                }]
            },{
                xtype       : "passwordfield",
                name        : "grubrescuepassword",
                fieldLabel  : _("Grub Rescue Password"),
                allowBlank  : true
            },{
                xtype       : "passwordfield",
                name        : "sshpassword",
                fieldLabel  : _("Password"),
                allowBlank  : true
            }]
        }];
    },

    onBackupButton : function(cmd) {
        var me = this;
        var title = "";
        me.doSubmit();
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
            rpcMethod       : "doRearBackup",
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
        me.doSubmit();
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
    path      : "/system/backup",
    text      : _("Relax-and-Recover"),
    position  : 10,
    className : "OMV.module.admin.system.backup.Rear"
});
