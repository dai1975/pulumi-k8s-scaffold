import * as child_process from "child_process";
import * as pulumi from '@pulumi/pulumi';
import * as k8s from "@pulumi/kubernetes";
import { Istio } from './components';

export interface Root {
    namespace: k8s.core.v1.Namespace,
    ingress: Istio.Ingress,
};

export const get_organization = ():string => {
    const stack = pulumi.getStack();
    const r = JSON.parse(child_process.execSync('pulumi stack ls -j').toString());
    const url = r.filter(_ => _.name === stack).map(_=>_.url)[0];
    const m = url.match(new RegExp('^https://app.pulumi.com/([^/]+)/([^/]+)/([^/]+)$'));
    return m[1];
}

export const get_stack_ref = (subproj?: string): pulumi.StackReference => {
    const stack = pulumi.getStack();
    const org = get_organization();
    const base_project = pulumi.getProject().split('--')[0];
    const proj = (subproj)? "${base_project}--${subproj}" : base_project;
    return new pulumi.StackReference(`${org}/${proj}/${stack}`);
};

export const import_root = (): pulumi.Output<Root> => {
    const stack = get_stack_ref();
    return stack.getOutput('output').apply(_ => _ as Root);
}
