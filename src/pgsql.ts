import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";
import { ProviderResource } from "@pulumi/pulumi";
import * as istio from './crds/istio';
import { DestinationRule } from "./crds/istio/networking/v1alpha3";

type PgsqlConfig = {
    name?: string,
    namespace: string,
    rootPassword: string,
    acl: {
        username: string,
        password: string,
        database: string,
    },
};
export const deploy = async (provider:k8s.Provider, cfg:PgsqlConfig) => {
    const name = cfg.name || "pgsql";
    const pgsql = await new k8s.helm.v3.Chart(name, {
        fetchOpts: { repo: "https://charts.bitnami.com/bitnami" },
        chart: "postgresql",
        version: "10.7.0",
        namespace: cfg.namespace,
        values: {
            postgresqlPostgresPassword: cfg.rootPassword,
            postgresqlUsername: cfg.acl.username,
            postgresqlPassword: cfg.acl.password,
            postgresqlDatabase: cfg.acl.database,
            primary: {
                annotations: {
                    // ? istio-proxy failed "to fetch token from file: open /var/run/secrets/kubernetes.io/serviceaccount/token: no such file or directory"
                    'sidecar.istio.io/inject': "false",
                }
            }
        }
    });
    return {
         config: cfg,
         pgsql,
         service_name: name + "-postgres"
    };
};

type IstioConfig = {
    name?: string,
    namespace: string,
    port?: number,
    destination: {
        host: string,
        port?: number,
    }
};

//todo fail to connect...
export const deploy_istio = async(provider:k8s.Provider, cfg:IstioConfig) => {
    const name = cfg.name || "pgsql";
    const port = cfg.port || 5432;
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
                    name: 'tcp-pgsql',
                    number: port,
                    protocol: 'TCP',
                }
            } ],
        }
    });
    const vs = await new istio.networking.v1beta1.VirtualService(name, {
        metadata: {
            namespace: cfg.namespace,
        },
        spec: {
            hosts: [ '*' ],
            gateways: [ name ],
            tcp: [{
                match: [ { port: port } ],
                route: [{
                    destination: {
                        host: cfg.destination.host,
                        port: {
                            number: cfg.destination.port || port,
                        }
                    }
                }]
            }]
        }
    });
    return { gw, vs };
}

