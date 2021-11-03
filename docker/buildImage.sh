#!/bin/bash

TAG=$1;
IMAGE=cismet/cs-conf
SCRIPT_DIR=$(dirname $(readlink -f $0))

if [ -z "${TAG}" ]; then 
  IMAGE_TAG=${IMAGE}
else
  IMAGE_TAG=${IMAGE}:${TAG}
fi

docker build -t ${IMAGE_TAG} -f ${SCRIPT_DIR}/Dockerfile ${SCRIPT_DIR}/..