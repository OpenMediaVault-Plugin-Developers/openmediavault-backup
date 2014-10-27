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

Ext.define("OMV.module.admin.system.backup.Gpartedlive", {
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
            title    : _("GParted Live"),
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
                         "<li>" + _("Downloads GParted Live ISO and configures grub bootloader to allow booting from ISO.") + "</li>" +
                         "<li>" + _("Not recommended for headless servers.  SSH is not enabled by default.") + "</li>" +
                         "<li>" + _("Default username: <b>user</b> and password: <b>live</b>") + "</li>" +
                         "<li>" + _("IP Address will be set by DHCP.") + "</li>" +
                         "<li>" + _("ISO uses approximately 219 Mb in /boot directory on OS drive.") + "</li>" +
                         "</ul>"
            },{
                xtype   : "button",
                name    : "rebootgp",
                text    : _("GParted Live"),
                scope   : this,
                handler : Ext.Function.bind(me.onGpButton, me, [ me ]),
                margin  : "5 0 0 0"
            },{
                border : false,
                html   : "<ul><li>" + _("Sets grub bootloader to boot from GParted Live ISO <b>ONE</b> time.") + "</li></ul>"
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
            title           : _("Install GParted Live"),
            rpcService      : "Backup",
            rpcMethod       : "doInstallISO",
            rpcParams       : {
                command : "gp"
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
                }
            }
        });
        wnd.setButtonDisabled("close", true);
        wnd.show();
        wnd.start();
    },

    onGpButton: function() {
        var me = this;
        var wnd = Ext.create("OMV.window.Execute", {
            title           : _("Reboot to GParted Live"),
            rpcService      : "Backup",
            rpcMethod       : "doRebootISO",
            rpcParams       : {
                command : "gpartedlive"
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
    id        : "gpartedlive",
    path      : "/system/backup",
    text      : _("GParted Live"),
    position  : 30,
    className : "OMV.module.admin.system.backup.Gpartedlive"
});
