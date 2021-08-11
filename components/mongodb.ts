import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";
import * as Const from './const';

export type MongodbArgs = {
    namespace: pulumi.Input<string>,
    rootPassword: pulumi.Input<string>,
    username: pulumi.Input<string>,
    password: pulumi.Input<string>,
    database: pulumi.Input<string>,
    values?: any,
};
export class Mongodb extends pulumi.ComponentResource {
    //readonly helm: pulumi.Lifted<k8s.helm.v3.Chart>;
    readonly helm: k8s.helm.v3.Chart;

    constructor(name:string, args: MongodbArgs, opts?: pulumi.ComponentResourceOptions) {
        super(Const.component_name('mongodb', 'StatefulSet'), name, {}, opts);

        const add_values = args.values || {};
        const helm = new k8s.helm.v3.Chart("mongodb", {
            fetchOpts: { repo: "https://charts.bitnami.com/bitnami" },
            chart: "mongodb",
            version: "10.21.2",
            namespace: args.namespace,
            values: {
                global: {
                    namespaceOverride: args.namespace,
                },
                architecture: "standalone",
                useStatefulSet: true,
                auth: {
                    rootPassword: args.rootPassword,
                    username: args.username,
                    password: args.password,
                    database: args.database,
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
                ...add_values,
            }
        }, opts);
        //console.log(helm);
        this.helm = helm;
        this.registerOutputs({helm});
    };
};

