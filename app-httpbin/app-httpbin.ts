import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";

import * as lib from '../lib';
import { Istio } from '../components';
//import { DestinationRule } from "./crds/istio/networking/v1alpha3";

type Config = {
    name?: string,
}

export const main = async () => {
    const config = new pulumi.Config().requireObject<Config>('data');
    const stack = pulumi.getStack();
    const kubernetes_provider = new k8s.Provider('istio-control');
    await pulumi.ProviderResource.register(kubernetes_provider);
    const opts = {
        provider: kubernetes_provider,
    };
    const p = lib.import_root().apply((_:lib.Root) => {
        const port = (_.ingress.ports['httpbin']) ? _.ingress.ports['httpbin'].port : undefined;
        return {
            name: config.name || `${stack}-httpbin`,
            namespace:  _.namespace,
            ingress_selector: _.ingress.selector,
            port: port,
        };
    });

    const deployment = pulumi.all([p]).apply(([p]) => new k8s.apps.v1.Deployment(p.name, {
        metadata: {
            namespace: p.namespace.metadata.name,
            name: p.name,
        },
        spec: {
            replicas: 1,
            selector: {
                matchLabels: {
                    app: p.name,
                },
            },
            template: {
                metadata: {
                    labels: {
                        app: p.name,
                    },
                },
                spec: {
                    containers: [{
                        name: 'httpbin',
                        image: 'docker.io/citizenstig/httpbin',
                        imagePullPolicy: 'IfNotPresent',
                        ports: [{
                            containerPort: 8000
                        }]
                    }]
                }
            }
        }
    }, opts));

    const svc = pulumi.all([p]).apply(([p]) => new k8s.core.v1.Service(p.name, {
        metadata: {
            name: p.name,
            namespace: p.namespace.metadata.name,
        },
        spec: {
            selector: {
                app: p.name,
            },
            type: 'ClusterIP',
            ports: [{
                name: `http-${p.name}`,
                port: 8000,
                targetPort: 8000,
            }],
        }
    }, opts));

    const gw = pulumi.all([p]).apply(([p]) => new Istio.networking.v1beta1.Gateway(p.name, {
        metadata: {
            name: p.name,
            namespace: p.namespace.metadata.name,
        },
        spec: {
            selector: p.ingress_selector,
            servers: [ {
                hosts: [ '*' ],
                port: {
                    name: `http-${p.name}`,
                    number: p.port,
                    protocol: 'HTTP',
                }
            } ],
        }
    }, opts));

    const vs = pulumi.all([p, svc, gw]).apply(([p, svc, gw]) => new Istio.networking.v1beta1.VirtualService(p.name, {
        metadata: {
            namespace: p.namespace.metadata.name,
            name: p.name,
        },
        spec: {
            hosts: [ '*' ],
            gateways: gw.metadata.apply(_ => [_.name]),
            http: [{
                match: [ { port: p.port } ],
                route: [{
                    destination: {
                        host: svc.metadata.name,
                        port: {
                            number: 8000,
                        }
                    }
                }]
            }]
        }
    }, opts));
};
