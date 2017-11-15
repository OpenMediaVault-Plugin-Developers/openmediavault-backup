#!/bin/sh

set -e

. /usr/share/openmediavault/scripts/helper-functions

SERVICE_XPATH_NAME="backup"
SERVICE_XPATH="/config/system/${SERVICE_XPATH_NAME}"

if omv_config_exists "${SERVICE_XPATH}"; then
    omv_config_delete "${SERVICE_XPATH}"
fi

exit 0
