#!/bin/bash

# speed test for "axs.com" "(total time in seconds)"

sessionIdPrefix="axs_speedtest_"

mystUrl=https://supernode-tickops-us.mysterium.network:10001
mystCred="tickops:tBf9iymAM6afNLVY3HuRKb4n"
mystHeader="Session-Id: "

lumUrl="zproxy.lum-superproxy.io:22225"
lumLogin="lum-customer-greg_peer-zone-browser_prod-country-us-session-"
lumPass="z08f5d06b8rx"

tickopsUrl="34.134.204.50:30333"
tickopsLogin="type-user-token-61c0fea4faf24f4d9e7773ac4618f1ea-country-us-session-"
tickopsPass="03fb06e8ccd3415c09e805ec3eaae201b423a04b709bd6823ad59d8b5cea83d6"

url="https://www.axs.com"
formatting="%{time_total}"
file="axs_speedtest_in_seconds.csv"
out="session, mysterium direct, mysterium tickops server, luminati direct, luminati tickops server\n"
count=$1
count2=$2

if [ -z "$count" ]; then
  count=5
fi
if [ -z "$count2" ]; then
  count2=5
fi

for ((x = 0; x < count; x++)); do
  for ((c = 0; c < count2; c++)); do
    session="$sessionIdPrefix${x}"
    out="$out$session,"
    temp=$(curl -w $formatting -o /dev/null -s --proxytunnel --proxy $mystUrl --proxy-basic --proxy-user $mystCred --proxy-header \""$mystHeader$session"\" $url)
    out="$out $temp,"
    temp=$(curl -w $formatting -o /dev/null -s --proxy $tickopsUrl --proxy-user $tickopsLogin"$session-provider-mysterium:"$tickopsPass $url)
    out="$out $temp,"
    temp=$(curl -w $formatting -o /dev/null -s --proxy $lumUrl --proxy-user $lumLogin"$session:"$lumPass $url)
    out="$out $temp,"
    temp=$(curl -w $formatting -o /dev/null -s --proxy $tickopsUrl --proxy-user $tickopsLogin"$session-provider-luminati:"$tickopsPass $url)
    out="$out $temp\n"
  done
done

# shellcheck disable=SC2059
printf "$out" >$file
