#!/bin/sh

dir=$(dirname $0)
user=root
pass=$(awk '$1=="rootPassword:" {print $2}' $dir/Pulumi.dev.yaml)

cat <<EOF >/tmp/mongotest.js
printjson(db.adminCommand('listDatabases'));
printjson(db.getCollectionNames());
printjson(db.getUsers());
printjson(db.getRoles({showBuiltinRoles:false}));
EOF

mongosh --norc mongodb://pulumi-boilerplate:27017 -u $user -p $pass /tmp/mongotest.js

