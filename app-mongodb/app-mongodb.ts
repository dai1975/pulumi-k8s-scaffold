import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";

import * as lib from '../lib';
import { Istio, Mongodb } from '../components';
//import { DestinationRule } from "./crds/istio/networking/v1alpha3";


interface Config {
    name?: string,
    rootPassword: string,
    username: string,
    password: string,
    database: string,
};

export const main = async () => {
    const config = new pulumi.Config().requireObject<Config>('data');
    const stack = pulumi.getStack();
    const kubernetes_provider = new k8s.Provider('mongodb');
    await pulumi.ProviderResource.register(kubernetes_provider);
    const opts = {
        provider: kubernetes_provider,
    };
    const p = lib.import_root().apply((_:lib.Root) => {
        //const port = _.ingress.ports.find(_ => _.name.apply(_ => _ == 'mongodb'))!.port;
        const port = (_.ingress.ports['mongodb']) ? _.ingress.ports['mongodb'].port : undefined;
        return {
            name: config.name || `${stack}-mongodb`,
            namespace: _.namespace,
            ingress_selector: _.ingress.selector,
            port: port,
        };
    });

    const mongo = pulumi.all([p]).apply(([p]) => new Mongodb.Mongodb(p.name, {
        namespace:  p.namespace.metadata.name,
        rootPassword: config.rootPassword,
        username: config.username,
        password: config.password,
        database: config.database,
        values: {
            fullnameOverride: p.name,
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
                    name: `mongo-${p.name}`,
                    number: p.port,
                    protocol: 'TCP',
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
            tcp: [{
                match: [ { port: p.port } ],
                route: [{
                    destination: {
                        host: p.name, //svc.metadata.name,
                        port: {
                            number: 27017,
                        }
                    }
                }]
            }]
        }
    }, opts));
};



