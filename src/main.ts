import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";
import { ProviderResource } from "@pulumi/pulumi";

import { config } from "./config";
import * as Istio from './istio';
import * as Httpbin from './httpbin';
import * as Mongodb from './mongodb';
import * as Pgsql from './pgsql';
import * as ArgoWorkflows from './argo-workflows';

export const main = async () => {
    const provider = new k8s.Provider(config.name, { namespace: config.namespace });
    await ProviderResource.register(provider);

    const istiod = await Istio.deploy_control(provider, { submodule_dir: config.submodule_dir });

    const ns = await new k8s.core.v1.Namespace(config.namespace, {
        metadata: {
            name: config.namespace,
            labels: {
                "istio-injection": "enabled"
            }
        }
    }, { provider });

    await Istio.deploy_ingress(provider, {
        namespace: config.namespace,
        submodule_dir: config.submodule_dir,
        ports: [
            // insert any ports for application
            { port: 8000, name: 'p8000' },
            { port: 8001, name: 'p8001' },
            { port: 8002, name: 'p8002' },
            { port: 8003, name: 'p8003' },
            { port: 8004, name: 'p8004' },
        ],
    });

    // for simple httpbin service.
    const httpbin = await Httpbin.deploy(provider, {
        namespace: config.namespace,
        port: 8000,
    });

    // for mongodb
    const mongodb = await Mongodb.deploy(provider, {
        name: "mongodb",
        namespace: config.namespace,
        rootPassword: "mongopw",
        username: config.name,
        password: config.name + "pw",
        database: config.name,
    });

    // for postgresql
    const pgsql = await Pgsql.deploy(provider, {
        name: "pgsql",
        namespace: config.namespace,
        rootPassword: "pgsqlpw",
        acl: {
            username: "argowf",
            password: "argowfpw",
            database: "argowf",
        }
    });
    /* TODO: istio-proxy with postgresql is not work well...
    Pgsql.deploy_istio(provider, {
        name: 'pgsql',
        namespace: config.namespace,
        destination: {
            host: pgsql.service_name,
        }
    });
    */

    // for argo-workflows
    const argowf = await ArgoWorkflows.deploy(provider, {
        name: "argowf",
        namespace: config.namespace,
        pgsql: {
            host: pgsql.service_name,
            username: pgsql.config.acl.username,
            password: pgsql.config.acl.password,
            database: pgsql.config.acl.database,
            table: "argowf",
        }
    });
};

