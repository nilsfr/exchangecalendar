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
 * -- Exchange 2007/2010 Contacts.
 * -- For Thunderbird.
 *
 * Author: Michel Verbraak (info@1st-setup.nl)
 * Website: http://www.1st-setup.nl/wordpress/?page_id=xx
 * email: exchangecontacts@extensions.1st-setup.nl
 *
 *
 * ***** BEGIN LICENSE BLOCK *****/
var Ci = Components.interfaces;

var Cr = Components.results;

ChromeUtils.import("resource://gre/modules/Services.jsm");
ChromeUtils.import("resource:///modules/mailServices.js");
ChromeUtils.import("resource:///modules/iteratorUtils.jsm");

const { exchWebService } = ChromeUtils.import("resource://exchangecommon/ecFunctions.js");
ChromeUtils.import("resource://exchangeaddress/exchangeAbFunctions.js");


function exchangeAbDirFactory() {}

exchangeAbDirFactory.prototype = {

    classID: Components.ID("{e6f8074c-0236-4f51-b8e2-9c528727b4ee}"),
    contractID: "@mozilla.org/addressbook/directory-factory;1?name=exchangecalendar-addressbook",
    classDescription: "Exchange 2007/2010 Contacts DirFactory",


    getDirectories: function _getDirectories(aDirName, aURI, aPrefName) {
        exchWebService.commonAbFunctions.logInfo("getDirectories aDirName:" + aDirName + ", aUri:" + aURI + ", aPrefName:" + aPrefName + "\n");

        var accounts = exchWebService.commonAbFunctions.getAccounts();

        let result = [];
        var dir;

        // Add the root directory.
        var parentDir = MailServices.ab.getDirectory(aURI);
        result.push(parentDir);

        return exchWebService.commonFunctions.CreateSimpleEnumerator(result);
    },

    deleteDirectory: function (aDirectory) {
        // Currently unsupported.  Alert the user and bail out.
        exchWebService.commonAbFunctions.logInfo("deleteDirectory uri");
        exchWebService.commonAbFunctions.logInfo("Attempted to delete an EDS directory, which is currently"
            + " an unsupported action.");
        throw Cr.NS_ERROR_NOT_IMPLEMENTED;
    },
}
