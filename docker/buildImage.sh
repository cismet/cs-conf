#!/bin/bash

TAG=$1;
IMAGE=reg.cismet.de/abstract/csconf
SCRIPT_DIR=$(dirname $(readlink -f $0))

if [ -z "${TAG}" ]; then 
  IMAGE_TAG=${IMAGE}
else
  IMAGE_TAG=${IMAGE}:${TAG}
fi

docker build -t ${IMAGE_TAG} -f ${SCRIPT_DIR}/Dockerfile ${SCRIPT_DIR}/..

# this part is necessary because if we set the new entrypoint in the Dockerfile
# the cmd which is set in the parent image wouldn't be reseted
# solution found at: https://stackoverflow.com/questions/28877150/how-can-i-remove-the-cmd-entry-from-a-docker-image-configuration
docker run --name=csconf-entrypoint-modification --entrypoint=/app/build/csconf ${IMAGE_TAG} > /dev/null;
docker commit csconf-entrypoint-modification ${IMAGE_TAG}
docker rm csconf-entrypoint-modification