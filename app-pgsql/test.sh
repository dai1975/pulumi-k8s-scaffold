#!/bin/sh

dir=$(dirname $0)
user=$(awk '$1=="username:" {print $2}' $dir/Pulumi.dev.yaml | tr -d "'\" ")
pass=$(awk '$1=="password:" {print $2}' $dir/Pulumi.dev.yaml | tr -d "'\" ")
db=$(awk '$1=="database:" {print $2}' $dir/Pulumi.dev.yaml | tr -d "'\" ")

PGPASSWORD=$pass psql -l -h pulumi-boilerplate -U $user $db


