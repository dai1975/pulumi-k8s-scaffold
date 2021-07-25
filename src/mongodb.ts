import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";
import { ProviderResource } from "@pulumi/pulumi";

export type MongodbConfig = {
    name?: string,
    namespace: string,
    rootPassword: string,
    username: string,
    password: string,
    database: string,
};
export const deploy = async (provider:k8s.Provider, cfg:MongodbConfig) => {
    const name = cfg.name || "mongodb";
    const mongodb = await new k8s.helm.v3.Chart("mongodb", {
        fetchOpts: { repo: "https://charts.bitnami.com/bitnami" },
        chart: "mongodb",
        version: "10.21.2",
        namespace: cfg.namespace,
        values: {
            global: {
                namespaceOverride: cfg.namespace,
            },
            architecture: "standalone",
            useStatefulSet: true,
            auth: {
                rootPassword: cfg.rootPassword,
                username: cfg.username,
                password: cfg.password,
                database: cfg.database,
            },
            tls: {
                enabled: false,
            },
            service: {
                type: "ClusterIP",
            },
            persistence: {
                enabled: true,
            },
        }
    });
    return { mongodb };
};

