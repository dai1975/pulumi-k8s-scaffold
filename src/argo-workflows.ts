import * as k8s from "@pulumi/kubernetes";
import { ConfigFile } from "@pulumi/kubernetes/yaml";
import * as kx from "@pulumi/kubernetesx";
import { ProviderResource } from "@pulumi/pulumi";
import * as pgsql from './pgsql';

export type ArgoWorkflowsConfig = {
    namespace: string,
    name?: string,
    pgsql: {
        host: string,
        username: string,
        password: string,
        database: string,
        table: string,
    },
};

export const deploy = async (provider: k8s.Provider, cfg: ArgoWorkflowsConfig) => {
    const name = cfg.name || "argo-workflows";
    const pgsql_secret = await new k8s.core.v1.Secret(name + "-auth", {
        metadata: {
            namespace: cfg.namespace,
        },
        type: "Opaque",
        data: {
            username: Buffer.from(cfg.pgsql.username).toString("base64"),
            password: Buffer.from(cfg.pgsql.password).toString("base64"),
        }
    });
    const argo_workflows = await new k8s.helm.v3.Chart(name, {
        fetchOpts: { repo: "https://argoproj.github.io/argo-helm" },
        chart: "argo-workflows",
        version: "0.2.12",
        namespace: cfg.namespace,
        values: {
            fullnameOverride: name,
            singleNamespace: true,
            controller: {
                podAnnotations: {
                    "sidecar.istio.io/inject": "true"
                }
            },
            postgresql: {
                host: cfg.pgsql.host,
                database: cfg.pgsql.database,
                tablename: cfg.pgsql.table,
                userNameSecret: {
                    name: name + "-auth",
                    key: "username",
                },
                passwordSecret: {
                    name: name + "-auth",
                    key: "password",
                }
            },
            ingress: {
                enabled: false,
            }
        }
    });
    return { argo_workflows };
};




