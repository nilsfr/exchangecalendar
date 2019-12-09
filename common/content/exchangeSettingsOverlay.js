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
var Cc = Components.classes;
var Ci = Components.interfaces;


ChromeUtils.import("resource://gre/modules/Services.jsm");

const { erAutoDiscoverRequest } = ChromeUtils.import("resource://exchangecommon/erAutoDiscover.js");
const { erAutoDiscoverySOAPRequest } = ChromeUtils.import("resource://exchangecommon/erAutoDiscoverySOAP.js");
const { erPrimarySMTPCheckRequest } = ChromeUtils.import("resource://exchangecommon/erPrimarySMTPCheck.js");
ChromeUtils.import("resource://exchangecommon/erConvertID.js");
ChromeUtils.import("resource://exchangecommon/erFindFolder.js");
const { erGetFolderRequest } = ChromeUtils.import("resource://exchangecommon/erGetFolder.js");
ChromeUtils.import("resource://exchangecommon/erGetUserAvailability.js");

ChromeUtils.import("resource://calendar/modules/calUtils.jsm");

function exchSettingsOverlay(aDocument, aWindow) {
    this._document = aDocument;
    this._window = aWindow;

    this.globalFunctions = new mivFunctions();
}

exchSettingsOverlay.prototype = {
    gexchWebServicesDetailsChecked: false,
    gexchWebServices2ndDetailsChecked: true,

    exchWebServicesgAutoDiscover: false,
    exchWebServicesgServer: "",
    exchWebServicesgMailbox: "",
    exchWebServicesgDisplayName: "",
    exchWebServicesgUser: "",
    exchWebServicesgDomain: "",
    exchWebServicesgFolderIdOfShare: "",
    exchWebServicesgFolderBase: "calendar",
    exchWebServicesgFolderPath: "/",
    exchWebServicesgFolderID: "",
    exchWebServicesgChangeKey: "",

    exchWebServicesValidUsernameDomain: function _exchWebServicesValidUsernameDomain() {
        return true;

        /*	if ((this._document.getElementById("exchWebService_windowsuser").value.indexOf("@") > -1) &&
        		(this._document.getElementById("exchWebService_windowsdomain").value == "")) {
        		return true;
        	}

        	if ((this._document.getElementById("exchWebService_windowsuser").value.indexOf("@") == -1) &&
        		(this._document.getElementById("exchWebService_windowsdomain").value != "")) {
        		return true;
        	}

        	return false; */
    },

    exchWebServicesCheckRequired: function _exchWebServicesCheckRequired() {

        if (!this.gexchWebServicesDetailsChecked) {
            this._document.getElementById("exchWebService_folderbaserow").hidden = true;
            this._document.getElementById("exchWebService_folderpathrow").hidden = true;
            this._document.getElementById("exchWebServices-SharedFolderID").hidden = true;
            this._document.getElementById("exchWebServices-UserAvailability").hidden = true;
        }

        if ((!this.gexchWebServices2ndDetailsChecked) || (!this.gexchWebServicesDetailsChecked)) {
            this._document.getElementById("exchWebService_detailschecked").setAttribute("required", true);
        }
        else {
            this._document.getElementById("exchWebService_detailschecked").setAttribute("required", false);
        }

        if (this._document.getElementById("exchWebService_autodiscover").checked) {

            this.exchWebServicesChangeFolderbaseMenuItemAvailability(false);

            this._document.getElementById("exchWebService_mailbox").setAttribute("required", true);
            this._document.getElementById("exchWebService_servercheckrow").hidden = true;

            if ((this._document.getElementById("exchWebService_mailbox").value == "")
                || (!this.exchWebServicesValidUsernameDomain())) {
                this._document.getElementById("exchWebService_autodiscovercheckrow").hidden = true;
                this._document.getElementById("exchWebService_serverandmailboxcheckrow").hidden = true;
            }
            else {
                this._document.getElementById("exchWebService_autodiscovercheckrow").hidden = false;
                this._document.getElementById("exchWebService_serverandmailboxcheckrow").hidden = true;
            }
            this._document.getElementById("exchWebService_server").disabled = true;
        }
        else {
            this._document.getElementById("exchWebService_mailbox").setAttribute("required", false);
            if (this._document.getElementById("exchWebService_mailbox").value == "") {

                if (this._document.getElementById("exchWebService_mailbox").value == "") {
                    this.exchWebServicesChangeFolderbaseMenuItemAvailability(true);
                    this._document.getElementById("menuitem.label.ecfolderbase.publicfoldersroot").disabled = false;
                }

                // No mailbox specified. We only do server check.
                if ((this._document.getElementById("exchWebService_server").value == "")
                    || (!this.exchWebServicesValidUsernameDomain())) {
                    this._document.getElementById("exchWebService_autodiscovercheckrow").hidden = true;
                    this._document.getElementById("exchWebService_serverandmailboxcheckrow").hidden = true;
                    this._document.getElementById("exchWebService_servercheckrow").hidden = true;
                }
                else {
                    this._document.getElementById("exchWebService_autodiscovercheckrow").hidden = true;
                    this._document.getElementById("exchWebService_serverandmailboxcheckrow").hidden = true;
                    this._document.getElementById("exchWebService_servercheckrow").hidden = false;
                }
            }
            else {
                this.exchWebServicesChangeFolderbaseMenuItemAvailability(false);

                // No mailbox specified. We do server and mailbox check
                // No mailbox specified. We only do server check.
                if ((this._document.getElementById("exchWebService_server").value == "")
                    || (!this.exchWebServicesValidUsernameDomain())) {
                    this._document.getElementById("exchWebService_autodiscovercheckrow").hidden = true;
                    this._document.getElementById("exchWebService_serverandmailboxcheckrow").hidden = true;
                    this._document.getElementById("exchWebService_servercheckrow").hidden = true;
                }
                else {
                    this._document.getElementById("exchWebService_autodiscovercheckrow").hidden = true;
                    this._document.getElementById("exchWebService_serverandmailboxcheckrow").hidden = false;
                    this._document.getElementById("exchWebService_servercheckrow").hidden = true;
                }
            }

            this._document.getElementById("exchWebService_server").disabled = false;
        }

        if (this.gexchWebServicesDetailsChecked) {
            this._document.getElementById("exchWebService_autodiscovercheckrow").hidden = true;
            this._document.getElementById("exchWebService_serverandmailboxcheckrow").hidden = true;
            this._document.getElementById("exchWebService_servercheckrow").hidden = true;

            this._document.getElementById("exchWebService_folderbaserow").hidden = (this.exchWebServicesgFolderIdOfShare != "");
            this._document.getElementById("exchWebService_folderpathrow").hidden = (this.exchWebServicesgFolderIdOfShare != "");

            this._document.getElementById("exchWebServices-SharedFolderID").hidden = (this.exchWebServicesgFolderIdOfShare == "");

        }

        // We determine which to use on the dialog id which is active for the current this._document.
        if (this._document.getElementById("exchWebService_ContactSettings_dialog")) { // Contact settings dialog.
            tmpExchangeContactSettings.checkRequired();
        }
        else {
            if (this._document.getElementById("exchWebService_ExchangeSettings_dialog")) { // EWS Settings dialog.
                tmpExchangeSettings.checkRequired();
            }
            else {
                if (this._document.getElementById("exchWebService_CloneSettings_dialog")) { // Clone Settings dialog.
                    tmpExchangeCloneSettings.checkRequired();
                }
                else {
                    try {
                        checkRequired(); // On creating a new calendar. Default Lightning create calendar wizard.
                    }
                    catch (ex) {
                        this.globalFunctions.LOG("NO checkRequired found.");
                    }
                }
            }
        }

        if (this._window) {
            this._window.sizeToContent();
        }
    },

    exchWebServicesAutodiscoverCheckbox: function _exchWebServicesAutodiscoverCheckbox(aCheckBox) {
        this.exchWebServicesgAutoDiscover = aCheckBox.checked;
        this.gexchWebServicesDetailsChecked = false;
        this.exchWebServicesCheckRequired();
    },

    exchWebServicesServerType: function _exchWebServicesServerType(radioGroup) {
        if (radioGroup.selectedIndex == 1) {
            this._document.getElementById("exchWebService_server").value = "https://outlook.office365.com/EWS/Exchange.asmx";
            this._document.getElementById("exchWebService_autodiscover").checked = false;
            this._document.getElementById("exchWebService_autodiscover").disabled = true;

            this.exchWebServicesgServer = this._document.getElementById("exchWebService_server").value;
            this.exchWebServicesgUser = this._document.getElementById("exchWebService_mailbox").value;
            this._document.getElementById("exchWebService_windowsuser").value = this.exchWebServicesgUser;
        }
        else {
            this._document.getElementById("exchWebService_server").value = "";
            this.exchWebServicesgServer = "";
            this._document.getElementById("exchWebService_windowsuser").value = "";
            this.exchWebServicesgUser = "";
            this._document.getElementById("exchWebService_autodiscover").checked = false;
            this._document.getElementById("exchWebService_autodiscover").disabled = false;
        }

        this.exchWebServicesCheckRequired();
    },

    exchWebServicesInitMailbox: function _exchWebServicesInitMailbox(aNewValue) {
        this.exchWebServicesgMailbox = aNewValue;
        this.gexchWebServicesDetailsChecked = false;
        this.exchWebServicesCheckRequired();
    },

    exchWebServicesDoMailboxChanged: function _exchWebServicesDoMailboxChanged(aTextBox) {
        this.exchWebServicesgMailbox = aTextBox.value;
        this._document.getElementById("exchWebService_displayname").value = "";
        this.exchWebServicesgDisplayName = "";
        this.gexchWebServicesDetailsChecked = false;
        this.exchWebServicesCheckRequired();
    },

    exchWebServicesDoUserChanged: function _exchWebServicesDoUserChanged(aTextBox) {
        this.exchWebServicesgUser = aTextBox.value;
        if ((this.exchWebServicesgUser.indexOf("@") > -1) || (this.exchWebServicesgUser.indexOf("\\") > -1)) {
            this._document.getElementById("exchWebService_windowsdomain").disabled = true;
            this._document.getElementById("exchWebService_windowsdomain").value = "";
            //this._document.getElementById("exchWebService_windowsdomain").setAttribute("required", false);
            this.exchWebServicesgDomain = "";

            if (this.exchWebServicesgUser.indexOf("\\") > -1) {
                var username = this.exchWebServicesgUser;
                this.exchWebServicesgUser = username.substr(0, username.indexOf("\\"));
                this.exchWebServicesgDomain = username.substr(username.indexOf("\\") + 1);
            }
        }
        else {
            this._document.getElementById("exchWebService_windowsdomain").disabled = false;
            //this._document.getElementById("exchWebService_windowsdomain").setAttribute("required", true);
        }

        this.gexchWebServicesDetailsChecked = false;
        this.exchWebServicesCheckRequired();
    },

    exchWebServicesDoDomainChanged: function _exchWebServicesDoDomainChanged(aTextBox) {
        this.exchWebServicesgDomain = aTextBox.value;
        this.gexchWebServicesDetailsChecked = false;
        this.exchWebServicesCheckRequired();
    },

    exchWebServicesDoFolderIdOfShareChanged: function _exchWebServicesDoFolderIdOfShareChanged(aTextBox) {
        this.exchWebServicesgFolderIdOfShare = aTextBox.value;
        this.gexchWebServicesDetailsChecked = false;
        this.exchWebServicesCheckRequired();
    },

    exchWebServicesDoServerChanged: function _exchWebServicesDoServerChanged(aTextBox) {
        this.exchWebServicesgServer = aTextBox.value;
        this.gexchWebServicesDetailsChecked = false;
        this.exchWebServicesCheckRequired();
    },

    // newStatus = true will disable folderbase menuitems
    // newStatus = false will enable all folderbase menuitems

    exchWebServicesChangeFolderbaseMenuItemAvailability: function _exchWebServicesChangeFolderbaseMenuItemAvailability(newStatus) {
        var menuItem = this._document.getElementById("menupopup.ecfolderbase").firstChild;
        while (menuItem) {
            if (!menuItem.hasAttribute("donotchange")) {
                menuItem.disabled = newStatus;
            }
            menuItem = menuItem.nextSibling;
        }

    },

    exchWebServicesDoFolderBaseChanged: function _exchWebServicesDoFolderBaseChanged(aMenuList) {
        this.exchWebServicesgFolderBase = aMenuList.value;

        // Reset folder path
        this._document.getElementById("exchWebService_folderpath").value = "/";
        this.exchWebServicesgFolderPath = "/";

        this.exchWebServicesgFolderID = "";
        this.exchWebServicesgChangeKey = "";

        if (this._document.getElementById("exchWebService_folderpath").value != "/") {
            this.gexchWebServices2ndDetailsChecked = false;
        }
        else {
            this.gexchWebServices2ndDetailsChecked = true;
        }
        this.exchWebServicesCheckRequired();
    },

    exchWebServicesGetUsername: function _exchWebServicesGetUsername() {
        if (this.exchWebServicesgUser.indexOf("@") > -1) {
            return this.exchWebServicesgUser;
        }
        else {
            if (this.exchWebServicesgDomain == "") {
                return this.exchWebServicesgUser;
            }
            else {
                return this.exchWebServicesgDomain + "\\" + this.exchWebServicesgUser;
            }
        }
    },

    exchWebServicesDoCheckServerAndMailbox: function _exchWebServicesDoCheckServerAndMailbox() {
        this._document.getElementById("exchWebService_serverandmailboxcheckbutton").disabled = true;

        var folderIdOfShare = this.exchWebServicesgFolderIdOfShare;

        var myAuthPrompt2 = (new (ChromeUtils.import("resource://exchangecommoninterfaces/exchangeAuthPrompt2/mivExchangeAuthPrompt2.js").mivExchangeAuthPrompt2)())
        myAuthPrompt2.removeUserCanceled(this.exchWebServicesgServer);

        try {
            this._window.setCursor("wait");
            var self = this;
            if ((folderIdOfShare) && (folderIdOfShare != "")) {
                var tmpObject = new erConvertIDRequest({
                        user: this.exchWebServicesGetUsername(),
                        mailbox: this.exchWebServicesgMailbox,
                        serverUrl: this.exchWebServicesgServer,
                        folderId: folderIdOfShare
                    },
                    function (aFolderID, aMailbox) {
                        self.exchWebServicesConvertIDOK(aFolderID, aMailbox);
                    },
                    function (aExchangeRequest, aCode, aMsg) {
                        self.exchWebServicesConvertIDError(aExchangeRequest, aCode, aMsg);
                    });
            }
            else {
                this.globalFunctions.LOG("exchWebServicesConvertIDOK: user:" + this.exchWebServicesGetUsername() + ", mailbox:" + this.exchWebServicesgMailbox);
                var tmpObject = new erPrimarySMTPCheckRequest({
                        user: this.exchWebServicesGetUsername(),
                        mailbox: this.exchWebServicesgMailbox,
                        serverUrl: this.exchWebServicesgServer,
                        folderBase: "calendar"
                    },
                    function (newPrimarySMTP) {
                        self.exchWebServicesCheckServerAndMailboxOK(newPrimarySMTP);
                    },
                    function (aExchangeRequest, aCode, aMsg) {
                        self.exchWebServicesCheckServerAndMailboxError(aExchangeRequest, aCode, aMsg);
                    });
            }
        }
        catch (err) {
            this._window.setCursor("auto");
            this.globalFunctions.ERROR("Warning: Error during creation of erPrimarySMTPCheckRequest. Err=" + err + "\n");
        }
    },

    exchWebServicesConvertIDOK: function _exchWebServicesConvertIDOK(aFolderID, aMailbox) {
        this.globalFunctions.LOG("exchWebServicesConvertIDOK: aFolderID:" + aFolderID + ", aMailbox:" + aMailbox);

        try {
            this._window.setCursor("wait");
            var self = this;
            var tmpObject = new erGetFolderRequest({
                    user: this.exchWebServicesGetUsername(),
                    mailbox: aMailbox,
                    serverUrl: this.exchWebServicesgServer,
                    folderID: aFolderID
                },
                function (aExchangeRequest, aFolderID, aChangeKey, aFolderClass) {
                    self.exchWebServicesGetFolderOK(aExchangeRequest, aFolderID, aChangeKey, aFolderClass);
                },
                function (aExchangeRequest, aCode, aMsg) {
                    self.exchWebServicesGetFolderError(aExchangeRequest, aCode, aMsg);
                });
        }
        catch (err) {
            this._window.setCursor("auto");
            this.globalFunctions.ERROR("Warning: Error during creation of erPrimarySMTPCheckRequest (2). Err=" + err + "\n");
        }
    },

    exchWebServicesConvertIDError: function _exchWebServicesConvertIDError(aExchangeRequest, aCode, aMsg) {
        this.gexchWebServicesDetailsChecked = false;
        switch (aCode) {
        case -20:
        case -30:
            break;
        case -6:
            alert(this.globalFunctions.getString("calExchangeCalendar", "ecErrorServerCheckURLInvalid", [this.exchWebServicesgServer], "exchangecommon"));
            break;
        default:
            alert(this.globalFunctions.getString("calExchangeCalendar", "ecErrorServerAndMailboxCheck", [aMsg, aCode], "exchangecommon"));
        }
        this._document.getElementById("exchWebService_serverandmailboxcheckbutton").disabled = false;
        this.exchWebServicesCheckRequired();
        this._window.setCursor("auto");
    },

    exchWebServicesGetFolderOK: function _exchWebServicesGetFolderOK(aExchangeRequest, aFolderID, aChangeKey, aFolderClass) {
        this.globalFunctions.LOG("exchWebServicesGetFolderOK: aFolderID:" + aFolderID + ", aChangeKey:" + aChangeKey + ", aFolderClass:" + aFolderClass);

        if (aFolderClass == "IPF.Appointment" || aFolderClass == "IPF.Task") {
            this.exchWebServicesgFolderID = aFolderID;
            this.exchWebServicesgChangeKey = aChangeKey;
            this.gexchWebServicesDetailsChecked = true;
            this.gexchWebServices2ndDetailsChecked = true;
            this._document.getElementById("exchWebServices-SharedFolderID-label").value = aExchangeRequest.displayName;
        }
        else {
            alert(this.globalFunctions.getString("calExchangeCalendar", "ecErrorServerAndMailboxCheck", [aMsg, aCode], "exchangecommon"));
        }

        this._document.getElementById("exchWebService_serverandmailboxcheckbutton").disabled = false;

        this.exchWebServicesCheckRequired();
        this._window.setCursor("auto");
    },

    exchWebServicesGetFolderError: function _exchWebServicesGetFolderError(aExchangeRequest, aCode, aMsg) {
        this.gexchWebServicesDetailsChecked = false;
        switch (aCode) {
        case -20:
        case -30:
            break;
        case -6:
            alert(this.globalFunctions.getString("calExchangeCalendar", "ecErrorServerCheckURLInvalid", [this.exchWebServicesgServer], "exchangecommon"));
            break;
        default:
            alert(this.globalFunctions.getString("calExchangeCalendar", "ecErrorServerAndMailboxCheck", [aMsg, aCode], "exchangecommon"));
        }
        this._document.getElementById("exchWebService_serverandmailboxcheckbutton").disabled = false;
        this.exchWebServicesCheckRequired();
        this._window.setCursor("auto");
    },

    exchWebServicesCheckServerAndMailboxOK: function _exchWebServicesCheckServerAndMailboxOK(newPrimarySMTP) {

        if (newPrimarySMTP) {
            this.exchWebServicesgMailbox = newPrimarySMTP
            this._document.getElementById("exchWebService_mailbox").value = newPrimarySMTP;
        }

        this.gexchWebServicesDetailsChecked = true;
        this._document.getElementById("exchWebService_serverandmailboxcheckbutton").disabled = false;

        this.exchWebServicesCheckRequired();
        this._window.setCursor("auto");
    },

    exchWebServicesCheckServerAndMailboxError: function _exchWebServicesCheckServerAndMailboxError(aExchangeRequest, aCode, aMsg) {
        this.globalFunctions.LOG("exchWebServicesCheckServerAndMailboxError: aCode:" + aCode + ", aMsg:" + aMsg);
        this.gexchWebServicesDetailsChecked = false;
        switch (aCode) {
        case -20:
        case -30:
            break;
        case -6:
            alert(this.globalFunctions.getString("calExchangeCalendar", "ecErrorServerCheckURLInvalid", [this.exchWebServicesgServer], "exchangecommon"));
            break;
        case -7:
        case -208: // folderNotFound. 
            this.checkUserAvailability();
            return;
        case -212:
            aMsg = aMsg + "(" + this.exchWebServicesgMailbox + ")";
        default:
            alert(this.globalFunctions.getString("calExchangeCalendar", "ecErrorServerAndMailboxCheck", [aMsg, aCode], "exchangecommon"));
        }
        this._document.getElementById("exchWebService_serverandmailboxcheckbutton").disabled = false;
        this.exchWebServicesCheckRequired();
        this._window.setCursor("auto");
    },

    // Check if we can get useravailability
    checkUserAvailability: function _checkUserAvailability() {
        this.globalFunctions.LOG("checkUserAvailability");
        var self = this;

        var start = cal.dtz.now();
        var offset = cal.createDuration();
        offset.hours = 10;
        var end = start.clone();
        end.addDuration(offset);

        var tmpObject = new erGetUserAvailabilityRequest({
                user: this.exchWebServicesGetUsername(),
                mailbox: this.exchWebServicesgMailbox,
                serverUrl: this.exchWebServicesgServer,
                folderBase: "calendar",
                email: this.exchWebServicesgMailbox,
                attendeeType: 'Required',
                start: cal.dtz.toRFC3339(start),
                end: cal.dtz.toRFC3339(end)
            },
            function (erGetUserAvailabilityRequest, aEvents) {
                self.checkUserAvailabilityOk(erGetUserAvailabilityRequest, aEvents);
            },
            function (erGetUserAvailabilityRequest, aCode, aMsg) {
                self.checkUserAvailabilityError(erGetUserAvailabilityRequest, aCode, aMsg);
            });

    },

    checkUserAvailabilityOk: function _checkUserAvailabilityOk(erGetUserAvailabilityRequest, aEvents) {
        this.globalFunctions.LOG("checkUserAvailabilityOk");
        this.exchWebServicesCheckServerAndMailboxOK();
        this._document.getElementById("exchWebService_folderbaserow").hidden = true;
        this._document.getElementById("exchWebService_folderpathrow").hidden = true;
        this._document.getElementById("exchWebServices-UserAvailability").hidden = false;
    },

    checkUserAvailabilityError: function _checkUserAvailabilityError(erGetUserAvailabilityRequest, aCode, aMsg) {
        this.globalFunctions.LOG("checkUserAvailabilityError");
        this.gexchWebServicesDetailsChecked = false;

        alert(this.globalFunctions.getString("calExchangeCalendar", "ecErrorServerAndMailboxCheck", [aMsg, aCode], "exchangecommon"));

        this._document.getElementById("exchWebService_serverandmailboxcheckbutton").disabled = false;
        this.exchWebServicesCheckRequired();
        this._window.setCursor("auto");
    },

    exchWebServicesDoCheckServer: function _exchWebServicesDoCheckServer() {
        this._document.getElementById("exchWebService_servercheckbutton").disabled = true;


        try {
            this._window.setCursor("wait");
            var self = this;
            var tmpObject = new erGetFolderRequest({
                    user: this.exchWebServicesGetUsername(),
                    mailbox: "",
                    folderBase: "publicfoldersroot",
                    folderPath: "/",
                    serverUrl: this.exchWebServicesgServer
                },
                function (folderID, changeKey, folderClass) {
                    self.exchWebServicesCheckServerOK(folderID, changeKey, folderClass);
                },
                function (aExchangeRequest, aCode, aMsg) {
                    self.exchWebServicesCheckServerError(aExchangeRequest, aCode, aMsg);
                })
        }
        catch (err) {
            this._window.setCursor("auto");
            this.globalFunctions.ERROR("Warning: Error during creation of erGetFolderRequest. Err=" + err + "\n");
            throw err;
        }
    },

    exchWebServicesCheckServerOK: function _exchWebServicesCheckServerOK(folderID, changeKey, folderClass) {

        this.gexchWebServicesDetailsChecked = true;
        this._document.getElementById("exchWebService_servercheckbutton").disabled = false;
        //	exchWebServicesChangeFolderbaseMenuItemAvailability(true);
        //	this._document.getElementById("menuitem.label.ecfolderbase.publicfoldersroot").disabled = false;

        if (this.exchWebServicesgFolderBase != "publicfoldersroot") {
            this.exchWebServicesgFolderBase = "publicfoldersroot";
            this._document.getElementById("exchWebService_folderbase").value = "publicfoldersroot";
            this._document.getElementById("exchWebService_folderpath").value = "/";
        }

        this.exchWebServicesCheckRequired();
        this._window.setCursor("auto");
    },

    exchWebServicesCheckServerError: function _exchWebServicesCheckServerError(aExchangeRequest, aCode, aMsg) {
        this.globalFunctions.LOG("exchWebServicesCheckServerError");
        this.gexchWebServicesDetailsChecked = false;
        switch (aCode) {
        case -20:
        case -30:
            break;
        case -6:
            alert(this.globalFunctions.getString("calExchangeCalendar", "ecErrorServerCheckURLInvalid", [this.exchWebServicesgServer], "exchangecommon"));
            break;
        default:
            alert(this.globalFunctions.getString("calExchangeCalendar", "ecErrorServerCheck", [aMsg, aCode], "exchangecommon"));
        }
        this._document.getElementById("exchWebService_servercheckbutton").disabled = false;

        //	exchWebServicesChangeFolderbaseMenuItemAvailability(false);

        this.exchWebServicesCheckRequired();
        this._window.setCursor("auto");
    },

    exchAutoDiscovery2010: true,

    exchWebServicesDoAutodiscoverCheck: function _exchWebServicesDoAutodiscoverCheck() {
        this._document.getElementById("exchWebService_autodiscovercheckbutton").disabled = true;

        try {
            this._window.setCursor("wait");
            this.exchAutoDiscovery2010 = true; // We first try Autodiscovery for Exchange2010 and higher.
            var self = this;
            var tmpObject = new erAutoDiscoverySOAPRequest({
                    user: this.exchWebServicesGetUsername(),
                    mailbox: this.exchWebServicesgMailbox
                },
                function (ewsUrls, DisplayName, SMTPAddress, redirectAddr) {
                    self.exchWebServicesAutodiscoveryOK(ewsUrls, DisplayName, SMTPAddress, redirectAddr);
                },
                function (aExchangeRequest, aCode, aMsg) {
                    self.exchWebServicesAutodiscoveryError(aExchangeRequest, aCode, aMsg);
                }, null);
        }
        catch (err) {
            this._window.setCursor("auto");
            this.globalFunctions.ERROR("Warning: Could not create erAutoDiscoverRequest. Err=" + err + "\n");
        }
    },

    exchWebServicesAutodiscoveryOK: function _exchWebServicesAutodiscoveryOK(ewsUrls, DisplayName, SMTPAddress, redirectAddr) {
        this.globalFunctions.LOG("ecAutodiscoveryOK");

        if (redirectAddr) {
            // We have an redirectAddr. Go use the new email address as primary.
            this.globalFunctions.LOG("ecAutodiscoveryOK: We received an redirectAddr:" + redirectAddr);
            this.exchWebServicesgMailbox = redirectAddr;
            this._document.getElementById("exchWebService_mailbox").value = redirectAddr;
            this.exchWebServicesDoAutodiscoverCheck();
            return;
        }

        var selectedEWSUrl = {
            value: undefined
        };
        var userCancel = false;

        if (ewsUrls) {
            if (ewsUrls.length > 1) {
                // We have got multiple ews urls returned. Let the user choose.

                this._window.openDialog("chrome://exchangecommon/content/selectEWSUrl.xul",
                    "selectfrommultipleews",
                    "chrome,titlebar,toolbar,centerscreen,dialog,modal=yes,resizable=no",
                    ewsUrls, selectedEWSUrl);

                if ((!selectedEWSUrl.value) || (selectedEWSUrl.value == "")) {
                    this.globalFunctions.LOG("  ++++ Selection canceled by user");
                    userCancel = true;
                }
            }
            else {
                // We only have one url. Use it.
                selectedEWSUrl.value = ewsUrls[0].value;
            }
        }

        if (!userCancel) {
            this.exchWebServicesgDisplayName = DisplayName;
            this._document.getElementById("exchWebService_displayname").value = DisplayName;

            if ((SMTPAddress) && (SMTPAddress != '')) {
                this.exchWebServicesgMailbox = SMTPAddress;
                this._document.getElementById("exchWebService_mailbox").value = SMTPAddress;
            }

            this.exchWebServicesgServer = selectedEWSUrl.value;
            this._document.getElementById("exchWebService_server").value = selectedEWSUrl.value;

            //this.gexchWebServicesDetailsChecked = true;
            this._document.getElementById("exchWebService_autodiscovercheckbutton").disabled = false;
            this._document.getElementById("exchWebService_autodiscover").checked = false;

            this._document.getElementById("exchWebService_serverandmailboxcheckbutton").disabled = true;
            this.exchWebServicesDoCheckServerAndMailbox();
            return;

        }
        else {
            this._document.getElementById("exchWebService_autodiscovercheckbutton").disabled = false;
        }

        this.exchWebServicesCheckRequired();
        this._window.setCursor("auto");
    },

    exchWebServicesAutodiscoveryError: function _exchWebServicesAutodiscoveryError(aExchangeRequest, aCode, aMsg) {
        this.globalFunctions.LOG("ecAutodiscoveryError. aCode:" + aCode + ", aMsg:" + aMsg);

        if ((this.exchAutoDiscovery2010 == true) && (aCode != -20)) {
            this.globalFunctions.LOG("exchWebServicesAutodiscoveryError: Going to try old POX autodiscovery as SOAP autodiscovery did not succeed.");
            this.exchAutoDiscovery2010 = false; // AutoDiscovery for Exchange2010 and higher failed. Next try old POX Autodiscovery.

            try {
                var self = this;
                var tmpObject = new erAutoDiscoverRequest({
                        user: this.exchWebServicesGetUsername(),
                        mailbox: this.exchWebServicesgMailbox
                    },
                    function (ewsUrls, DisplayName, SMTPAddress, redirectAddr) {
                        self.exchWebServicesAutodiscoveryOK(ewsUrls, DisplayName, SMTPAddress, redirectAddr);
                    },
                    function (aExchangeRequest, aCode, aMsg) {
                        self.exchWebServicesAutodiscoveryError(aExchangeRequest, aCode, aMsg);
                    }, null);
                return;
            }
            catch (err) {
                this._window.setCursor("auto");
                this.globalFunctions.ERROR("Warning: Could not create erAutoDiscoverRequest. Err=" + err + "\n");
                return;
            }
        }

        switch (aCode) {
        case -20:
        case -30:
            break;
        case -6:
        case -9:
        case -10:
        case -14:
        case -15:
        case -16:
        case -17:
        case -18:
            alert(this.globalFunctions.getString("calExchangeCalendar", "ecErrorAutodiscoveryURLInvalid", [this.exchWebServicesgMailbox], "exchangecommon"));
            break;
        default:
            alert(this.globalFunctions.getString("calExchangeCalendar", "ecErrorAutodiscovery", [aMsg, aCode], "exchangecommon"));
        }

        this._document.getElementById("exchWebService_autodiscovercheckbutton").disabled = false;
        this.exchWebServicesCheckRequired();
        this._window.setCursor("auto");
    },

    exchWebServicesLoadExchangeSettingsByCalId: function _exchWebServicesLoadExchangeSettingsByCalId(aCalId) {
        var exchWebServicesCalPrefs = Cc["@mozilla.org/preferences-service;1"]
            .getService(Ci.nsIPrefService)
            .getBranch("extensions.exchangecalendar@extensions.1st-setup.nl." + aCalId + ".");

        if (exchWebServicesCalPrefs) {
            this._document.getElementById("exchWebService_server").value =
                exchWebServicesCalPrefs.getStringPref("ecServer");
            this._document.getElementById("exchWebService_windowsuser").value =
                exchWebServicesCalPrefs.getStringPref("ecUser");
            if (this._document.getElementById("exchWebService_windowsuser").value.indexOf("@") > -1) {
                //this._document.getElementById("exchWebService_windowsdomain").setAttribute("required", false);
                this._document.getElementById("exchWebService_windowsdomain").disabled = true;
            }
            this._document.getElementById("exchWebService_windowsdomain").value =
                exchWebServicesCalPrefs.getStringPref("ecDomain");
            this._document.getElementById("exchWebService_folderpath").value =
                exchWebServicesCalPrefs.getStringPref("ecFolderpath");

            for (var i = 0; i < this._document.getElementById("exchWebService_folderbase").itemCount; i++) {
                if (this._document.getElementById("exchWebService_folderbase").getItemAtIndex(i).value ==
                    exchWebServicesCalPrefs.getStringPref("ecFolderbase")) {
                    this._document.getElementById("exchWebService_folderbase").selectedIndex = i;
                }
            }
            this._document.getElementById("exchWebService_mailbox").value =
                exchWebServicesCalPrefs.getStringPref("ecMailbox");
            if (this._document.getElementById("exchWebService_mailbox").value == "") {
                this.exchWebServicesChangeFolderbaseMenuItemAvailability(true);
                this._document.getElementById("menuitem.label.ecfolderbase.publicfoldersroot").disabled = false;
            }



            this.exchWebServicesgServer = exchWebServicesCalPrefs.getStringPref("ecServer");
            this.exchWebServicesgUser = exchWebServicesCalPrefs.getStringPref("ecUser");
            this.exchWebServicesgDomain = exchWebServicesCalPrefs.getStringPref("ecDomain");

            this.exchWebServicesgFolderBase = exchWebServicesCalPrefs.getStringPref("ecFolderbase");
            this.exchWebServicesgFolderPath = exchWebServicesCalPrefs.getStringPref("ecFolderpath");
            this.exchWebServicesgMailbox = exchWebServicesCalPrefs.getStringPref("ecMailbox");
            try {
                this.exchWebServicesgFolderID = exchWebServicesCalPrefs.getStringPref("ecFolderID");
            }
            catch (err) {
                this.exchWebServicesgFolderID = "";
            }
            try {
                this.exchWebServicesgChangeKey = exchWebServicesCalPrefs.getStringPref("ecChangeKey");
            }
            catch (err) {
                this.exchWebServicesgChangeKey = "";
            }
            try {
                this.exchWebServicesgFolderIdOfShare = exchWebServicesCalPrefs.getStringPref("ecFolderIDOfShare");
                this._document.getElementById("exchWebService_folderidofshare").value = this.exchWebServicesgFolderIdOfShare;
            }
            catch (err) {
                this.exchWebServicesgFolderIdOfShare = "";
            }
        }

        this.gexchWebServicesDetailsChecked = true;
        this.gexchWebServices2ndDetailsChecked = true;

        this.exchWebServicesCheckRequired();
    },

    exchWebServicesSaveExchangeSettingsByCalId: function _exchWebServicesSaveExchangeSettingsByCalId(aCalId) {
        var exchWebServicesCalPrefs = Cc["@mozilla.org/preferences-service;1"]
            .getService(Ci.nsIPrefService)
            .getBranch("extensions.exchangecalendar@extensions.1st-setup.nl." + aCalId + ".");

        if (exchWebServicesCalPrefs) {
            exchWebServicesCalPrefs.setStringPref("ecServer", this.exchWebServicesgServer);
            exchWebServicesCalPrefs.setStringPref("ecUser", this.exchWebServicesgUser);
            exchWebServicesCalPrefs.setStringPref("ecDomain", this.exchWebServicesgDomain);
            exchWebServicesCalPrefs.setStringPref("ecFolderpath", this.exchWebServicesgFolderPath);
            exchWebServicesCalPrefs.setStringPref("ecFolderbase", this.exchWebServicesgFolderBase);
            exchWebServicesCalPrefs.setStringPref("ecMailbox", this.exchWebServicesgMailbox);
        }

        if ((this.exchWebServicesgFolderPath == "/") && (this.exchWebServicesgFolderIdOfShare == "")) {
            this.exchWebServicesgFolderID = "";
            this.exchWebServicesgChangeKey = "";
        }
        exchWebServicesCalPrefs.setStringPref("ecFolderID", this.exchWebServicesgFolderID);
        exchWebServicesCalPrefs.setStringPref("ecChangeKey", this.exchWebServicesgChangeKey);

        exchWebServicesCalPrefs.setStringPref("ecFolderIDOfShare", this.exchWebServicesgFolderIdOfShare);

    },

    exchWebServicesDoFolderBrowse: function _exchWebServicesDoFolderBrowse() {
        var input = {
            answer: "",
            parentFolder: {
                user: this.exchWebServicesGetUsername(),
                mailbox: this.exchWebServicesgMailbox,
                folderBase: this.exchWebServicesgFolderBase,
                serverUrl: this.exchWebServicesgServer,
                folderID: null,
                changeKey: null
            }
        };

        this._window.openDialog("chrome://exchangecommon/content/browseFolder.xul",
            "browseFolder",
            "chrome,titlebar,toolbar,centerscreen,dialog,modal=yes,resizable=no",
            input);

        if (input.answer == "select") {
            this._document.getElementById("exchWebService_folderpath").value = input.fullPath;
            this.exchWebServicesgFolderPath = input.fullPath;

            this.gexchWebServices2ndDetailsChecked = true;

            if (input.fullPath == "/") {
                this.exchWebServicesgFolderID = "";
                this.exchWebServicesgChangeKey = "";
            }
            else {
                this.exchWebServicesgFolderID = input.selectedFolder.folderID;
                this.exchWebServicesgChangeKey = input.selectedFolder.changeKey;
            }
            this.exchWebServicesCheckRequired();
        }
    },

    exchWebServicesLoadExchangeSettingsByContactUUID: function _exchWebServicesLoadExchangeSettingsByContactUUID(aUUID) {
        var exchWebServicesCalPrefs = Cc["@mozilla.org/preferences-service;1"]
            .getService(Ci.nsIPrefService)
            .getBranch("extensions.exchangecontacts@extensions.1st-setup.nl.account." + aUUID + ".");

        if (exchWebServicesCalPrefs) {

            this._document.getElementById("exchWebService_contact_description").value =
                exchWebServicesCalPrefs.getStringPref("description");
            this._document.getElementById("exchWebService_mailbox").value =
                exchWebServicesCalPrefs.getStringPref("mailbox");
            if (this._document.getElementById("exchWebService_mailbox").value == "") {
                this.exchWebServicesChangeFolderbaseMenuItemAvailability(true);
                this._document.getElementById("menuitem.label.ecfolderbase.publicfoldersroot").disabled = false;
            }

            this._document.getElementById("exchWebService_server").value =
                exchWebServicesCalPrefs.getStringPref("server");
            this._document.getElementById("exchWebService_windowsuser").value =
                exchWebServicesCalPrefs.getStringPref("user");
            if (this._document.getElementById("exchWebService_windowsuser").value.indexOf("@") > -1) {
                //this._document.getElementById("exchWebService_windowsdomain").setAttribute("required", false);
                this._document.getElementById("exchWebService_windowsdomain").disabled = true;
            }
            this._document.getElementById("exchWebService_windowsdomain").value =
                exchWebServicesCalPrefs.getStringPref("domain");

            this._document.getElementById("exchWebService_folderpath").value =
                exchWebServicesCalPrefs.getStringPref("folderpath");

            for (var i = 0; i < this._document.getElementById("exchWebService_folderbase").itemCount; i++) {
                if (this._document.getElementById("exchWebService_folderbase").getItemAtIndex(i).value ==
                    exchWebServicesCalPrefs.getStringPref("folderbase")) {
                    this._document.getElementById("exchWebService_folderbase").selectedIndex = i;
                    break;
                }
            }

            this.exchWebServicesgServer = exchWebServicesCalPrefs.getStringPref("server");
            this.exchWebServicesgUser = exchWebServicesCalPrefs.getStringPref("user");
            this.exchWebServicesgDomain = exchWebServicesCalPrefs.getStringPref("domain");

            this.exchWebServicesgFolderBase = exchWebServicesCalPrefs.getStringPref("folderbase");
            this.exchWebServicesgFolderPath = exchWebServicesCalPrefs.getStringPref("folderpath");
            this.exchWebServicesgMailbox = exchWebServicesCalPrefs.getStringPref("mailbox");
            try {
                this.exchWebServicesgFolderID = exchWebServicesCalPrefs.getStringPref("folderid");
            }
            catch (err) {
                this.exchWebServicesgFolderID = "";
            }
            try {
                this.exchWebServicesgChangeKey = exchWebServicesCalPrefs.getStringPref("changekey");
            }
            catch (err) {
                this.exchWebServicesgChangeKey = "";
            }
            try {
                this.exchWebServicesgFolderIdOfShare = exchWebServicesCalPrefs.getStringPref("folderIDOfShare");
                this._document.getElementById("exchWebService_folderidofshare").value = this.exchWebServicesgFolderIdOfShare;
            }
            catch (err) {
                this.exchWebServicesgFolderIdOfShare = "";
            }
        }

        this.gexchWebServicesDetailsChecked = true;
        this.gexchWebServices2ndDetailsChecked = true;

        this.exchWebServicesCheckRequired();
    },

    exchWebServicesSaveExchangeSettingsByContactUUID: function _exchWebServicesSaveExchangeSettingsByContactUUID(isNewDirectory, aUUID) {

        if (!isNewDirectory) {
            var exchWebServicesCalPrefs = Cc["@mozilla.org/preferences-service;1"]
                .getService(Ci.nsIPrefService)
                .getBranch("extensions.exchangecontacts@extensions.1st-setup.nl.account." + aUUID + ".");
        }

        if ((exchWebServicesCalPrefs) && (!isNewDirectory)) {
            exchWebServicesCalPrefs.setStringPref(
                "description",
                this._document.getElementById("exchWebService_contact_description").value
            );
            exchWebServicesCalPrefs.setStringPref("server", this.exchWebServicesgServer);
            exchWebServicesCalPrefs.setStringPref("user", this.exchWebServicesgUser);
            exchWebServicesCalPrefs.setStringPref("domain", this.exchWebServicesgDomain);
            exchWebServicesCalPrefs.setStringPref("folderpath", this.exchWebServicesgFolderPath);
            this.globalFunctions.LOG("exchWebServicesSaveExchangeSettingsByContactUUID: folderbase:" + this.exchWebServicesgFolderBase);
            exchWebServicesCalPrefs.setStringPref("folderbase", this.exchWebServicesgFolderBase);
            exchWebServicesCalPrefs.setStringPref("mailbox", this.exchWebServicesgMailbox);
        }

        if (this.exchWebServicesgFolderPath == "/") {
            this.exchWebServicesgFolderID = "";
            this.exchWebServicesgChangeKey = "";
        }

        if (!isNewDirectory) {
            exchWebServicesCalPrefs.setStringPref("folderid", this.exchWebServicesgFolderID);
            exchWebServicesCalPrefs.setStringPref("changekey", this.exchWebServicesgChangeKey);
            exchWebServicesCalPrefs.setStringPref("folderIDOfShare", this.exchWebServicesgFolderIdOfShare);
        }

        return {
            description: this._document.getElementById("exchWebService_contact_description").value,
            mailbox: this.exchWebServicesgMailbox,
            user: this.exchWebServicesgUser,
            domain: this.exchWebServicesgDomain,
            serverUrl: this.exchWebServicesgServer,
            folderBase: this.exchWebServicesgFolderBase,
            folderPath: this.exchWebServicesgFolderPath,
            folderID: this.exchWebServicesgFolderID,
            changeKey: this.exchWebServicesgChangeKey,
            folderIDOfShare: this.exchWebServicesgFolderIdOfShare
        };
    },
}
var tmpSettingsOverlay = new exchSettingsOverlay(document, window);
