/**
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
// require("js/omv/workspace/window/Form.js")
// require("js/omv/data/Store.js")
// require("js/omv/data/Model.js")
// require("js/omv/data/proxy/Rpc.js")
// require("js/omv/workspace/window/plugin/ConfigObject.js")
// require("js/omv/form/field/SharedFolderComboBox.js")

Ext.define("OMV.module.admin.system.backup.SystemBackup", {
    extend : "OMV.workspace.form.Panel",
    uses   : [
        "OMV.data.Model",
        "OMV.data.Store"
    ],

    rpcService   : "Backup",
    rpcGetMethod : "getSettings",
    rpcSetMethod : "setSettings",

    hideOkButton : true,

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
                name          : "mntentref",
                fieldLabel    : _("Volume"),
                emptyText     : _("Select a volume ..."),
                allowBlank    : false,
                allowNone     : false,
                editable      : false,
                triggerAction : "all",
                displayField  : "description",
                valueField    : "uuid",
                store         : Ext.create("OMV.data.Store", {
                    autoLoad : true,
                    model    : OMV.data.Model.createImplicit({
                        idProperty : "uuid",
                        fields     : [
                            { name : "uuid", type : "string" },
                            { name : "devicefile", type : "string" },
                            { name : "description", type : "string" }
                        ]
                    }),
                    proxy : {
                        type : "rpc",
                        rpcData : {
                            service : "Backup",
                            method  : "getCandidates"
                        },
                        appendSortParams : false
                    },
                    sorters : [{
                        direction : "ASC",
                        property  : "devicefile"
                    }]
                })
            },{
                xtype      : "textfield",
                name       : "path",
                fieldLabel : _("Path"),
                allowNone  : true,
                readOnly   : true
            },{
                xtype   : "button",
                name    : "backup",
                text    : _("Backup"),
                scope   : this,
                handler : Ext.Function.bind(me.onBackupButton, me, [ me ]),
                margin  : "5 0 0 0"
            },{
                border : false,
                html   : "<ul><li>" + _("Backup the operating system drive to a data drive for emergency restoration.") + "</li></ul>"
            }]
        },{
            xtype    : "fieldset",
            title    : _("Clonezilla"),
            defaults : {
                labelSeparator : ""
            },
            items : [{
                xtype   : "button",
                name    : "install",
                text    : _("Install"),
                scope   : this,
                handler : Ext.Function.bind(me.onInstallButton, me, [ me ]),
                margin  : "5 0 0 0"
            },{
                border : false,
                html   : "<ul>" +
                         "<li>" + _("Downloads Clonezilla ISO and configures grub bootloader to allow booting from ISO.") + "</li>" +
                         "<li>" + _("SSH server is enabled by default.  Login with username: <b>user</b> and password: <b>live</b>") + "</li>" +
                         "<li>" + _("IP Address will be set by DHCP.") + "</li>" +
                         "<li>" + _("When logging in remotely, start clonezilla with:  sudo clonezilla") + "</li>" +
                         "</ul>"
            },{
                xtype   : "button",
                name    : "rebootcz",
                text    : _("Clonezilla"),
                scope   : this,
                handler : Ext.Function.bind(me.onCzButton, me, [ me ]),
                margin  : "5 0 0 0"
            },{
                border : false,
                html   : "<ul><li>" + _("Sets grub bootloader to boot from Clonezilla ISO <b>ONE</b> time.") + "</li></ul>"
            },{
                xtype   : "button",
                name    : "rebootomv",
                text    : _("OMV"),
                scope   : this,
                handler : Ext.Function.bind(me.onOmvButton, me, [ me ]),
                margin  : "5 0 0 0"
            },{
                border : false,
                html   : "<ul><li>" + _("Sets grub bootloader to boot normally from OpenMediaVault.") + "</li></ul>"
            }]
        }];
    },

    onBackupButton: function() {
        var me = this;
        me.doSubmit();
        Ext.create("OMV.window.Execute", {
            title      : _("Backup"),
            rpcService : "Backup",
            rpcMethod  : "doBackup",
            listeners  : {
                scope     : me,
                exception : function(wnd, error) {
                    OMV.MessageBox.error(null, error);
                }
            }
        }).show();
    },

    onInstallButton: function() {
        var me = this;
        me.doSubmit();
        Ext.create("OMV.window.Execute", {
            title      : _("Install Clonezilla"),
            rpcService : "Backup",
            rpcMethod  : "doInstall",
            listeners  : {
                scope     : me,
                exception : function(wnd, error) {
                    OMV.MessageBox.error(null, error);
                }
            }
        }).show();
    },

    onCzButton: function() {
        var me = this;
        Ext.create("OMV.window.Execute", {
            title      : _("Reboot to Clonezilla"),
            rpcService : "Backup",
            rpcMethod  : "doRebootClonezilla",
            listeners  : {
                scope     : me,
                exception : function(wnd, error) {
                    OMV.MessageBox.error(null, error);
                }
            }
        }).show();
    },

    onOmvButton: function() {
        var me = this;
        Ext.create("OMV.window.Execute", {
            title      : _("Reboot to OpenMediaVault"),
            rpcService : "Backup",
            rpcMethod  : "doRebootOMV",
            listeners  : {
                scope     : me,
                exception : function(wnd, error) {
                    OMV.MessageBox.error(null, error);
                }
            }
        }).show();
    }

});

OMV.WorkspaceManager.registerPanel({
    id        : "systembackup",
    path      : "/system/backup",
    text      : _("System Backup"),
    position  : 10,
    className : "OMV.module.admin.system.backup.SystemBackup"
});
