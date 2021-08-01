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
    const kubernetes_provider = new k8s.Provider('k8s');
    await pulumi.ProviderResource.register(kubernetes_provider);

    const namespace = new k8s.core.v1.Namespace(
        config?.namespace,
        {
            metadata: {
                name: config.namespace,
                labels: { 'istio-injection': 'enabled' },
            },
        },
        { provider: kubernetes_provider }
    );
    const ingress = new Istio.Ingress(
        'istio-ingressgateway',
        pulumi.all([namespace.metadata.name]).apply(([ns]) => {
            return {
                namespace: ns,
                ports: config.ingress,
            }
        }),
        { provider: kubernetes_provider }
    );

    return {
        //config,
        namespace,
        ingress,
    }
}
export const output = main();
