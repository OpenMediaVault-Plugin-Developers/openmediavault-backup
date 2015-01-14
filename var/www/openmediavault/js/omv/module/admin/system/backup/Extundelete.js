/**
 * Copyright (C) 2013-2015 OpenMediaVault Plugin Developers
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

Ext.define("OMV.module.admin.system.backup.Extundelete", {
    extend : "OMV.workspace.form.Panel",
    uses   : [
        "OMV.data.Model",
        "OMV.data.Store"
    ],

    rpcService   : "Backup",
    rpcGetMethod : "getExtundelete",
    rpcSetMethod : "setExtundelete",

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
                                extonly : true
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
                    text  : _("Drive with missing or lost files. Must be ext3 or ext4 and unmounted.")
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
                html   : "<ul><li>" + _("This will attempt recovery of lost files from a damaged drive or accidentally deleted using Extundelete.") + "</li>" +
                         "<li>" + _("For more information, see Extundelete page") + " - <a href='http://extundelete.sourceforge.net/' target=_blank>" + _("link") + "</a></li></ul>"
            }]
        }];
    },

    onRecoverButton: function() {
        var me = this;
        me.doSubmit();
        Ext.create("OMV.window.Execute", {
            title      : _("Recover using Extundelete"),
            rpcService : "Backup",
            rpcMethod  : "doRecoverExt",
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
                method   : "doSilentExt"
            }
        });
    }

});

OMV.WorkspaceManager.registerPanel({
    id        : "extundelete",
    path      : "/system/backup",
    text      : _("Extundelete"),
    position  : 70,
    className : "OMV.module.admin.system.backup.Extundelete"
});
