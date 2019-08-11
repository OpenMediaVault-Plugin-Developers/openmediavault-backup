<?php
/**
 * Copyright (C) 2013-2019 OpenMediaVault Plugin Developers
 * Copyright (C) 2009-2013 Volker Theile <volker.theile@openmediavault.org>
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
require_once('openmediavault/functions.inc');

class OMVRpcServiceBackup extends \OMV\Rpc\ServiceAbstract
{
    public function getName()
    {
        return 'Backup';
    }

    public function initialize()
    {
        $this->registerMethod('get');
        $this->registerMethod('set');
        $this->registerMethod('doBackup');
    }

    public function get($params, $context)
    {
        // Validate the RPC caller context.
        $this->validateMethodContext($context, ['role' => OMV_ROLE_ADMINISTRATOR]);
        // Get the configuration object.
        $db = \OMV\Config\Database::getInstance();
        $object = $db->get('conf.system.backup');
        return $object->getAssoc();
    }

    public function set($params, $context)
    {
        // Validate the RPC caller context.
        $this->validateMethodContext($context, ['role' => OMV_ROLE_ADMINISTRATOR]);
        // Validate the parameters of the RPC service method.
        $this->validateMethodParams($params, 'rpc.backup.set');
        // Get the existing configuration object.
        $db = \OMV\Config\Database::getInstance();
        $object = $db->get('conf.system.backup');
        $object->setAssoc($params);
        $db->set($object);
        // Return the configuration object.
        return $object->getAssoc();
    }

    public function doBackup($params, $context)
    {
        // Validate the RPC caller context.
        $this->validateMethodContext($context, ['role' => OMV_ROLE_ADMINISTRATOR]);

        // Create the background process.
        return $this->execBgProc(function($bgStatusFilename, $bgOutputFilename)
            use ($params) {
                $cmd = new \OMV\System\Process('/usr/sbin/omv-backup');
                $cmd->setRedirect2to1(true);
                $cmdLine = $cmd->getCommandLine();
                if (0 !== $this->exec($cmdLine, $output, $bgOutputFilename))
                    throw new \OMV\ExecException($cmdLine, $output);
                return $output;
            }
        );
    }
}
