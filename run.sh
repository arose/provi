#!/bin/sh

cd `dirname $0`
cd app/

python provi_flask.py $1
