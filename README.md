# pulumi-k8s-boilerplate

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


# Kubernetes

## microk8s

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
NOTE: This boilerplate has already done the step.

If you manually create project:

``` shell
$ mkdir projdir && cd projdir
$ pulumi new kubernetes-typescript
```

see https://www.pulumi.com/docs/get-started/kubernetes/create-project/

## create stack
This boilerplate uses single monothilic stack "dev".

``` shell
$ pulumi stack init dev
$ pulumi stack ls
```

## develop
see `src/main.ts` and related source files.

## deploy

``` shell
$ pulumi up
```

