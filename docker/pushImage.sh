#!/bin/bash

TAG=$1;
IMAGE=reg.cismet.de/abstract/cs-conf

if [ -z "${TAG}" ]; then 
  IMAGE_TAG=${IMAGE}
else
  IMAGE_TAG=${IMAGE}:${TAG}
fi

docker push ${IMAGE_TAG}