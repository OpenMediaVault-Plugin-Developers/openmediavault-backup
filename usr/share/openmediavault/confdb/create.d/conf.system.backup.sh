#!/bin/sh
#
# @license   http://www.gnu.org/licenses/gpl.html GPL Version 3
# @author    Volker Theile <volker.theile@openmediavault.org>
# @author    OpenMediaVault Plugin Developers <plugins@omv-extras.org>
# @copyright Copyright (c) 2009-2013 Volker Theile
# @copyright Copyright (c) 2013-2022 OpenMediaVault Plugin Developers
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.

set -e

. /usr/share/openmediavault/scripts/helper-functions

SERVICE_XPATH_NAME="backup"
SERVICE_XPATH="/config/system/${SERVICE_XPATH_NAME}"

if ! omv_config_exists "${SERVICE_XPATH}"; then
    omv_config_add_node "/config/system" "${SERVICE_XPATH_NAME}"
    omv_config_add_key "${SERVICE_XPATH}" "sharedfolderref" ""
    omv_config_add_key "${SERVICE_XPATH}" "method" "dd"
    omv_config_add_key "${SERVICE_XPATH}" "root" ""
    omv_config_add_key "${SERVICE_XPATH}" "extraoptions" ""
    omv_config_add_key "${SERVICE_XPATH}" "keep" "7"
    omv_config_add_key "${SERVICE_XPATH}" "passwd" ""
fi

if ! omv_config_exists "//system/crontab/job[uuid='32664b22-5a9d-11ec-8834-6f00f75b23ee']"; then
    object="<uuid>32664b22-5a9d-11ec-8834-6f00f75b23ee</uuid>"
    object="${object}<enable>0</enable>"
    object="${object}<execution>exactly</execution>"
    object="${object}<sendemail>0</sendemail>"
    object="${object}<comment></comment>"
    object="${object}<type>userdefined</type>"
    object="${object}<minute>30</minute>"
    object="${object}<everynminute>0</everynminute>"
    object="${object}<hour>1</hour>"
    object="${object}<everynhour>0</everynhour>"
    object="${object}<month>*</month>"
    object="${object}<dayofmonth>*</dayofmonth>"
    object="${object}<everyndayofmonth>0</everyndayofmonth>"
    object="${object}<dayofweek>7</dayofweek>"
    object="${object}<username>root</username>"
    object="${object}<command>/usr/sbin/omv-backup</command>"
    omv_config_add_node_data "//system/crontab" "job" "${object}"
fi

exit 0
