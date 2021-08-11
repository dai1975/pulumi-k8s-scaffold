#!/bin/sh

dir=$(dirname $0)
user=$(awk '$1=="username:" {print $2}' $dir/Pulumi.dev.yaml)
pass=$(awk '$1=="password:" {print $2}' $dir/Pulumi.dev.yaml)
db=$(awk '$1=="database:" {print $2}' $dir/Pulumi.dev.yaml)
pass=$(awk '$1=="rootPassword:" {print $2}' $dir/Pulumi.dev.yaml)

cat <<EOF >/tmp/mongotest.js
printjson(db.adminCommand('listDatabases'));
printjson(db.getCollectionNames());
printjson(db.getUsers());
printjson(db.getRoles({showBuiltinRoles:false}));
EOF
#mongosh --norc mongodb://pulumi-boilerplate:27017 -u root -p $pass 
mongosh --norc mongodb://pulumi-boilerplate:27017 -u root -p $pass /tmp/mongotest.js

