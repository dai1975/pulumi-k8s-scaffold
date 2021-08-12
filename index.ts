import * as pulumi from '@pulumi/pulumi';
import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";
import { ProviderResource } from "@pulumi/pulumi";
import * as lib from './lib';
import { Istio } from './components';

interface Config {
    namespace: string,
    ingress?: {
        name: string,
        port: number,
    }[]
};

const main = async (): Promise<lib.Root> => {
    const config = new pulumi.Config().requireObject<Config>('data');
    const stack = pulumi.getStack();
    const kubernetes_provider = new k8s.Provider('k8s');
    await pulumi.ProviderResource.register(kubernetes_provider);
    const opts = {
        provider: kubernetes_provider,
    };

    const istiod = new Istio.Control('istio-control', {}, opts);

    const namespace = new k8s.core.v1.Namespace(config.namespace, {
        metadata: {
            name: config.namespace,
            labels: { 'istio-injection': 'enabled' },
        },
    }, opts);

    const ingress_name = `${stack}-istio-ingressgateway`;
    /* output<ingress> だと lib.Root 型へうまく代入できないなぁ。
    const ingress = pulumi.all([namespace]).apply(([ns]) => new Istio.Ingress(ingress_name, {
        namespace: ns.metadata.name,
        ports: config.ingress,
    }, { ...opts, dependsOn: [istiod, namespace] }));
    */
    const ingress = new Istio.Ingress(ingress_name, {
        namespace: config.namespace,
        ports: config.ingress,
    }, { ...opts, dependsOn: [istiod, namespace] });

    return { namespace, ingress, };
}

export const output = main();

