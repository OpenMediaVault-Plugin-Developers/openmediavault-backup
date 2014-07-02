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

Ext.define("OMV.module.admin.system.backup.Sysresccd", {
    extend : "OMV.workspace.form.Panel",
    uses   : [
        "OMV.data.Model",
        "OMV.data.Store"
    ],

    autoLoadData    : false,
    hideOkButton    : true,
    hideResetButton : true,
    mode            : "local",

    getFormItems : function() {
        var me = this;
        return [{
            xtype    : "fieldset",
            title    : _("SystemRescueCD"),
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
                         "<li>" + _("Downloads SystemRescuecd ISO and configures grub bootloader to allow booting from ISO.") + "</li>" +
                         "<li>" + _("SSH server is enabled by default.  Login with username: <b>root</b> and password: <b>openmediavault</b>") + "</li>" +
                         "<li>" + _("IP Address will be set by DHCP.  Using static DHCP is recommended for headless servers.") + "</li>" +
                         "<li>" + _("ISO uses approximately 381 Mb in /boot directory on OS drive.") + "</li>" +
                         "</ul>"
            },{
                xtype   : "button",
                name    : "rebootsrc",
                text    : _("SystemRescueCD"),
                scope   : this,
                handler : Ext.Function.bind(me.onSrcButton, me, [ me ]),
                margin  : "5 0 0 0"
            },{
                border : false,
                html   : "<ul><li>" + _("Sets grub bootloader to boot from SystemRescueCD ISO <b>ONE</b> time.") + "</li></ul>"
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
        var wnd = Ext.create("OMV.window.Execute", {
            title           : _("Install SystemRescueCD"),
            rpcService      : "Backup",
            rpcMethod       : "doInstallSysresccd",
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

    onSrcButton: function() {
        var me = this;
        var wnd = Ext.create("OMV.window.Execute", {
            title           : _("Reboot to SystemRescueCD"),
            rpcService      : "Backup",
            rpcMethod       : "doRebootSysresccd",
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
    id        : "sysresccd",
    path      : "/system/backup",
    text      : _("SystemRescueCD"),
    position  : 30,
    className : "OMV.module.admin.system.backup.Sysresccd"
});
