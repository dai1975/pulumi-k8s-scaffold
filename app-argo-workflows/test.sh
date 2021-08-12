#!/bin/sh

# firefox http://pulumi-boilerplate:2746/

dir=$(dirname $0)
sa=$(awk '$1=="serviceAccount:" {print $2}' $dir/Pulumi.dev.yaml | tr -d "'\" ")
ns=$(awk '$1=="namespace:" {print $2}' $dir/../Pulumi.dev.yaml | tr -d "'\" ")

FILE=/tmp/argo-workflow-example.yaml
cat <<EOF >$FILE
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  namespace: $ns
  name: helloworld
spec:
  entrypoint: whalesay
  serviceAccountName: $sa
  templates:
  - name: whalesay
    container:
      image: docker/whalesay:latest
      command: [cowsay]
      args: ["hello world"]
EOF

#curl -sOL https://raw.githubusercontent.com/argoproj/argo-workflows/master/examples/hello-world.yaml
#argo submit -n argo --watch https://raw.githubusercontent.com/argoproj/argo-workflows/master/examples/hello-world.yaml

argo submit -n $ns --watch $FILE
argo list -n $ns
argo get -n $ns @latest
argo logs -n $ns @latest



