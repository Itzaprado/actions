import { DataWebhookPayloadAttachment } from './data_webhook_payload_attachment';
import { DataWebhookPayloadScheduledPlan } from './data_webhook_payload_scheduled_plan';
export declare enum DataWebhookPayloadType {
    Cell = "cell",
    Query = "query",
    Dashboard = "dashboard"
}
export interface DataWebhookPayload {
    /** The type of data payload. Valid values are: "cell", "query", "dashboard". */
    type: DataWebhookPayloadType | null;
    /** The associated scheduled plan, if this payload is on a schedule. */
    scheduled_plan: DataWebhookPayloadScheduledPlan | null;
    /** Attached data, if the payload data is a file and the integration specifies "push" in its supported_download_settings. */
    attachment: DataWebhookPayloadAttachment | null;
    /** Data, if the payload data is in an inline format and the integration specifies "push" in its supported_download_settings. */
    data: {
        [key: string]: string;
    } | null;
    /** Form parameters associated with the payload. */
    form_params: {
        [key: string]: string;
    } | null;
}
export interface RequestDataWebhookPayload {
}
