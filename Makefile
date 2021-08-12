all:
	echo hello

microk8s:
	snap install microk8s --classic
	snap install kubectl --classic
	test -f ~/.kube/config || microk8s.config > ~/.kube/config
	sudo microk8s enable dns 

asdf:
	echo 'setup asdf-vm. see https://asdf-vm.com/#/core-manage-asdf'

golang:
	asdf plugin add golang
	asdf install golang 1.16.5

nodejs:
	asdf plugin add nodejs
	asdf install nodejs 16.4.2

yarn:
	asdf plugin add yarn
	asdf install yarn 1.22.10

pulumi:
	curl -fsSL https://get.pulumi.com | sh

crd2pulumi:
	wget https://github.com/pulumi/crd2pulumi/releases/download/v1.0.8/crd2pulumi-v1.0.8-linux-amd64.tar.gz

crds:
	crd2pulumi --nodejsPath ./src/crds/istio ../submodules/istio/manifests/charts/base/crds/crd-all.gen.yaml

PHONY: asdf golang nodejs yarn pulumi crd2pulumi crds
