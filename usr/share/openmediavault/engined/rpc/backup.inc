<?php
/**
 * Copyright (C) 2013-2014 OpenMediaVault Plugin Developers
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
require_once "openmediavault/config.inc";
require_once "openmediavault/error.inc";
require_once "openmediavault/notify.inc";
require_once "openmediavault/object.inc";
require_once "openmediavault/rpcservice.inc";
require_once "openmediavault/system.inc";
require_once "openmediavault/util.inc";

class OMVRpcServiceBackup extends OMVRpcServiceAbstract
{
    public function getName()
    {
        return 'Backup';
    }

    private function getPluginName()
    {
        return strtolower( $this->getName() );
    }

    private function getXPath()
    {
        $path = sprintf( "//system/%s", $this->getPluginName() );
        return $path;
    }

    private function getXPathPhotorec()
    {
        $path = sprintf( "%s/photorec", $this->getXPath() );
        return $path;
    }

    private function getXPathPartedmagic()
    {
        $path = sprintf( "%s/partedmagic", $this->getXPath() );
        return $path;
    }

    private function getEventMessagePath()
    {
        $path = sprintf( "org.openmediavault.system.%s", $this->getPluginName() );
        return $path;
    }

    private function getEventMessagePathPhotorec()
    {
        $path = sprintf( "%s.photorec", $this->getEventMessagePath() );
        return $path;
    }

    public function initialize()
    {
        $this->registerMethod('getSettings');
        $this->registerMethod('setSettings');
        $this->registerMethod('doBackup');

        $this->registerMethod('doInstall');
        $this->registerMethod('doRebootClonezilla');

        $this->registerMethod('doInstallSysresccd');
        $this->registerMethod('doRebootSysresccd');

        $this->registerMethod('getPartedmagic');
        $this->registerMethod('setPartedmagic');
        $this->registerMethod('doInstallPartedmagic');
        $this->registerMethod('doRebootPartedmagic');

        $this->registerMethod('doRebootOMV');

        $this->registerMethod('getCandidates');
        $this->registerMethod('getPhotorec');
        $this->registerMethod('setPhotorec');
        $this->registerMethod('getDrives');
        $this->registerMethod('doRecover');
        $this->registerMethod('doSilent');
    }

    public function getSettings($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        // Get configuration object
        $object = $xmlConfig->get( $this->getXPath() );
        if (is_null($object))
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $this->getXPath() );

        // Remove useless fields from the result object.
        unset($object['photorec']);
        unset($object['partedmagic']);

        return $object;
    }

    public function setSettings($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        // Validate the parameters of the RPC service method.
        $this->validateMethodParams($params, '{
            "type"       : "object",
            "properties" : {
                "mntentref" : { "type" : "string" },
                "path"      : { "type" : "string" }
            }
        }');

        $xpath = sprintf("//system/fstab/mntent[uuid='%s']", $params['mntentref']);
        $deviceDir = $xmlConfig->get($xpath);
        $deviceDir = $deviceDir['dir'];

        $backupPath = "{$deviceDir}/omvbackup";
        $params['path'] = $backupPath;

        // Get the existing configuration object.
        $oldObject = $xmlConfig->get( $this->getXPath() );
        if(is_null($oldObject)) {
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $this->getXPath() );
        }

        // Prepare configuration data
        $object = array(
            "mntentref" => $params['mntentref'],
            "path"      => $params['path'],
            "photorec"  => isset($oldObject['photorec']) ? $oldObject['photorec'] : array(),
            "partedmagic"  => isset($oldObject['partedmagic']) ? $oldObject['partedmagic'] : array()
        );

        // Set configuration object
        if (false === $xmlConfig->replace($this->getXPath(), $object))
            throw new OMVException(OMVErrorMsg::E_CONFIG_SET_OBJECT_FAILED, $this->getXPath() );

        // Notify configuration changes
        $dispatcher = &OMVNotifyDispatcher::getInstance();
        $dispatcher->notify(OMV_NOTIFY_MODIFY, $this->getEventMessagePath(), $object);
    }

    public function doBackup($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        // Create a background process.
        $bgStatusFilename = $this->createBgProcStatus();
        $pid = $this->fork();
        if($pid > 0) { // Parent process.
            $this->initializeBgProcStatus($bgStatusFilename, $pid);
            return $bgStatusFilename;
        }

        // Child process.
        try {
            $bgOutputFilename = $this->createBgProcOutput();
            $this->updateBgProcStatus($bgStatusFilename, "outputfilename", $bgOutputFilename);

            $cmd = sprintf("sudo omv-mkconf %s backup 2>&1", $this->getPluginName() );
            $this->exec($cmd, $output, $bgOutputFilename);
            $this->finalizeBgProcStatus($bgStatusFilename, $output);
            exit(0);
        } catch(Exception $e) {
            $this->finalizeBgProcStatus($bgStatusFilename, "", $e);
            exit(1);
        }
    }

    public function doInstall($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        // Create a background process.
        $bgStatusFilename = $this->createBgProcStatus();
        $pid = $this->fork();
        if($pid > 0) { // Parent process.
            $this->initializeBgProcStatus($bgStatusFilename, $pid);
            return $bgStatusFilename;
        }

        // Child process.
        try {
            $bgOutputFilename = $this->createBgProcOutput();
            $this->updateBgProcStatus($bgStatusFilename, "outputfilename", $bgOutputFilename);

            $cmd = sprintf("sudo omv-mkconf %s install 2>&1", $this->getPluginName() );
            $this->exec($cmd, $output, $bgOutputFilename);
            $this->finalizeBgProcStatus($bgStatusFilename, $output);
            exit(0);
        } catch(Exception $e) {
            $this->finalizeBgProcStatus($bgStatusFilename, "", $e);
            exit(1);
        }
    }

    public function doRebootClonezilla($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        // Create a background process.
        $bgStatusFilename = $this->createBgProcStatus();
        $pid = $this->fork();
        if($pid > 0) { // Parent process.
            $this->initializeBgProcStatus($bgStatusFilename, $pid);
            return $bgStatusFilename;
        }

        // Child process.
        try {
            $bgOutputFilename = $this->createBgProcOutput();
            $this->updateBgProcStatus($bgStatusFilename, "outputfilename", $bgOutputFilename);

            $cmd = sprintf("sudo omv-mkconf %s clonezilla 2>&1", $this->getPluginName() );
            $this->exec($cmd, $output, $bgOutputFilename);
            $this->finalizeBgProcStatus($bgStatusFilename, $output);
            exit(0);
        } catch(Exception $e) {
            $this->finalizeBgProcStatus($bgStatusFilename, "", $e);
            exit(1);
        }
    }

    public function doInstallSysresccd($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        // Create a background process.
        $bgStatusFilename = $this->createBgProcStatus();
        $pid = $this->fork();
        if($pid > 0) { // Parent process.
            $this->initializeBgProcStatus($bgStatusFilename, $pid);
            return $bgStatusFilename;
        }

        // Child process.
        try {
            $bgOutputFilename = $this->createBgProcOutput();
            $this->updateBgProcStatus($bgStatusFilename, "outputfilename", $bgOutputFilename);

            $cmd = sprintf("sudo omv-mkconf %s installsys 2>&1", $this->getPluginName() );
            $this->exec($cmd, $output, $bgOutputFilename);
            $this->finalizeBgProcStatus($bgStatusFilename, $output);
            exit(0);
        } catch(Exception $e) {
            $this->finalizeBgProcStatus($bgStatusFilename, "", $e);
            exit(1);
        }
    }

    public function doRebootSysresccd($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        // Create a background process.
        $bgStatusFilename = $this->createBgProcStatus();
        $pid = $this->fork();
        if($pid > 0) { // Parent process.
            $this->initializeBgProcStatus($bgStatusFilename, $pid);
            return $bgStatusFilename;
        }

        // Child process.
        try {
            $bgOutputFilename = $this->createBgProcOutput();
            $this->updateBgProcStatus($bgStatusFilename, "outputfilename", $bgOutputFilename);

            $cmd = sprintf("sudo omv-mkconf %s sysresccd 2>&1", $this->getPluginName() );
            $this->exec($cmd, $output, $bgOutputFilename);
            $this->finalizeBgProcStatus($bgStatusFilename, $output);
            exit(0);
        } catch(Exception $e) {
            $this->finalizeBgProcStatus($bgStatusFilename, "", $e);
            exit(1);
        }
    }

    public function getPartedmagic($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext(
            $context,
            array( "role" => OMV_ROLE_ADMINISTRATOR )
        );

        // Get configuration object
        $object = $xmlConfig->get( $this->getXPathPartedmagic() );
        if (is_null($object))
        {
            throw new OMVException(
                OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED,
                $this->getXPathPartedmagic()
            );
        }

        return $object;
    }

    public function setPartedmagic($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext(
            $context,
            array( "role" => OMV_ROLE_ADMINISTRATOR )
        );

        // Validate the parameters of the RPC service method.
        $this->validateMethodParams($params, '{
            "type"       : "object",
            "properties" : {
                "pmref" : { "type" : "string" }
            }
        }');

        // Prepare configuration data
        $object = array(
            "pmref" => $params['pmref']
        );

        // Set configuration object
        if (false === $xmlConfig->replace($this->getXPathPartedmagic(), $object))
            throw new OMVException(
                OMVErrorMsg::E_CONFIG_SET_OBJECT_FAILED,
                $this->getXPathPartedmagic()
            );
    }

    public function doInstallPartedmagic($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        // Create a background process.
        $bgStatusFilename = $this->createBgProcStatus();
        $pid = $this->fork();
        if($pid > 0) { // Parent process.
            $this->initializeBgProcStatus($bgStatusFilename, $pid);
            return $bgStatusFilename;
        }

        // Child process.
        try {
            $bgOutputFilename = $this->createBgProcOutput();
            $this->updateBgProcStatus($bgStatusFilename, "outputfilename", $bgOutputFilename);

            $cmd = sprintf("sudo omv-mkconf %s installpm 2>&1", $this->getPluginName() );
            $this->exec($cmd, $output, $bgOutputFilename);
            $this->finalizeBgProcStatus($bgStatusFilename, $output);
            exit(0);
        } catch(Exception $e) {
            $this->finalizeBgProcStatus($bgStatusFilename, "", $e);
            exit(1);
        }
    }

    public function doRebootPartedmagic($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        // Create a background process.
        $bgStatusFilename = $this->createBgProcStatus();
        $pid = $this->fork();
        if($pid > 0) { // Parent process.
            $this->initializeBgProcStatus($bgStatusFilename, $pid);
            return $bgStatusFilename;
        }

        // Child process.
        try {
            $bgOutputFilename = $this->createBgProcOutput();
            $this->updateBgProcStatus($bgStatusFilename, "outputfilename", $bgOutputFilename);

            $cmd = sprintf("sudo omv-mkconf %s partedmagic 2>&1", $this->getPluginName() );
            $this->exec($cmd, $output, $bgOutputFilename);
            $this->finalizeBgProcStatus($bgStatusFilename, $output);
            exit(0);
        } catch(Exception $e) {
            $this->finalizeBgProcStatus($bgStatusFilename, "", $e);
            exit(1);
        }
    }


    public function doRebootOMV($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        // Create a background process.
        $bgStatusFilename = $this->createBgProcStatus();
        $pid = $this->fork();
        if($pid > 0) { // Parent process.
            $this->initializeBgProcStatus($bgStatusFilename, $pid);
            return $bgStatusFilename;
        }

        // Child process.
        try {
            $bgOutputFilename = $this->createBgProcOutput();
            $this->updateBgProcStatus($bgStatusFilename, "outputfilename", $bgOutputFilename);

            $cmd = sprintf("sudo omv-mkconf %s omv 2>&1", $this->getPluginName() );
            $this->exec($cmd, $output, $bgOutputFilename);
            $this->finalizeBgProcStatus($bgStatusFilename, $output);
            exit(0);
        } catch(Exception $e) {
            $this->finalizeBgProcStatus($bgStatusFilename, "", $e);
            exit(1);
        }
    }

    public function getCandidates($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        // Get a list of mount points, except bind mounts.
        $xpath = "//system/fstab/mntent[not(contains(opts,'bind'))]";
        $objects = $xmlConfig->getList($xpath);
        if(is_null($objects)) {
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);
        }

        // Get the filesystem details for each mount point.
        $result = array();
        foreach($objects as $objectk => $objectv) {
            $fs = new OMVFilesystem($objectv['fsname']);
            if(!$fs->exists())
                continue;

            // Skip the filesystems that are not mounted at the moment.
            if(FALSE === $fs->isMounted())
                continue;

            // Get some filesystem details.
            $devicefile = $fs->getDeviceFile();
            $label = $fs->getLabel();

            // Prepare result object.
            $object = array(
                "uuid"        => $objectv['uuid'],
                "devicefile"  => $devicefile,
                "description" => !empty($label) ? $label : $devicefile
            );

            // Get some more filesystem details if possible.
            if(FALSE !== ($fsStats = $fs->getStatistics())) {
                $object['description'] = sprintf(
                    gettext("%s (%s available)"), $object['description'],
                    binary_format($fsStats['available']));
            }

            $result[] = $object;
        }

        return $result;
    }

    public function getPhotorec($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        // Get configuration object
        $object = $xmlConfig->get( $this->getXPathPhotorec() );
        if (is_null($object))
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $this->getXPathPhotorec() );

        // Modify the result object.
        $options = array("freespace", "everything", "bmp", "bz2", "doc", "gz", "mkv", "mov",
            "mp3", "mpg", "pdf", "png", "raw", "tif", "tx", "txt", "zip");

        foreach ($options as $value) {
            $object[$value] = array_boolval($object, $value);
        }

        return $object;
    }

    public function setPhotorec($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        // Validate the parameters of the RPC service method.
        $this->validateMethodParams($params, '{
            "type"       : "object",
            "properties" : {
                "source"      : { "type" : "string" },
                "destination" : { "type" : "string" },
                "freespace"   : { "type" : "boolean" },
                "everything"  : { "type" : "boolean" },
                "bmp"         : { "type" : "boolean", "optional" : true },
                "bz2"         : { "type" : "boolean", "optional" : true },
                "doc"         : { "type" : "boolean", "optional" : true },
                "gz"          : { "type" : "boolean", "optional" : true },
                "mkv"         : { "type" : "boolean", "optional" : true },
                "mov"         : { "type" : "boolean", "optional" : true },
                "mp3"         : { "type" : "boolean", "optional" : true },
                "mpg"         : { "type" : "boolean", "optional" : true },
                "pdf"         : { "type" : "boolean", "optional" : true },
                "png"         : { "type" : "boolean", "optional" : true },
                "raw"         : { "type" : "boolean", "optional" : true },
                "tif"         : { "type" : "boolean", "optional" : true },
                "tx"          : { "type" : "boolean", "optional" : true },
                "txt"         : { "type" : "boolean", "optional" : true },
                "zip"         : { "type" : "boolean", "optional" : true }
            }
        }');

        // Check to see if shared folder is on source drive.
        // Get shared folder configuration object.
        $xpath = sprintf("//system/shares/sharedfolder[uuid='%s']", $params['destination']);
        $sfObject = $xmlConfig->get($xpath);
        if(is_null($sfObject))
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

        // Get the mount point configuration object to build the absolute shared folder path.
        $xpath = sprintf("//system/fstab/mntent[uuid='%s']", $sfObject['mntentref']);
        $meObject = $xmlConfig->get($xpath);
        if(is_null($meObject))
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

        $cmd = "mount | grep {$params['source']} | grep {$meObject['dir']}";
        $this->exec($cmd, $output);
        if ( count($output) > 0 ) {
            throw new OMVException(OMVErrorMsg::E_CONFIG_OBJECT_UNIQUENESS,
                gettext("Shared folder cannot be located on the source drive - {$params['source']}."));
        }

        // Get the existing configuration object.
        $oldObject = $xmlConfig->get( $this->getXPathPhotorec() );
        if(is_null($oldObject)) {
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);
        }

        // Prepare configuration data
        $object = array(
            "source"      => $params['source'],
            "destination" => $params['destination'],
            "freespace"   => array_boolval($params, 'freespace'),
            "everything"  => array_boolval($params, 'everything'),
            "bmp"         => array_boolval($params, 'bmp'),
            "bz2"         => array_boolval($params, 'bz2'),
            "doc"         => array_boolval($params, 'doc'),
            "gz"          => array_boolval($params, 'gz'),
            "mkv"         => array_boolval($params, 'mkv'),
            "mov"         => array_boolval($params, 'mov'),
            "mp3"         => array_boolval($params, 'mp3'),
            "mpg"         => array_boolval($params, 'mpg'),
            "pdf"         => array_boolval($params, 'pdf'),
            "png"         => array_boolval($params, 'png'),
            "raw"         => array_boolval($params, 'raw'),
            "tif"         => array_boolval($params, 'tif'),
            "tx"          => array_boolval($params, 'tx'),
            "txt"         => array_boolval($params, 'txt'),
            "zip"         => array_boolval($params, 'zip')
        );

        // Set configuration object
        if (false === $xmlConfig->replace($this->getXPathPhotorec(), $object))
        {
            throw new OMVException(
                OMVErrorMsg::E_CONFIG_SET_OBJECT_FAILED,
                $this->getXPathPhotorec()
            );
        }

        // Notify configuration changes
        $dispatcher = &OMVNotifyDispatcher::getInstance();
        $dispatcher->notify(OMV_NOTIFY_MODIFY, $this->getEventMessagePathPhotorec(), $object);
    }

    public function getDrives($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        if ($params['ext'] == 1)
            $cmd = "blkid -o list | grep ext[3-4]";
        else
            $cmd = 'lsblk -dno name,size 2>&1';

        OMVUtil::exec($cmd, $output, $result);

        if ($result !== 0)
            return false;

        $drives = array();
        foreach($output as $row) {
            $info = preg_split('/\s+/', $row);
            $object = array(
                "drive"   => sprintf("/dev/%s", $info[0]),
                "display" => sprintf("/dev/%s - %s", $info[0], $info[1])
            );

            $drives[] = $object;
        }

        return $drives;
    }

    public function doRecover($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        // Get the configuration object.
        $object = $xmlConfig->get( $this->getXPathPhotorec() );
        if(is_null($object)) {
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $this->getXPathPhotorec() );
        }

        $options = array("bmp", "bz2", "doc", "gz", "mkv", "mov", "mp3", "mpg",
            "pdf", "png", "raw", "tif", "tx", "txt", "zip");

        // Get options
        if ( boolval($object['everything']) ) {
            $cmd2 = "everything,enable";
        } else {
            $cmd2 = "everything,disable";

            foreach ($options as $value) {
                if ( boolval($object[$value]) )  $cmd2 .= ",{$value},enable";
            }
        }
        if ( boolval($object['freespace']) )
            $cmd2 .= ",freespace";

        // Get paths
        $sourcePath = $object['source'];
        $destPath = OMVRpc::exec("ShareMgmt", "getPath", array("uuid" => $object['destination']), $context);

        // Create a background process.
        $bgStatusFilename = $this->createBgProcStatus();
        $pid = $this->fork();
        if($pid > 0) { // Parent process.
            $this->initializeBgProcStatus($bgStatusFilename, $pid);
            return $bgStatusFilename;
        }

        // Child process.
        try {
            $bgOutputFilename = $this->createBgProcOutput();
            $this->updateBgProcStatus($bgStatusFilename, "outputfilename", $bgOutputFilename);

            $cmd = "/usr/bin/photorec /log /logname \"{$destPath}photorec.log\" /d {$destPath} /cmd {$sourcePath} fileopt,{$cmd2},search 2>&1";

            $this->exec($cmd, $output, $bgOutputFilename);
            $this->finalizeBgProcStatus($bgStatusFilename, $output);
            exit(0);
        } catch(Exception $e) {
            $this->finalizeBgProcStatus($bgStatusFilename, "", $e);
            exit(1);
        }
    }

    function doSilent($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        // Get the configuration object.
        $xpath = "//system/backup/photorec";
        $object = $xmlConfig->get( $this->getXPathPhotorec() );
        if(is_null($object)) {
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $this->getXPathPhotorec() );
        }

        $options = array("bmp", "bz2", "doc", "gz", "mkv", "mov", "mp3", "mpg",
            "pdf", "png", "raw", "tif", "tx", "txt", "zip");

        // Get options
        if ( boolval($object['everything']) ) {
            $cmd2 = "everything,enable";
        } else {
            $cmd2 = "everything,disable";

            foreach ($options as $value) {
                if ( boolval($object[$value]) )  $cmd2 .= ",{$value},enable";
            }
        }
        if ( boolval($object['freespace']) )
            $cmd2 .= ",freespace";

        // Get paths
        $sourcePath = $object['source'];
        $destPath = OMVRpc::exec("ShareMgmt", "getPath", array("uuid" => $object['destination']), $context);

        $cmd = "/usr/bin/photorec /log /logname \"{$destPath}photorec.log\" /d {$destPath} /cmd {$sourcePath} fileopt,{$cmd2},search 2>&1";

        if(0 !== $this->exec($cmd, $output)) {
            throw new OMVException(OMVErrorMsg::E_EXEC_FAILED, $cmd, implode("\n", $output));
        }
    }
}

// Register the RPC service.
$rpcServiceMgr = &OMVRpcServiceMgr::getInstance();
$rpcServiceMgr->registerService(new OMVRpcServiceBackup());
