#!/bin/bash

# remove all files older than 30 days

thirtyDaysAgoDate=$(TZ=GMT date --date='-30 day' '+%Y%m%d-%H%M%S')

mapfile -t list < <(/snap/bin/gsutil ls gs://mongo-browser-backups-storage/**)

for fileName in "${list[@]}"; do
  IFS='/' read -ra splittedList <<<"$fileName"
  IFS='.' read -ra splittedList2 <<<"${splittedList[3]}"
  fileDate="${splittedList2[0]}"
  if [ "${fileDate}" "<" "${thirtyDaysAgoDate}" ]; then
    /snap/bin/gsutil rm "$fileName"
  fi
done

# remove all files except one per day from 30 days ago to 4 days ago

filesToRemove=()

for ((daysBackCount = 30; daysBackCount > 3; daysBackCount--)); do

  processingDate=$(TZ=GMT date --date='-'"$daysBackCount"' day' '+%Y%m%d-')

  mapfile -t list < <(/snap/bin/gsutil ls gs://mongo-browser-backups-storage/*"$processingDate"*)

  listLength="${#list[@]}"

  for ((count = 1; count < "$listLength"; count++)); do
    filesToRemove+=("${list[count]}")
  done

done

/snap/bin/gsutil rm "${filesToRemove[@]}";

