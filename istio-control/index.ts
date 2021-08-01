import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";
import { Istio } from '../components';

const main = async () => {
    const kubernetes_provider = new k8s.Provider('istio-control');
    await pulumi.ProviderResource.register(kubernetes_provider);

    const opts = {
        providers: {
            kubernetes: kubernetes_provider,
        }
    };
    const control = new Istio.Control('istio-control', {}, opts);
}

main();



