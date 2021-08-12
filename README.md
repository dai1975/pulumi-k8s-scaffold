# pulumi-k8s-scaffold

# Requirements

- Kubernetes
  see next section.

- nodejs / npm / yarn
  I recommend to use asdf.

- pulumi
  `curl -fsSL https://get.pulumi.com | sh`

- crd2pulumi
  `wget https://github.com/pulumi/crd2pulumi/releases/download/v1.0.8/crd2pulumi-v1.0.8-linux-amd64.tar.gz`
  unpack tar.gz then copy crd2pulumi file to dir which is in $PATH


## git submodule

``` shell
$ git submodule init
$ git submodule update
```

# Kubernetes

## microk8s

I use microk8s. If you try to use other runtime, you can run on it.

* install & setup microk8s:

``` shell
$ snap install microk8s --classic
$ snap install kubectl --classic
$ sudo usermod -a -G groupadd microk8s $USER && $SHELL -l
$ test -f ~/.kube/config || microk8s config > ~/.kube/config
$ sudo microk8s enable dns rbac registry storage metallb:192.168.39.200-192.168.39.220
```

Select metallb's IP addresses appropriate for your system.

# Pulumi

## login

1. sign-up http://app.pulumi.com/signup
2. run `pulumi login`

## create project

This repostory is already setup pulumi project, but if you want to manually create project:

``` shell
$ mkdir projdir && cd projdir
$ pulumi new kubernetes-typescript
```

see https://www.pulumi.com/docs/get-started/kubernetes/create-project/

---
# Deploy

This scaffold adopt a design of `Micro-Stacks` in https://www.pulumi.com/docs/guides/organizing-projects-stacks/
Root directory and each app-* dir is a stack directory.

You run below process for each dirs.

## create stack

``` shell
$ pulumi stack init dev
```

settings file is already exists. copy it.

``` shell
$ cp Pulumi.dev.yaml.template Pulumi.dev.yaml
```

## deploy

``` shell
$ pulumi up
```

## test

``` shell
$ ./test.sh
```
