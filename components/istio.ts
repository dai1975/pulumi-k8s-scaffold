import * as path from 'path';
import * as merge from 'deepmerge';
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";
import * as Const from './const';

export * from './crds/istio';

const NS = "istio-system";
const chart_dir = (...subdirs: string[]):string => {
    return Const.chart_dir('istio/manifests/charts', ...subdirs);
};

export type ControlArgs = {
};
export class Control extends pulumi.ComponentResource {
    readonly namespace: k8s.core.v1.Namespace;
    readonly base: k8s.helm.v3.Chart;
    readonly discovery: k8s.helm.v3.Chart;

    constructor(name:string, args: pulumi.Input<ControlArgs>, opts?: pulumi.ComponentResourceOptions) {
        super(Const.component_name('istio', 'Control'), name, {}, opts);
        this.namespace = new k8s.core.v1.Namespace(NS, {
            metadata: {
                name: NS,
                labels: {
                    'istio-injection': 'disabled'
                }
            }
        }, { parent: this });

        this.base = new k8s.helm.v3.Chart("istio-base", {
            path: chart_dir('base'),
            namespace: this.namespace.metadata.name,
            values: {
            },
        }, { parent: this.namespace });

        this.discovery = new k8s.helm.v3.Chart("istio-discovery", {
            path: chart_dir('istio-control', 'istio-discovery'),
            namespace: this.namespace.metadata.name,
            values: {
                global: {
                    jwtPolicy: "first-party-jwt",
                }
            }
        }, { parent: this.namespace, dependsOn: this.base });
    }
};

export type IngressPort = {
    port: number,
    targetPort?: number,
    protocol?: string,
    name: string,
};
export type IngressArgs = {
    name?: string,
    namespace: string,
    ports?: IngressPort[],
};
export class Ingress extends pulumi.ComponentResource {
    //readonly ingress: k8s.helm.v3.Chart;
    readonly selector: any;
    readonly ports: pulumi.LiftedArray<IngressPort>;

    constructor(name:string, args_: pulumi.Input<IngressArgs>, opts?: pulumi.ComponentResourceOptions) {
        super(Const.component_name('istio', 'Ingress'), name, {}, opts);
        //const ingress_name = pulumi.output(args).apply(_ => _.name || 'istio-ingressgateway');

        const r = pulumi.output(args_).apply(args => {
            const ingress_name = args.name || 'istio-ingressgateway';
            const selector = {
                istio: ingress_name,
                ns: args.namespace,
            };

            const base_ports = [
                { port: 15021, targetPort: 15021, protocol: 'TCP', name: 'status-port' },
                { port: 80,    targetPort: 80,    protocol: 'TCP', name: 'http2' },
                { port: 443,   targetPort: 443,   protocol: 'TCP', name: 'https' },
                { port: 15012, targetPort: 15012, protocol: 'TCP', name: 'tcp-istiod' },
                { port: 15443, targetPort: 15443, protocol: 'TCP', name: 'tls' },
            ];
            const add_ports = (args.ports)
                ? args.ports.map(_ => {
                    return {
                        port: _.port,
                        targetPort: _.targetPort || _.port,
                        protocol: _.protocol || 'TCP',
                        name: _.name,
                    }
                })
                : []
            const ports = base_ports.concat(add_ports);

            const values = {
                gateways: {
                    'istio-ingressgateway': {
                        labels: selector,
                        ports: ports,
                    }
                }
            };
            const ingress = new k8s.helm.v3.Chart(name, {
                path: chart_dir('gateways', 'istio-ingress'),
                namespace: pulumi.output(args).apply(_=>_.namespace),
                values: values,
            }, { parent: this });

            return { selector, ports, ingress };
        });
        this.selector = r.selector;
        this.ports = r.ports;
        //this.registerOutputs({values});
    }
}
