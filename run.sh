#!/bin/sh

cd `dirname $0`

python ./scripts/paster.py serve provi_wsgi.ini $@
