/**
 * Copyright (C) 2013-2020 OpenMediaVault Plugin Developers
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
// require("js/omv/form/plugin/LinkedFields.js")
// require("js/omv/form/field/SharedFolderComboBox.js")
// require("js/omv/module/admin/system/cron/Cron.js")

Ext.define('OMV.module.admin.system.backup.ScheduledBackup', {
    extend: 'OMV.module.admin.system.cron.Job',

    title: _('Create scheduled backup job'),
    height: 310,
    hideResetButton: true,

    initComponent: function() {
        this.callParent(arguments);

        var enable = this.findField('enable');
        var execution = this.findField('execution');
        var username = this.findField('username');
        var command = this.findField('command');
        var comment = this.findField('comment');

        enable.hide();
        username.hide();
        command.hide();
        comment.hide();

        enable.setValue(true);
        execution.setValue('daily');
        username.setValue('root');
        command.setValue('/usr/sbin/omv-backup');
        comment.setValue('Scheduled system backup.');
    }
});

Ext.define('OMV.module.admin.system.backup.SystemBackup', {
    extend: 'OMV.workspace.form.Panel',
    uses: [
        'OMV.module.admin.system.backup.ScheduledBackup'
    ],

    plugins: [{
        ptype: 'linkedfields',
        correlations: [{
            conditions: [{
                name: 'method',
                value: ['dd','ddfull']
            }],
            name: ['extraoptions'],
            properties: ['!show', '!submitValue']
        },{
            conditions: [{
                name: 'method',
                value: 'rsync'
            }],
            name: ['keep'],
            properties: ['!show', '!submitValue']
        },{
            conditions: [{
                name: 'method',
                value: ['fsarchiver','borg']
            }],
            name: ['passwd'],
            properties: ['show', 'submitValue']
        }]
    }],

    rpcService: 'Backup',
    rpcGetMethod: 'get',
    rpcSetMethod: 'set',

    getButtonItems: function() {
        var me = this;
        var items = me.callParent(arguments);
        items.push({
            id: me.getId() + "-backup",
            xtype: "button",
            text: _("Backup"),
            icon: "images/hdd.png",
            iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
            scope: me,
            handler: Ext.Function.bind(me.onBackupButton, me, [ me ])
        },{
            id: this.getId() + '-scheduled-backup',
            xtype: 'button',
            text: _('Add new scheduled backup job'),
            icon: 'images/wrench.png',
            iconCls: Ext.baseCSSPrefix + 'btn-icon-16x16',
            scope: this,
            handler: Ext.Function.bind(this.onScheduledBackupButton, this)
        });
        return items;
    },

    getFormItems: function() {
        var me = this;
        return [{
            xtype: 'fieldset',
            title: _('Settings'),
            defaults: {
                labelSeparator: ''
            },
            items: [{
                xtype: 'sharedfoldercombo',
                name: 'sharedfolderref',
                fieldLabel: _('Shared Folder'),
                allowNone: true,
                allowBlank: true
            },{
                xtype: 'combo',
                name: 'method',
                fieldLabel: _('Method'),
                queryMode: 'local',
                store: [
                    [ 'dd', _('dd') ],
                    [ 'ddfull', _('dd full disk') ],
                    [ 'fsarchiver', _('fsarchiver') ],
                    [ 'borg', _('borgbackup') ],
                    [ 'rsync', _('rsync') ]
                ],
                editable: false,
                triggerAction: 'all',
                value: 'fsarchiver',
                plugins: [{
                    ptype: 'fieldinfo',
                    text: _('dd - use dd to clone the OS partition to a compressed image file.') +
                            '<br />' +
                          _('dd full disk - use dd to clone the entire drive to a compressed image file.') +
                            '<br />' +
                          _('fsarchiver - use fsarchiver to clone all partitions to an archive file') +
                            '<br />' +
                          _('borgbackup - use borgbackup to backup system to an archive file') +
                            '<br />' +
                          _('rsync - use rsync to sync files to destination directory')
                }]
            },{
                xtype: 'textfield',
                name: 'root',
                fieldLabel: _('Root device'),
                allowBlank: true,
                plugins: [{
                    ptype: 'fieldinfo',
                    text: _('For advanced users only - Do not use unless exact root device is known.')
                }]
            },{
                xtype: 'textfield',
                name: 'extraoptions',
                fieldLabel: _('Extra Options'),
                allowBlank: true,
                plugins: [{
                    ptype: 'fieldinfo',
                    text: _('To exclude addition directories, add --exclude= before each directory and separate additional entries with a space.') +
                            '<br />' +
                          _('Example') + ':  --exclude=/pool --exclude=/test' +
                            '<br />' +
                          _('Warning!!  You can break the backup with wrong options.')
                }]
            },{
                xtype: 'numberfield',
                name: 'keep',
                fieldLabel: _('Keep'),
                minValue: 0,
                maxValue: 9999,
                allowDecimals: false,
                allowNegative: false,
                allowBlank: false,
                value: 7,
                plugins: [{
                    ptype: 'fieldinfo',
                    text: _('Keep the last x days of backups. Set to zero to disable.')
                }]
            },{
                xtype: 'passwordfield',
                name: 'passwd',
                fieldLabel: _('Password'),
                maxLength: 64,
                allowBlank: true,
                maskRe: /[^\ ]/,
                plugins: [{
                    ptype: 'fieldinfo',
                    text: _('If a password is specified, backup will be encrypted. Must be between 6 and 64 characters.')
                }]
            }]
        },{
            xtype: "fieldset",
            title: _("Notes"),
            fieldDefaults: {
                labelSeparator: ""
            },
            items: [{
                border: false,
                html: "<ul>" +
                  "<li>" + _("Adding a new scheduled backup job will add a job to the Scheduled Jobs tab.") + "</li>" +
                  "</ul>"
            }]
        }];
    },

    onBackupButton: function() {
        var me = this;
        me.doSubmit();
        Ext.create('OMV.window.Execute', {
            title: _('Backup'),
            rpcService: 'Backup',
            rpcMethod: 'doBackup',
            listeners: {
                scope: me,
                exception: function(wnd, error) {
                    OMV.MessageBox.error(null, error);
                }
            }
        }).show();
    },

    onScheduledBackupButton: function() {
        var me = this;
        me.doSubmit();
        Ext.create('OMV.module.admin.system.backup.ScheduledBackup', {
            uuid: OMV.UUID_UNDEFINED
        }).show();
    },
});

OMV.WorkspaceManager.registerPanel({
    id: 'systembackup',
    path: '/system/backup',
    text: _('System Backup'),
    position: 10,
    className: 'OMV.module.admin.system.backup.SystemBackup'
});
