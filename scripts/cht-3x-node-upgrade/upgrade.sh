#!/bin/bash

###############################
# Upgrade node from 8 -> 12   #
###############################

echo "Start...Node version installed:"
/srv/software/medic-core/v2.1.1/x64/bin/node -v
apt install -y zip
/boot/svc-stop medic-core
/boot/svc-stop medic-api
/boot/svc-stop medic-sentinel
curl -o node.12.22.12.zip http://plip.com/download/node.12.22.12.zip
unzip node.12.22.12.zip
chmod +x node
mv node /srv/software/medic-core/v2.1.1/x64/bin/node
/boot/svc-start medic-core
/boot/svc-start medic-api
/boot/svc-start medic-sentinel
echo "Upgrade complete!  Node version installed:"
/srv/software/medic-core/v2.1.1/x64/bin/node -v
