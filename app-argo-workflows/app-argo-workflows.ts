import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";

import * as lib from '../lib';
import { Istio, ArgoWorkflows } from '../components';
//import { DestinationRule } from "./crds/istio/networking/v1alpha3";


interface Config {
    name?: string,
    serviceAccount: string,
    chart: {
        version?: string,
    },
    pgsql: {
        host: string,
        username: string,
        password: string,
        database: string,
        table: string,
    }
};

export const main = async () => {
    const config = new pulumi.Config().requireObject<Config>('data');
    const stack = pulumi.getStack();
    const kubernetes_provider = new k8s.Provider('argo-workflows');
    await pulumi.ProviderResource.register(kubernetes_provider);
    const opts = {
        provider: kubernetes_provider,
    };
    const p = lib.import_root().apply((_:lib.Root) => {
        const port = (_.ingress.ports['argo-workflows']) ? _.ingress.ports['argo-workflows'].port : 2746;
        return {
            name: config.name || `${stack}-argo-workflows`,
            namespace: _.namespace,
            ingress_selector: _.ingress.selector,
            port: port,
        };
    });

    const argo_workflows = pulumi.all([p]).apply(([p]) => new ArgoWorkflows.ArgoWorkflows(p.name, {
        namespace:  p.namespace.metadata.name,
        serviceAccount: config.serviceAccount,
        chart: {
            version: config.chart.version,
            values: {
                fullnameOverride: p.name,
            }
        },
        pgsql: {
            host:     config.pgsql.host,
            username: config.pgsql.username,
            password: config.pgsql.password,
            database: config.pgsql.database,
            table:    config.pgsql.table,
        },
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

    const vs = pulumi.all([p, gw]).apply(([p, gw]) => new Istio.networking.v1beta1.VirtualService(p.name, {
        metadata: {
            namespace: p.namespace.metadata.name,
            name: p.name,
        },
        spec: {
            hosts: [ '*' ],
            gateways: gw.metadata.apply(_=> [_.name]),
            http: [{
                match: [ { port: p.port } ],
                route: [{
                    destination: {
                        host: `${p.name}-server`,
                        port: {
                            number: 2746,
                        }
                    }
                }]
            }]
        }
    }, opts));

};

