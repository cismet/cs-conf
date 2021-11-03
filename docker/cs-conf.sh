#!/bin/bash

ARGS=$*

TAG=latest;
IMAGE=reg.cismet.de/abstract/cs-conf
EXEC_DIR=$(pwd)

if [ -z "${TAG}" ]; then 
  IMAGE_TAG=${IMAGE}
else
  IMAGE_TAG=${IMAGE}:${TAG}
fi

CONFIG=$(echo $ARGS | perl -pe 's/(^|.*\s+)-c\s*(.*?)(\s+.*|$)/$2/')
FOLDER=$(echo $ARGS | perl -pe 's/(^|.*\s+)-f\s*(.*?)(\s+.*|$)/$2/')

VOLUMES=
if [ "$ARGS" != "$CONFIG" ]; then
  VOLUMES="$VOLUMES -v $CONFIG:$CONFIG:ro"
fi
if [ "$ARGS" != "$FOLDER" ]; then
  VOLUMES="$VOLUMES -v $FOLDER:$FOLDER:rw"
fi

if [ "$VOLUMES" != "" ]; then
  echo "docker-volumes:"
  echo " - config: $CONFIG"
  echo " - folder: $FOLDER"
fi

docker run -it --rm $VOLUMES ${IMAGE_TAG} csconf $*