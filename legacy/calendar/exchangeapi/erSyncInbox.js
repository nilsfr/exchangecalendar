/* ***** BEGIN LICENSE BLOCK *****
 * Version: GPL 3.0
 *
 * The contents of this file are subject to the General Public License
 * 3.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.gnu.org/licenses/gpl.html
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * -- Exchange 2007/2010 Calendar and Tasks Provider.
 * -- For Thunderbird with the Lightning add-on.
 *
 * This work is a combination of the Storage calendar, part of the default Lightning add-on, and 
 * the "Exchange Data Provider for Lightning" add-on currently, october 2011, maintained by Simon Schubert.
 * Primarily made because the "Exchange Data Provider for Lightning" add-on is a continuation 
 * of old code and this one is build up from the ground. It still uses some parts from the 
 * "Exchange Data Provider for Lightning" project.
 *
 * Author: Michel Verbraak (info@1st-setup.nl)
 * Website: http://www.1st-setup.nl/wordpress/?page_id=133
 * email: exchangecalendar@extensions.1st-setup.nl
 *
 *
 * This code uses parts of the Microsoft Exchange Calendar Provider code on which the
 * "Exchange Data Provider for Lightning" was based.
 * The Initial Developer of the Microsoft Exchange Calendar Provider Code is
 *   Andrea Bittau <a.bittau@cs.ucl.ac.uk>, University College London
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * ***** BEGIN LICENSE BLOCK *****/



ChromeUtils.import("resource://gre/modules/Services.jsm");

ChromeUtils.import("resource://calendar/modules/calUtils.jsm");

const { exchWebService } = ChromeUtils.import("resource://exchangecommon/ecFunctions.js");
ChromeUtils.import("resource://exchangecommon/ecExchangeRequest.js");
const {
    makeParentFolderIds2,
    makeParentFolderIds3,
    publicFoldersMap
} = ChromeUtils.import("resource://exchangecommon/soapFunctions.js");

ChromeUtils.import("resource://exchangecommoninterfaces/xml2json/xml2json.js");

var EXPORTED_SYMBOLS = ["erSyncInboxRequest"];

function erSyncInboxRequest(aArgument, aCbOk, aCbError, aListener) {
    this.mCbOk = aCbOk;
    this.mCbError = aCbError;

    var self = this;

    this.parent = new ExchangeRequest(aArgument,
        function (aExchangeRequest, aResp) {
            self.onSendOk(aExchangeRequest, aResp);
        },
        function (aExchangeRequest, aCode, aMsg) {
            self.onSendError(aExchangeRequest, aCode, aMsg);
        },
        aListener);

    this.argument = aArgument;
    this.mailbox = aArgument.mailbox;
    this.serverUrl = aArgument.serverUrl;
    this.folderID = aArgument.folderID;
    this.folderBase = aArgument.folderBase;
    this.changeKey = aArgument.changeKey;
    this.listener = aListener;
    this.syncState = aArgument.syncState;

    if (!aArgument.syncState) {
        this.getSyncState = true;
    }
    else {
        this.getSyncState = false;
    }

    this.creations = {
        meetingrequests: [],
        meetingCancellations: [],
        meetingResponses: []
    };
    this.updates = {
        meetingrequests: [],
        meetingCancellations: [],
        meetingResponses: []
    };
    this.deletions = {
        meetingrequests: [],
        meetingCancellations: [],
        meetingResponses: []
    };

    this.isRunning = true;
    this.execute(aArgument.syncState);
}

