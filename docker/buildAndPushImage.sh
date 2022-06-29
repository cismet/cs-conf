#!/bin/bash

DIR=$(dirname "$(readlink -f "$0")")
TAG=$1;

"${DIR}/buildImage.sh" ${TAG} && "${DIR}/pushImage.sh" ${TAG}