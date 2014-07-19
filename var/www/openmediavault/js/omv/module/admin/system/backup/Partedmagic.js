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

Ext.define("OMV.module.admin.system.backup.Partedmagic", {
    extend : "OMV.workspace.form.Panel",
    uses   : [
        "OMV.data.Model",
        "OMV.data.Store"
    ],

    rpcService   : "Backup",
    rpcGetMethod : "getPartedmagic",
    rpcSetMethod : "setPartedmagic",

    hideOkButton : true,

    getFormItems : function() {
        var me = this;
        return [{
            xtype    : "fieldset",
            title    : _("Parted Magic"),
            defaults : {
                labelSeparator : ""
            },
            items : [{
                xtype      : "sharedfoldercombo",
                name       : "pmref",
                fieldLabel : _("Shared Folder"),
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("Parted Magic ISO file named partedmagic.iso should be located in this shared folder.")
                }]
            },{
                xtype   : "button",
                name    : "install",
                text    : _("Install"),
                scope   : this,
                handler : Ext.Function.bind(me.onInstallButton, me, [ me ]),
                margin  : "5 0 0 0"
            },{
                border : false,
                html   : "<ul>" +
                         "<li>" + _("Copies Parted Magic ISO file from shared folder selected above to /boot/") + "</li>" +
                         "<li>" + _("Configures grub bootloader to allow booting from Parted Magic ISO.") + "</li>" +
                         "<li>" + _("SSH server is enabled by default.  Login with username: <b>root</b> and password: <b>partedmagic</b>") + "</li>" +
                         "<li>" + _("When connecting via ssh, the ssh key will be different than the OpenMediaVault ssh key and need to be updated on the client system.") + "</li>" +
                         "<li>" + _("IP Address will be set by DHCP.  Using static DHCP is recommended for headless servers.") + "</li>" +
                         "</ul>"
            },{
                xtype   : "button",
                name    : "rebootpm",
                text    : _("Parted Magic"),
                scope   : this,
                handler : Ext.Function.bind(me.onPmButton, me, [ me ]),
                margin  : "5 0 0 0"
            },{
                border : false,
                html   : "<ul><li>" + _("Sets grub bootloader to boot from Parted Magic ISO <b>ONE</b> time.") + "</li></ul>"
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

    onInstallButton: function() {
        var me = this;
        me.doSubmit();
        var wnd = Ext.create("OMV.window.Execute", {
            title           : _("Install Parted Magic"),
            rpcService      : "Backup",
            rpcMethod       : "doInstallPartedmagic",
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
                }
            }
        });
        wnd.setButtonDisabled("close", true);
        wnd.show();
        wnd.start();
    },

    onPmButton: function() {
        var me = this;
        var wnd = Ext.create("OMV.window.Execute", {
            title           : _("Reboot to Parted Magic"),
            rpcService      : "Backup",
            rpcMethod       : "doRebootPartedmagic",
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
                }
            }
        });
        wnd.setButtonDisabled("close", true);
        wnd.show();
        wnd.start();
    },

    onOmvButton: function() {
        var me = this;
        var wnd = Ext.create("OMV.window.Execute", {
            title           : _("Reboot to OpenMediaVault"),
            rpcService      : "Backup",
            rpcMethod       : "doRebootOMV",
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
                }
            }
        });
        wnd.setButtonDisabled("close", true);
        wnd.show();
        wnd.start();
    }
});

OMV.WorkspaceManager.registerPanel({
    id        : "partedmagic",
    path      : "/system/backup",
    text      : _("Parted Magic"),
    position  : 40,
    className : "OMV.module.admin.system.backup.Partedmagic"
});
