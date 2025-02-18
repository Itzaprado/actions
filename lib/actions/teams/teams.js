"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamsAction = void 0;
const httpRequest = require("request-promise-native");
const winston = require("winston");
const Hub = require("../../hub");
class TeamsAction extends Hub.Action {
    constructor() {
        super(...arguments);
        this.name = "teams_incomingwebhook";
        this.label = "Teams - Incoming Webhook";
        this.iconName = "teams/teams.png";
        this.description = "Send data to Teams Incoming webhook";
        this.supportedActionTypes = [Hub.ActionType.Query, Hub.ActionType.Dashboard];
        this.supportedFormats = [Hub.ActionFormat.Csv, Hub.ActionFormat.WysiwygPng, Hub.ActionFormat.WysiwygPdf];
        this.supportedFormattings = [Hub.ActionFormatting.Unformatted];
        this.supportedVisualizationFormattings = [
            Hub.ActionVisualizationFormatting.Noapply,
        ];
        this.params = [];
    }
    async execute(req) {
        let response = { success: true, message: "success" };
        if (!req.formParams.webhookUrl) {
            throw new Error("Teams Error: Need a webhookUrl");
        }
        if (!req.formParams.title) {
            throw new Error("Teams Error: Need a title");
        }
        if (!req.formParams.isAttached) {
            throw new Error("Teams Error: Need a attach flag");
        }
        if (!req.scheduledPlan) {
            throw new Error("Teams Error: Couldn't get data from scheduledPlan");
        }
        const webhookUrl = req.formParams.webhookUrl;
        const title = req.formParams.title;
        const text = req.formParams.text === undefined
            ? ""
            : req.formParams.text.replace(/\n/g, "\n\n");
        const resCard = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": "5035b4",
            "summary": "Looker Reports",
            "title": title,
            "text": text,
            "sections": [],
            "potentialAction": [
                {
                    "@type": "OpenUri",
                    "name": "View in Looker",
                    "targets": [{ os: "default", uri: req.scheduledPlan.url }],
                },
            ],
        };
        if (req.formParams.isAttached === "true") {
            const facts = [];
            facts.push({
                name: "Type :",
                value: req.scheduledPlan.type,
            });
            facts.push({
                name: "Title :",
                value: req.scheduledPlan.title,
            });
            if (req.type === Hub.ActionType.Query && req.scheduledPlan.query) {
                facts.push({
                    name: "Model :",
                    value: req.scheduledPlan.query.model,
                });
                facts.push({
                    name: "View :",
                    value: req.scheduledPlan.query.view,
                });
            }
            resCard.sections.push({
                facts,
            });
        }
        const option = {
            url: webhookUrl,
            json: resCard,
        };
        try {
            const result = await httpRequest.post(option).promise();
            if (result !== 1) {
                throw new Error(`Teams Error: ${result}`);
            }
        }
        catch (e) {
            response = { success: false, message: e.message };
            winston.error(`Teams Error: ${e.message}`);
        }
        return new Hub.ActionResponse(response);
    }
    async form() {
        const form = new Hub.ActionForm();
        form.fields = [];
        form.fields.push({
            label: "Webhook URL",
            name: "webhookUrl",
            required: true,
            type: "string",
        });
        form.fields.push({
            label: "Title",
            name: "title",
            required: true,
            type: "string",
        });
        form.fields.push({
            label: "Text",
            name: "text",
            required: false,
            type: "textarea",
        });
        form.fields.push({
            label: "Attach Meta Data",
            description: "attach meta data(type,title,model,view)",
            default: "false",
            name: "isAttached",
            required: false,
            type: "select",
            options: [
                { name: "false", label: "false" },
                { name: "true", label: "true" },
            ],
        });
        return form;
    }
}
exports.TeamsAction = TeamsAction;
Hub.addAction(new TeamsAction());
