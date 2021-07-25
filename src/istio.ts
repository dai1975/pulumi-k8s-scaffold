import * as merge from "deepmerge";
import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";
import { ProviderResource } from "@pulumi/pulumi";

const NS = "istio-system";

export type Config = {
    submodule_dir: string,
};
export const deploy_control = async (provider: k8s.Provider, cfg:Config) => {
    const chartdir = cfg.submodule_dir + "/istio/manifests/charts";
    const ns = await new k8s.core.v1.Namespace(NS, {
        metadata: {
            name: NS,
            labels: {
                "istio-injection": "disabled"
            }
        }
    }, { provider });

    const base = await new k8s.helm.v3.Chart("istio-base", {
        path: chartdir + "/base",
        namespace: NS,
        values: {
        },
    });

    const discovery = await new k8s.helm.v3.Chart("istio-discovery", {
        path: chartdir + "/istio-control/istio-discovery",
        namespace: NS,
        values: {
            global: {
                jwtPolicy: "first-party-jwt",
            }
        }
    });
    return {
        ns, base, discovery
    };
};
export type IngressConfig = {
    name?: string,
    namespace: string,
    submodule_dir: string,
    ports?: {
        port: number,
        targetPort?: number,
        protocol?: string,
        name: string,
    }[],
};
export const deploy_ingress = async (provider:k8s.Provider, cfg: IngressConfig) => {
    const name = cfg.name || 'istio-ingressgateway';
    const chartdir = cfg.submodule_dir + "/istio/manifests/charts";
    const values = merge({
        gateways: {
            'istio-ingressgateway': {
                labels: {
                    istio: name,
                    ns: cfg.namespace,
                },
                ports: [
                    { port: 15021, targetPort: 15021, protocol: 'TCP', name: 'status-port' },
                    { port: 80,    targetPort: 80,    protocol: 'TCP', name: 'http2' },
                    { port: 443,   targetPort: 443,   protocol: 'TCP', name: 'https' },
                    { port: 15012, targetPort: 15012, protocol: 'TCP', name: 'tcp-istiod' },
                    { port: 15443, targetPort: 15443, protocol: 'TCP', name: 'tls' },
                ],
            },
        }
    }, {
        gateways: {
            'istio-ingressgateway': {
                ports: (cfg.ports)
                ? cfg.ports.map(x => { return {
                    port: x.port,
                    targetPort: x.targetPort || x.port,
                    protocol: x.protocol || 'TCP',
                    name: x.name,
                }})
                : [],
            }
        }
    });
    const ingress = await new k8s.helm.v3.Chart(name, {
        path: chartdir + "/gateways/istio-ingress",
        namespace: cfg.namespace,
        values: values,
    });
    return {
        ingress,
    };
};


