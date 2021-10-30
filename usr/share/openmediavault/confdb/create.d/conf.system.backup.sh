#!/bin/sh
#
# @license   http://www.gnu.org/licenses/gpl.html GPL Version 3
# @author    Volker Theile <volker.theile@openmediavault.org>
# @author    OpenMediaVault Plugin Developers <plugins@omv-extras.org>
# @copyright Copyright (c) 2009-2013 Volker Theile
# @copyright Copyright (c) 2013-2020 OpenMediaVault Plugin Developers
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

exit 0
