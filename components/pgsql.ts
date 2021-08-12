import * as deepmerge from 'deepmerge';
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";
import * as Const from './const';

export type PgsqlArgs = {
    namespace: pulumi.Input<string>,
    acl: {
        username: pulumi.Input<string>,
        password: pulumi.Input<string>,
        database: pulumi.Input<string>,
    },
    values?: any,
};

export class Pgsql extends pulumi.ComponentResource {
    readonly helm: k8s.helm.v3.Chart;

    constructor(name:string, args: PgsqlArgs, opts?: pulumi.ComponentResourceOptions) {
        super(Const.component_name('pgsql', 'StatefulSet'), name, {}, opts);

        const add_values = args.values || {};
        const helm = new k8s.helm.v3.Chart(name, {
            fetchOpts: { repo: "https://charts.bitnami.com/bitnami" },
            chart: "postgresql",
            version: "10.7.0",
            namespace: args.namespace,
            values: deepmerge({
                global: {
                    postgresql: {
                        postgresqlUsername: args.acl.username,
                        postgresqlPassword: args.acl.password,
                        postgresqlDatabase: args.acl.database,
                    },
                },
                primary: {
                    podAnnotations: {
                        // ? istio-proxy failed "to fetch token from file: open /var/run/secrets/kubernetes.io/serviceaccount/token: no such file or directory"
                        'sidecar.istio.io/inject': "false",
                    }
                },
            }, add_values)
        }, opts);

        this.helm = helm;
        this.registerOutputs({helm});
    };
};

