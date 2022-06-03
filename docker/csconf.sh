#!/bin/bash

ARGS=$*

TAG=latest;
IMAGE=reg.cismet.de/abstract/csconf
EXEC_DIR=$(pwd)

if [ -z "${TAG}" ]; then 
  IMAGE_TAG=${IMAGE}
else
  IMAGE_TAG=${IMAGE}:${TAG}
fi

CONFIG=$(echo $ARGS | perl -pe 's/(^|.*\s+)-c\s*(.*?)(\s+.*|$)/$2/')
configDir=$(echo $ARGS | perl -pe 's/(^|.*\s+)-f\s*(.*?)(\s+.*|$)/$2/')

VOLUMES=
if [ "$ARGS" != "$CONFIG" ]; then
  VOLUMES="$VOLUMES -v $CONFIG:$CONFIG:ro"
fi
if [ "$ARGS" != "$configDir" ]; then
  VOLUMES="$VOLUMES -v $configDir:$configDir:rw"
fi

if [ "$VOLUMES" != "" ]; then
  echo "docker-volumes:"
  echo " - config: $CONFIG"
  echo " - configDir: $configDir"
fi

docker run -it --rm $VOLUMES ${IMAGE_TAG} $*