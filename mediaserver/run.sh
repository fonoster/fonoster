#!/usr/bin/env sh

USAGE=$(cat <<-END
To run this image you must provide the following environment variables:
    MS_EXTERN_ADDR
    MS_SIPPROXY_HOST
    MS_SIPPROXY_USERNAME
    MS_SIPPROXY_SECRET
    MS_AGI_URL
END
)

[ -z "$MS_ARI_USERNAME" ]      && { export MS_ARI_USERNAME='admin'; }
[ -z "$MS_ARI_SECRET" ]        && { export MS_ARI_SECRET='changeit'; }
[ -z "$MS_HTTP_BINDADDR" ]     && { export MS_HTTP_BINDADDR='0.0.0.0'; }
[ -z "$MS_SIP_BINDADDR" ]      && { export MS_SIP_BINDADDR='0.0.0.0:6060'; }
[ -z "$MS_LOCALNET" ]          && { export MS_LOCALNET=$(ip addr show eth0 | grep "inet\b" | awk '{print $2}'); }

[ -z "$MS_EXTERN_ADDR" ]       ||
[ -z "$MS_SIPPROXY_HOST" ]     ||
[ -z "$MS_SIPPROXY_USERNAME" ] ||
[ -z "$MS_SIPPROXY_SECRET" ]   ||
[ -z "$MS_AGI_URL" ]           && {
    echo "$USAGE"
    exit 1
}

sed -i.bak "s|MS_ARI_USERNAME_PLACEHOLDER|${MS_ARI_USERNAME}|g" /etc/asterisk/ari.conf
sed -i.bak "s|MS_ARI_SECRET_PLACEHOLDER|${MS_ARI_SECRET}|g" /etc/asterisk/ari.conf
sed -i.bak "s|MS_AGI_URL_PLACEHOLDER|${MS_AGI_URL}|g" /etc/asterisk/extensions.conf
sed -i.bak "s|MS_SIP_BINDADDR_PLACEHOLDER|${MS_SIP_BINDADDR}|g" /etc/asterisk/pjsip.conf
sed -i.bak "s|MS_HTTP_BINDADDR_PLACEHOLDER|${MS_HTTP_BINDADDR}|g" /etc/asterisk/http.conf
sed -i.bak "s|MS_EXTERN_ADDR_PLACEHOLDER|${MS_EXTERN_ADDR}|g" /etc/asterisk/pjsip.conf
sed -i.bak "s|MS_LOCALNET_PLACEHOLDER|${MS_LOCALNET}|g" /etc/asterisk/pjsip.conf
sed -i.bak "s|MS_LOCALNET_PLACEHOLDER|${MS_LOCALNET}|g" /etc/asterisk/pjsip_wizard.conf
sed -i.bak "s|MS_SIPPROXY_HOST_PLACEHOLDER|${MS_SIPPROXY_HOST}|g" /etc/asterisk/pjsip_wizard.conf
sed -i.bak "s|MS_SIPPROXY_USERNAME_PLACEHOLDER|${MS_SIPPROXY_USERNAME}|g" /etc/asterisk/pjsip_wizard.conf
sed -i.bak "s|MS_SIPPROXY_SECRET_PLACEHOLDER|${MS_SIPPROXY_SECRET}|g" /etc/asterisk/pjsip_wizard.conf
sed -i.bak "s|MS_DTMF_MODE_PLACEHOLDER|${MS_DTMF_MODE}|g" /etc/asterisk/pjsip_wizard.conf

rm /etc/asterisk/*.bak

asterisk -vvvdddf

while sleep 3600; do :; done
