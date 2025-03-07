"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validFacebookHashCombinations = exports.CUSTOMER_LIST_SOURCE_TYPES = exports.API_BASE_URL = exports.API_VERSION = void 0;
const gaxios = require("gaxios");
const winston = require("winston");
const util_1 = require("./util");
const LOG_PREFIX = "[Facebook Custom Audiences]";
exports.API_VERSION = "v22.0";
exports.API_BASE_URL = `https://graph.facebook.com/${exports.API_VERSION}/`;
exports.CUSTOMER_LIST_SOURCE_TYPES = {
    // Used by Facebook for unknown purposes.
    USER_PROVIDED_ONLY: "USER_PROVIDED_ONLY",
    PARTNER_PROVIDED_ONLY: "PARTNER_PROVIDED_ONLY",
    BOTH_USER_AND_PARTNER_PROVIDED: "BOTH_USER_AND_PARTNER_PROVIDED",
};
/* tslint:disable */
// [transformFunction, the multikey name facebook expects to see]
exports.validFacebookHashCombinations = [
    [(formattedRow) => `${formattedRow.email}`, "EMAIL_SHA256"],
    [(formattedRow) => `${formattedRow.phone}`, "PHONE_SHA256"],
    [(formattedRow) => `${formattedRow.lastName}_${formattedRow.firstName}_${formattedRow.city}_${formattedRow.state}`, "LN_FN_CT_ST_SHA256"],
    [(formattedRow) => `${formattedRow.lastName}_${formattedRow.firstName}_${formattedRow.zip}`, "LN_FN_ZIP_SHA256"],
    [(formattedRow) => `${formattedRow.madid}`, "MADID_SHA256"],
    [(formattedRow) => `${formattedRow.email}_${formattedRow.firstName}`, "EMAIL_FN_SHA256"],
    [(formattedRow) => `${formattedRow.email}_${formattedRow.lastName}`, "EMAIL_LN_SHA256"],
    [(formattedRow) => `${formattedRow.phone}_${formattedRow.firstName}`, "PHONE_FN_SHA256"],
    [(formattedRow) => `${formattedRow.lastName}_${formattedRow.firstName}_${formattedRow.zip}_${formattedRow.birthYear}`, "LN_FN_ZIP_DOBY_SHA256"],
    [(formattedRow) => `${formattedRow.lastName}_${formattedRow.firstName}_${formattedRow.city}_${formattedRow.state}_${formattedRow.birthYear}`, "LN_FN_CT_ST_DOBY_SHA256"],
    [(formattedRow) => `${formattedRow.lastName}_${formattedRow.firstInitial}_${formattedRow.zip}`, "LN_FI_ZIP_SHA256"],
    [(formattedRow) => `${formattedRow.lastName}_${formattedRow.firstInitial}_${formattedRow.city}_${formattedRow.state}`, "LN_FI_CT_ST_SHA256"],
    [(formattedRow) => `${formattedRow.lastName}_${formattedRow.firstInitial}_${formattedRow.state}_${getDateOfBirthFromUserFields(formattedRow)}`, "LN_FI_ST_DOB_SHA256"],
    [(formattedRow) => `${formattedRow.lastName}_${formattedRow.firstName}_${formattedRow.state}_${formattedRow.birthYear}`, "LN_FN_ST_DOBY_SHA256"],
    [(formattedRow) => `${formattedRow.lastName}_${formattedRow.firstName}_${formattedRow.country}_${getDateOfBirthFromUserFields(formattedRow)}`, "LN_FN_COUNTRY_DOB_SHA256"],
    [(formattedRow) => `${formattedRow.lastName}_${formattedRow.firstName}_${getDateOfBirthFromUserFields(formattedRow)}`, "LN_FN_DOB_SHA256"],
    [(formattedRow) => `${formattedRow.externalId}`, "EXTERN_ID"],
];
/* tslint:enable */
function getDateOfBirthFromUserFields(uf) {
    if ((0, util_1.isNullOrUndefined)(uf.birthDay) || (0, util_1.isNullOrUndefined)(uf.birthMonth) || (0, util_1.isNullOrUndefined)(uf.birthYear)) {
        return null;
    }
    return (0, util_1.formatFullDate)(uf.birthDay + "", uf.birthMonth + "", uf.birthYear + "");
}
class FacebookCustomAudiencesApi {
    constructor(accessToken) {
        this.accessToken = accessToken;
    }
    async pagingResults(url) {
        let data = [];
        let hasNext = true;
        while (hasNext) {
            const response = await this.apiCall("GET", url);
            data = [...data, ...response.data];
            if (!response.paging || !response.paging.next) {
                hasNext = false;
            }
            else {
                url = response.paging.next
                    .replace(exports.API_BASE_URL, "")
                    .replace(/access_token=.+?&/, "");
            }
        }
        return data;
    }
    async me() {
        return this.apiCall("GET", "me");
    }
    /*
        Sample response:
        {
            "data": [
                {
                "name": "Test Ad Account 1",
                "account_id": "114108701688636",
                "id": "act_114108701688636"
                }
            ],
            "paging": {
                "cursors": {
                    "before": "abcdef123",
                    "after": "abcdef456"
                },
                "previous": "https://graph.facebook.com...&before=abcdef123",
                "next": "https://graph.facebook.com...&after=abcdef456"
            }
        }
    */
    async getAdAccounts() {
        const addAcountsUrl = `me/adaccounts?fields=name,account_id`;
        const data = await this.pagingResults(addAcountsUrl);
        const namesAndIds = data
            .map((adAccountMetadata) => ({ name: adAccountMetadata.name, id: adAccountMetadata.account_id }))
            .sort(util_1.sortCompare);
        return namesAndIds;
    }
    /*
        Sample response:
        {
            "data": [
                {
                "name": "My new Custom Audience",
                "id": "23837492450850533"
                }
            ],
            "paging": {
                "cursors": {
                    "before": "abcdef123",
                    "after": "abcdef456"
                },
                "previous": "https://graph.facebook.com...&before=abcdef123",
                "next": "https://graph.facebook.com...&after=abcdef456"
            }
        }
    */
    async getCustomAudiences(adAccountId) {
        const customAudienceUrl = `act_${adAccountId}/customaudiences?fields=name`;
        const data = await this.pagingResults(customAudienceUrl);
        const namesAndIds = data
            .map((customAudienceMetadata) => ({ name: customAudienceMetadata.name, id: customAudienceMetadata.id }))
            .sort(util_1.sortCompare);
        return namesAndIds;
    }
    /* tslint:disable */
    async createCustomAudience(adAccountId, name, description = "", customer_file_source = exports.CUSTOMER_LIST_SOURCE_TYPES.USER_PROVIDED_ONLY) {
        const createCustomAudienceUrl = `act_${adAccountId}/customaudiences`;
        const response = await this.apiCall("POST", createCustomAudienceUrl, {
            name,
            description,
            customer_file_source,
            subtype: "CUSTOM",
        });
        return response.id;
    }
    /* tslint:enable */
    async appendUsersToCustomAudience(customAudienceId, session, payload) {
        const appendUrl = `${customAudienceId}/users`;
        const response = await this.apiCall("POST", appendUrl, {
            session,
            payload,
        });
        return response;
    }
    async replaceUsersInCustomAudience(customAudienceId, session, payload) {
        const replaceUrl = `${customAudienceId}/usersreplace`;
        const response = await this.apiCall("POST", replaceUrl, {
            session,
            payload,
        });
        return response;
    }
    async apiCall(method, url, data) {
        let queryParamCharacter = "?";
        if (url.indexOf("?") >= 0) {
            // don't use two question marks if the url already
            // contains query parameters
            queryParamCharacter = "&";
        }
        const response = await gaxios.request({
            method,
            url: url + `${queryParamCharacter}access_token=${this.accessToken}`,
            data,
            baseURL: exports.API_BASE_URL,
        }).catch((err) => {
            (0, util_1.sanitizeError)(err);
            if (err && err.response && err.response.data &&
                err.response.data.error && err.response.data.error.message) {
                // Note: these can still leak access tokens if facebook replies with:
                // "400 bad request, here's what you sent me!". keep the logging at debug level
                winston.debug(`${LOG_PREFIX} Facebook error message was: ${err.response.data.error.message}`);
                winston.debug(`${LOG_PREFIX} Facebook user friendly message title was: ${err.response.data.error.error_user_title}`);
                winston.debug(`${LOG_PREFIX} Facebook user friendly message was: ${err.response.data.error.error_user_msg}`);
            }
            // Note that the access token is intentionally omitted from this log
            winston.error(`${LOG_PREFIX} Error in network request ${method} ${url}` +
                ` with parameters: ${typeof data === "object" && JSON.stringify(data)}.`);
        });
        return response && response.data;
    }
}
exports.default = FacebookCustomAudiencesApi;
