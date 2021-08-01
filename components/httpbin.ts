import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";
import { ProviderResource } from "@pulumi/pulumi";
import { config } from "process";
import * as istio from './crds/istio';
import { DestinationRule } from "./crds/istio/networking/v1alpha3";

type Config = {
    name?: string,
    namespace: string,
    port: number,
};
export const deploy = async (provider:k8s.Provider, cfg:Config) => {
    const name = cfg.name || "httpbin";
    const dep = await new k8s.apps.v1.Deployment(name, {
        metadata: {
            name: name,
            namespace: cfg.namespace,
        },
        spec: {
            replicas: 1,
            selector: {
                matchLabels: {
                    app: name,
                },
            },
            template: {
                metadata: {
                    labels: {
                        app: name,
                    },
                },
                spec: {
                    containers: [{
                        name: name,
                        image: 'docker.io/citizenstig/httpbin',
                        imagePullPolicy: 'IfNotPresent',
                        ports: [{
                            containerPort: 8000
                        }]
                    }]
                }
            }
        }
    }, { provider });
    const svc = await new k8s.core.v1.Service(name, {
        metadata: {
            name: name,
            namespace: cfg.namespace,
        },
        spec: {
            selector: {
                app: name,
            },
            type: 'ClusterIP',
            ports: [{
                name: 'http-httpbin',
                port: 8000,
                targetPort: 8000,
            }],
        }
    }, { provider });
    const gw = await new istio.networking.v1beta1.Gateway(name, {
        metadata: {
            name: name,
            namespace: cfg.namespace,
        },
        spec: {
            selector: {
                istio: 'istio-ingressgateway',
                ns: cfg.namespace,
            },
            servers: [ {
                hosts: [ '*' ],
                port: {
                    name: 'http-httpbin',
                    number: cfg.port,
                    protocol: 'HTTP',
                }
            } ],
        }
    }, { provider });
    const vs = await new istio.networking.v1beta1.VirtualService(name, {
        metadata: {
            name: name,
            namespace: cfg.namespace,
        },
        spec: {
            hosts: [ '*' ],
            gateways: [ name ],
            http: [{
                match: [ { port: cfg.port } ],
                route: [{
                    destination: {
                        host: name,
                        port: {
                            number: 8000,
                        }
                    }
                }]
            }]
        }
    }, { provider });
    return { gw, vs };
}

