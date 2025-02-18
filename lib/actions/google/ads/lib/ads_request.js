"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAdsActionRequest = void 0;
const winston = require("winston");
const missing_auth_error_1 = require("../../common/missing_auth_error");
const missing_required_params_error_1 = require("../../common/missing_required_params_error");
const utils_1 = require("../../common/utils");
const ads_executor_1 = require("./ads_executor");
const ads_form_builder_1 = require("./ads_form_builder");
const api_client_1 = require("./api_client");
const LOG_PREFIX = "[G Ads Customer Match]";
class GoogleAdsActionRequest {
    static async fromHub(hubRequest, action, logger) {
        const adsReq = new GoogleAdsActionRequest(hubRequest, action, logger);
        await adsReq.checkTokens();
        adsReq.setApiClient();
        return adsReq;
    }
    constructor(hubRequest, actionInstance, log) {
        this.hubRequest = hubRequest;
        this.actionInstance = actionInstance;
        this.log = log;
        this.streamingDownload = this.hubRequest.stream.bind(this.hubRequest);
        const state = (0, utils_1.safeParseJson)(`${hubRequest.params.state_json}`);
        if (!state || !state.tokens || !state.tokens.access_token || !state.tokens.refresh_token || !state.redirect) {
            winston.warn(`${LOG_PREFIX} User state was missing or did not contain oauth tokens & redirect`, { webhookId: hubRequest.webhookId });
            throw new missing_auth_error_1.MissingAuthError("User state was missing or did not contain oauth tokens & redirect");
        }
        this.userState = state;
        this.formParams = hubRequest.formParams;
        this.webhookId = hubRequest.webhookId;
    }
    async checkTokens() {
        // adding 5 minutes to expiry_date check to handle refresh edge case
        if (this.userState.tokens.expiry_date == null || this.userState.tokens.expiry_date < (Date.now() + 5 * 60000)) {
            winston.warn(`${LOG_PREFIX} Tokens appear expired; attempting refresh.`);
            this.log("debug", "Tokens appear expired; attempting refresh.");
            const data = await this.actionInstance.oauthHelper.refreshAccessToken(this.userState.tokens);
            if (!data || !data.access_token || !data.expiry_date) {
                winston.error(`${LOG_PREFIX} Could not refresh tokens`);
                throw new missing_auth_error_1.MissingAuthError("Could not refresh tokens");
            }
            this.userState.tokens.access_token = data.access_token;
            this.userState.tokens.expiry_date = data.expiry_date;
            winston.debug(`${LOG_PREFIX} Set new tokens`);
            this.log("debug", "Set new tokens");
        }
    }
    setApiClient() {
        this.apiClient = new api_client_1.GoogleAdsApiClient(this.log, this.accessToken, this.developerToken, this.loginCid);
    }
    get accessToken() {
        return this.userState.tokens.access_token;
    }
    get createOrAppend() {
        return this.formParams.createOrAppend;
    }
    get mobileDevice() {
        return this.formParams.mobileDevice;
    }
    get isMobileDevice() {
        return this.mobileDevice === "yes";
    }
    get mobileAppId() {
        return this.formParams.mobileAppId;
    }
    get uploadKeyType() {
        return this.isMobileDevice ? "MOBILE_ADVERTISING_ID" : "CONTACT_INFO";
    }
    get consentAdUserData() {
        return this.formParams.consentAdUserData;
    }
    get consentAdPersonalization() {
        return this.formParams.consentAdPersonalization;
    }
    get developerToken() {
        return this.actionInstance.developerToken;
    }
    get doHashingBool() {
        return (this.formParams.doHashing === "yes");
    }
    get isCreate() {
        return this.createOrAppend === "create";
    }
    get loginCid() {
        return this.formParams.loginCid;
    }
    get targetCid() {
        return this.formParams.targetCid;
    }
    get targetUserListRN() {
        return this.formParams.targetUserListRN ? this.formParams.targetUserListRN : "";
    }
    async makeForm() {
        const formBuilder = new ads_form_builder_1.GoogleAdsActionFormBuilder(this);
        return formBuilder.makeForm();
    }
    async execute() {
        // 0) Do execution specific validations
        if (!this.loginCid) {
            winston.warn(`${LOG_PREFIX} Login account id is missing`, { webhookId: this.webhookId });
            throw new missing_required_params_error_1.MissingRequiredParamsError("Login account id is missing");
        }
        if (!["create", "append"].includes(this.createOrAppend)) {
            winston.warn(`${LOG_PREFIX} createOrAppend must be either 'create' or 'append' (got '${this.formParams.createOrAppend}')`, { webhookId: this.webhookId });
            throw new missing_required_params_error_1.MissingRequiredParamsError(`createOrAppend must be either 'create' or 'append' (got '${this.formParams.createOrAppend}')`);
        }
        if (this.isMobileDevice && !this.mobileAppId) {
            winston.warn(`${LOG_PREFIX} Mobile application id is missing`, { webhookId: this.webhookId });
            throw new missing_required_params_error_1.MissingRequiredParamsError("Mobile application id is missing");
        }
        if (!["yes", "no"].includes(this.formParams.doHashing)) {
            winston.warn(`${LOG_PREFIX} Hashing must be either 'yes' or 'no' (got '${this.formParams.doHashing}')`, { webhookId: this.webhookId });
            throw new missing_required_params_error_1.MissingRequiredParamsError(`Hashing must be either 'yes' or 'no' (got '${this.formParams.doHashing}')`);
        }
        // 0) If a non-manager account was chosen for login, there will be no targetCid. Fill that in and start the helper.
        if (!this.targetCid) {
            this.formParams.targetCid = this.loginCid;
        }
        const executor = new ads_executor_1.GoogleAdsActionExecutor(this);
        // 1) Create a new list if requested, or fetch the one selected
        if (this.isCreate) {
            const { newListName, newListDescription } = this.formParams;
            if (!newListName) {
                winston.warn(`${LOG_PREFIX} Name for new list is missing`);
                throw new missing_required_params_error_1.MissingRequiredParamsError("Name for new list is missing");
            }
            const timestamp = new Date().toISOString().substring(0, 19).replace("T", " ");
            const newListNameWithTimestamp = `${newListName} (from Looker ${timestamp}Z)`;
            await executor.createUserList(newListNameWithTimestamp, newListDescription);
        }
        else {
            if (!executor.targetUserListRN) {
                winston.warn(`${LOG_PREFIX} List resource name is missing or could not be created`);
                throw new missing_required_params_error_1.MissingRequiredParamsError("List resource name is missing or could not be created");
            }
            // TODO: fetch given list to make sure it is still accessible
            winston.info(`${LOG_PREFIX} Using existing user list: ${executor.targetUserListRN}`);
            this.log("info", "Using existing user list:", executor.targetUserListRN);
        }
        // 2) Create a data job for the user list
        await executor.createDataJob();
        if (!executor.offlineUserDataJobResourceName) {
            winston.error(`${LOG_PREFIX} Failed sanity check for offlineUserDataJobResourceName`, { webhookId: this.webhookId });
            throw new missing_required_params_error_1.MissingRequiredParamsError("Failed sanity check for offlineUserDataJobResourceName.");
        }
        // 3) Add the data ("user identifiers") to the job
        await executor.uploadData();
        // 4) Run the job
        await executor.runJob();
        // 5) TODO: should we hang around and poll the job status?
        return;
    }
}
exports.GoogleAdsActionRequest = GoogleAdsActionRequest;
