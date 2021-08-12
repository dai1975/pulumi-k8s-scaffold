import * as deepmerge from 'deepmerge';
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";
import * as Const from './const';

export type ArgoWorkflowsArgs = {
    namespace: pulumi.Input<string>,
    serviceAccount: string,
    chart: {
        version?: pulumi.Input<string>,
        values?: any,
    },
    pgsql: {
        host: pulumi.Input<string>,
        username: pulumi.Input<string>,
        password: pulumi.Input<string>,
        database: pulumi.Input<string>,
        table: pulumi.Input<string>,
    },
};

export class ArgoWorkflows extends pulumi.ComponentResource {
    readonly helm: k8s.helm.v3.Chart;

    constructor(name:string, args: ArgoWorkflowsArgs, opts?: pulumi.ComponentResourceOptions) {
        super(Const.component_name('argo-workflows', 'StatefulSet'), name, {}, opts);

        const pgsql_secret = new k8s.core.v1.Secret(name + "-auth", {
            metadata: {
                namespace: args.namespace,
            },
            type: "Opaque",
            data: {
                username: Buffer.from(args.pgsql.username).toString("base64"),
                password: Buffer.from(args.pgsql.password).toString("base64"),
            }
        }, opts);

        const add_values = args.chart.values || {};
        const helm = new k8s.helm.v3.Chart(name, {
            fetchOpts: { repo: "https://argoproj.github.io/argo-helm" },
            chart: "argo-workflows",
            version: args.chart.version || "0.2.13",
            namespace: args.namespace,
            values: deepmerge({
                singleNamespace: true,
                controller: {
                    podAnnotations: {
                        "sidecar.istio.io/inject": "true"
                    },
                    containerRuntimeExecutor: 'k8sapi', // microk8s cannot work widh docker executor
                },
                postgresql: {
                    host: args.pgsql.host,
                    database: args.pgsql.database,
                    tablename: args.pgsql.table,
                    userNameSecret: {
                        name: name + "-auth",
                        key: "username",
                    },
                    passwordSecret: {
                        name: name + "-auth",
                        key: "password",
                    }
                },
                server: {
                    servicePortName: 'http-argo-workflows'
                },
                ingress: {
                    enabled: false,
                },
            }, add_values)
        }, { ...opts, dependsOn: pgsql_secret });

        const sa = new k8s.core.v1.ServiceAccount(args.serviceAccount, {
            metadata: {
                namespace: args.namespace,
                name: args.serviceAccount,
            }
        }, opts);
        const role = new k8s.rbac.v1.Role(args.serviceAccount, {
            metadata: {
                namespace:  args.namespace,
                name: args.serviceAccount,
            },
            rules: [ {
                apiGroups: [ '' ],
                resources: ['pods'],
                verbs: ['get', 'watch', 'patch'],
            }, {
                apiGroups: [ '' ],
                resources: ['pods/log'],
                verbs: ['get', 'watch'],
            }, {
                apiGroups: [ '' ],
                resources: ['pods/exec'],
                verbs: ['create'],
            } ]
        }, opts);
        const role_binding = new k8s.rbac.v1.RoleBinding(args.serviceAccount, {
            metadata: {
                namespace:  args.namespace,
                name: args.serviceAccount,
            },
            subjects: [ {
                kind: 'ServiceAccount',
                namespace: args.namespace,
                name: args.serviceAccount,
            } ],
            roleRef: {
                kind: 'Role',
                name: args.serviceAccount,
                apiGroup: 'rbac.authorization.k8s.io',
            },
        }, { ...opts, dependsOn: [ sa, role ] });

        this.helm = helm;
    }
};





