// *** WARNING: this file was generated by crd2pulumi. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import { input as inputs, output as outputs } from "../../types";
import * as utilities from "../../utilities";

import {ObjectMeta} from "../../meta/v1";

export class Telemetry extends pulumi.CustomResource {
    /**
     * Get an existing Telemetry resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    public static get(name: string, id: pulumi.Input<pulumi.ID>, opts?: pulumi.CustomResourceOptions): Telemetry {
        return new Telemetry(name, undefined as any, { ...opts, id: id });
    }

    /** @internal */
    public static readonly __pulumiType = 'kubernetes:telemetry.istio.io/v1alpha1:Telemetry';

    /**
     * Returns true if the given object is an instance of Telemetry.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    public static isInstance(obj: any): obj is Telemetry {
        if (obj === undefined || obj === null) {
            return false;
        }
        return obj['__pulumiType'] === Telemetry.__pulumiType;
    }

    public readonly apiVersion!: pulumi.Output<"telemetry.istio.io/v1alpha1" | undefined>;
    public readonly kind!: pulumi.Output<"Telemetry" | undefined>;
    public readonly metadata!: pulumi.Output<ObjectMeta | undefined>;
    /**
     * Telemetry defines how the telemetry is generated for workloads within a mesh.
     */
    public readonly spec!: pulumi.Output<outputs.telemetry.v1alpha1.TelemetrySpec | undefined>;
    public readonly status!: pulumi.Output<{[key: string]: any} | undefined>;

    /**
     * Create a Telemetry resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: TelemetryArgs, opts?: pulumi.CustomResourceOptions) {
        let inputs: pulumi.Inputs = {};
        opts = opts || {};
        if (!opts.id) {
            inputs["apiVersion"] = "telemetry.istio.io/v1alpha1";
            inputs["kind"] = "Telemetry";
            inputs["metadata"] = args ? args.metadata : undefined;
            inputs["spec"] = args ? args.spec : undefined;
            inputs["status"] = args ? args.status : undefined;
        } else {
            inputs["apiVersion"] = undefined /*out*/;
            inputs["kind"] = undefined /*out*/;
            inputs["metadata"] = undefined /*out*/;
            inputs["spec"] = undefined /*out*/;
            inputs["status"] = undefined /*out*/;
        }
        if (!opts.version) {
            opts = pulumi.mergeOptions(opts, { version: utilities.getVersion()});
        }
        super(Telemetry.__pulumiType, name, inputs, opts);
    }
}

/**
 * The set of arguments for constructing a Telemetry resource.
 */
export interface TelemetryArgs {
    readonly apiVersion?: pulumi.Input<"telemetry.istio.io/v1alpha1">;
    readonly kind?: pulumi.Input<"Telemetry">;
    readonly metadata?: pulumi.Input<ObjectMeta>;
    /**
     * Telemetry defines how the telemetry is generated for workloads within a mesh.
     */
    readonly spec?: pulumi.Input<inputs.telemetry.v1alpha1.TelemetrySpecArgs>;
    readonly status?: pulumi.Input<{[key: string]: any}>;
}
