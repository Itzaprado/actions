import { GaxiosResponse } from "gaxios";
import { Credentials, OAuth2Client } from "google-auth-library";
import { drive_v3 } from "googleapis";
import * as Hub from "../../../hub";
import Drive = drive_v3.Drive;
export declare class GoogleDriveAction extends Hub.OAuthAction {
    name: string;
    label: string;
    iconName: string;
    description: string;
    supportedActionTypes: Hub.ActionType[];
    usesStreaming: boolean;
    minimumSupportedLookerVersion: string;
    requiredFields: never[];
    params: {
        name: string;
        label: string;
        required: boolean;
        sensitive: boolean;
        description: string;
    }[];
    mimeType: string | undefined;
    execute(request: Hub.ActionRequest): Promise<Hub.ActionResponse>;
    form(request: Hub.ActionRequest): Promise<Hub.ActionForm>;
    oauthUrl(redirectUri: string, encryptedState: string): Promise<string>;
    oauthFetchInfo(urlParams: {
        [key: string]: string;
    }, redirectUri: string): Promise<void>;
    oauthCheck(request: Hub.ActionRequest): Promise<boolean>;
    oauth2Client(redirectUri: string | undefined): OAuth2Client;
    sendData(filename: string, request: Hub.ActionRequest, drive: Drive): Promise<GaxiosResponse<drive_v3.Schema$File>>;
    getDrives(drive: Drive, accumulatedFolders: drive_v3.Schema$Drive[], response: GaxiosResponse<drive_v3.Schema$DriveList>): Promise<drive_v3.Schema$Drive[]>;
    getMimeType(request: Hub.ActionRequest): string | undefined;
    sanitizeGaxiosError(err: any): void;
    protected getAccessTokenCredentialsFromCode(redirect: string, code: string): Promise<Credentials>;
    protected driveClientFromRequest(redirect: string, tokens: Credentials): Promise<drive_v3.Drive>;
    protected getUserEmail(redirect: string, tokens: Credentials): Promise<string>;
    protected validateUserInDomainAllowlist(domainAllowlist: string | undefined, redirect: string, tokens: Credentials, requestWebhookId: string | undefined): Promise<void>;
    private loginForm;
}
