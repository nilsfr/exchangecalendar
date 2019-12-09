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
 * Author: Michel Verbraak (info@1st-setup.nl)
 * Website: http://www.1st-setup.nl/
 *
 * This interface/service is used for loadBalancing Request to Exchange
 *
 * ***** BEGIN LICENSE BLOCK *****/

var Cc = Components.classes;
var Ci = Components.interfaces;

var Cr = Components.results;

var EXPORTED_SYMBOLS = ["mivExchangeAuthPromptProvider"];

var { XPCOMUtils } = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
var { cal } = ChromeUtils.import("resource://calendar/modules/calUtils.jsm");

function mivExchangeAuthPromptProvider() {
    //dump("\nmivExchangeAuthPromptProvider.init\n");
    this.globalFunctions = (new (ChromeUtils.import("resource://exchangecommoninterfaces/global/mivFunctions.js").mivFunctions)());
}

mivExchangeAuthPromptProvider.prototype = {
    classID: mivExchangeAuthPromptProviderGUID,
    // Attributes from nsIClassInfo
    classInfo: cal.generateCI({
        classDescription: "Exchange Add-on AuthPromptProvider interface",
        classID: mivExchangeAuthPromptProviderGUID,
        contractID: "@1st-setup.nl/exchange/authpromptprovider;1",
        interfaces: [Ci.nsIAuthPromptProvider]
    }),
    flags: Ci.nsIClassInfo.SINGLETON || Ci.nsIClassInfo.THREADSAFE,

    // External methods

    //void getAuthPrompt(in PRUint32 aPromptReason, in nsIIDRef iid, [iid_is(iid),retval] out nsQIResult result);
    getAuthPrompt: function _nsIAuthPromptProvider_getAuthPrompt(aPromptReason, iid) {
        this.logInfo("  --- mivExchangeAuthPromptProvider.getAuthPrompt:aPromptReason:" + aPromptReason + ", iid:" + iid);
        if (iid.equals(Ci.nsIAuthPrompt2)) { // id == 651395eb-8612-4876-8ac0-a88d4dce9e1e
            this.logInfo("  --- ecnsIAuthPrompt2.getAuthPrompt: iid=nsIAuthPrompt2");
            return (new (ChromeUtils.import("resource://exchangecommoninterfaces/exchangeAuthPrompt2/mivExchangeAuthPrompt2.js").mivExchangeAuthPrompt2)());
        }

        this.logInfo("  --- mivExchangeAuthPromptProvider.getAuthPrompt:aPromptReason:" + aPromptReason + ", iid:" + iid);
        this.globalFunctions.LOG("  >>>>>>>>>>> SUBMIT THIS LINE TO https://github.com/ExchangeCalendar/exchangecalendar/issues: ecnsIAuthPrompt2.getAuthPrompt(" + iid + ")");

        return Cr.NS_ERROR_NOT_AVAILABLE;
    },

    // Internal methods.

    logInfo: function _logInfo(aMsg, aDebugLevel) {
        var prefB = Cc["@mozilla.org/preferences-service;1"]
            .getService(Ci.nsIPrefBranch);

        this.debug = this.globalFunctions.safeGetBoolPref(prefB, "extensions.1st-setup.authentication.debug", false, true);
        if (this.debug) {
            this.globalFunctions.LOG("mivExchangeAuthPromptProvider: " + aMsg);
        }
    },

}