erSyncInboxRequest.prototype = {

    execute: function _execute(aSyncState) {
        exchWebService.commonFunctions.LOG("erSyncInboxRequest.execute\n");

        //var req = exchWebService.commonFunctions.xmlToJxon('<nsMessages:SyncFolderItems xmlns:nsMessages="'+nsMessagesStr+'" xmlns:nsTypes="'+nsTypesStr+'"/>');

        //var itemShape = req.addChildTag("ItemShape", "nsMessages", null);
        //itemShape.addChildTag("BaseShape", "nsTypes", "AllProperties");
        //itemShape = null;

        var root = xml2json.newJSON();
        var req = xml2json.addTag(root, "SyncFolderItems", "nsMessages", null);
        xml2json.setAttribute(req, "xmlns:nsMessages", nsMessagesStr);
        xml2json.setAttribute(req, "xmlns:nsTypes", nsTypesStr);

        var itemShape = xml2json.addTag(req, "ItemShape", "nsMessages", null);
        var baseShape = xml2json.addTag(itemShape, "BaseShape", "nsTypes", "AllProperties");

        //var parentFolder = makeParentFolderIds2("SyncFolderId", this.argument);
        //req.addChildTagObject(parentFolder);

        var parentFolder = makeParentFolderIds3("SyncFolderId", this.argument);
        xml2json.addTagObject(req, parentFolder);
        parentFolder = null;

        if ((aSyncState) && (aSyncState != "")) {
            xml2json.addTag(req, "SyncState", "nsMessages", aSyncState);
        }

        //		if (this.getSyncState) {
        xml2json.addTag(req, "MaxChangesReturned", "nsMessages", "512");
        //		}
        //		else {
        //			req.addChildTag("MaxChangesReturned", "nsMessages", "15");  // We will ask 15 items at a time.
        //		}

        this.parent.xml2json = true;

        //exchWebService.commonFunctions.LOG("erSyncInboxRequest.execute:"+String(this.parent.makeSoapMessage(req)));
        var soapStr = this.parent.makeSoapMessage2(req);
        req = null;
        this.parent.sendRequest(soapStr, this.serverUrl);
        req = null;
    },

    onSendOk: function _onSendOk(aExchangeRequest, aResp) {
        //exchWebService.commonFunctions.LOG("erSyncInboxRequest.onSendOk:"+String(aResp));

        //var rm = aResp.XPath("/s:Envelope/s:Body/m:SyncFolderItemsResponse/m:ResponseMessages/m:SyncFolderItemsResponseMessage[@ResponseClass='Success' and m:ResponseCode='NoError']");
        var rm = xml2json.XPath(aResp, "/s:Envelope/s:Body/m:SyncFolderItemsResponse/m:ResponseMessages/m:SyncFolderItemsResponseMessage[@ResponseClass='Success' and m:ResponseCode='NoError']");

        if (rm.length > 0) {
            var syncState = xml2json.getTagValue(rm[0], "m:SyncState");

            var lastItemInRange = xml2json.getTagValue(rm[0], "m:IncludesLastItemInRange");

            //	if (!this.getSyncState) {
            var creation_result = xml2json.XPath(rm[0], "/m:Changes/t:Create");
            if (creation_result) {
                for (var creation of Object.values(creation_result)) {
                    for (var meetingrequest of Object.values(xml2json.getTags(creation, "t:MeetingRequest"))) {
                        this.creations.meetingrequests.push(meetingrequest);
                    }
                    for (var meetingCancellation of Object.values(xml2json.getTags(creation, "t:MeetingCancellation"))) {
                        this.creations.meetingCancellations.push(meetingCancellation);
                    }
                    for (var meetingResponse of Object.values(xml2json.getTags(creation, "t:MeetingResponse"))) {
                        this.creations.meetingResponses.push(meetingResponse);
                    }
                }
            }
            creation_result = null;

            var update_result = xml2json.XPath(rm[0], "/m:Changes/t:Update");
            if (update_result) {
                for (var update of Object.values(update_result)) {
                    for (var meetingrequest of Object.values(xml2json.getTags(update, "t:MeetingRequest"))) {
                        this.updates.meetingrequests.push(meetingrequest);
                    }
                    for (var meetingCancellation of Object.values(xml2json.getTags(update, "t:MeetingCancellation"))) {
                        this.updates.meetingCancellations.push(meetingCancellation);
                    }
                    for (var meetingResponse of Object.values(xml2json.getTags(update, "t:MeetingResponse"))) {
                        this.updates.meetingResponses.push(meetingResponse);
                    }
                }
            }
            update_result = null;

            var deleted_result = xml2json.XPath(rm[0], "/m:Changes/t:Delete");
            if (deleted_result) {
                for (var deleted of Object.values(deleted_result)) {
                        for (var meetingrequest of Object.values(xml2json.getTags(deleted, "t:MeetingRequest"))) {
                            this.deletions.meetingrequests.push(meetingrequest);
                        }
                        for (var meetingCancellation of Object.values(xml2json.getTags(deleted, "t:MeetingCancellation"))) {
                            this.deletions.meetingCancellations.push(meetingCancellation);
                        }
                        for (var meetingResponse of Object.values(xml2json.getTags(deleted, "t:MeetingResponse"))) {
                            this.deletions.meetingResponses.push(meetingResponse);
                        }
                    }
                //	}
            }
            deleted_result = null;

            rm = null;
            if (lastItemInRange == "false") {
                this.execute(syncState);
                return;
            }
            else {
                if (this.mCbOk) {
                    this.mCbOk(this, this.creations, this.updates, this.deletions, syncState);
                }
                this.isRunning = false;
            }
        }
        else {
            rm = null;
            //var rm = aResp.XPath("/s:Envelope/s:Body/m:SyncFolderItemsResponse/m:ResponseMessages/m:SyncFolderItemsResponseMessage");
            var rm = xml2json.XPath(aResp, "/s:Envelope/s:Body/m:SyncFolderItemsResponse/m:ResponseMessages/m:SyncFolderItemsResponseMessage");
            if (rm.length > 0) {
                var ResponseCode = xml2json.getTagValue(rm[0], "m:ResponseCode");
            }
            else {
                var ResponseCode = "Unknown error from Exchange server.";
            }
            this.onSendError(aExchangeRequest, this.parent.ER_ERROR_SYNCFOLDERITEMS_UNKNOWN, "Error during SyncFolderItems:" + ResponseCode);
            rm = null;
            return;
        }

    },

    onSendError: function _onSendError(aExchangeRequest, aCode, aMsg) {
        //exchWebService.commonFunctions.LOG("onSendError aMsg:"+aMsg+"\n");
        this.isRunning = false;
        if (this.mCbError) {
            this.mCbError(this, aCode, aMsg);
        }
    },
};
