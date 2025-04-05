#!/bin/bash

uri="mongodb://browser-prod:3PM6ee8py3DXjk@35.224.111.142/browser-prod"
fileName=~/$(TZ=GMT date '+%Y%m%d-%H%M%S').tar.gz

mongodump --archive="$fileName" --gzip --uri=$uri --excludeCollection=logs
/snap/bin/gsutil cp "$fileName" gs://mongo-browser-backups-storage/
rm "$fileName"
