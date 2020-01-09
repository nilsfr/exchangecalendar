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

var Ci = Components.interfaces;
var Cu = Components.utils;

ChromeUtils.import("resource://gre/modules/Services.jsm");

ChromeUtils.import("resource:///modules/mailServices.js");

function mivExchangeAutoCompleteResult() {
    // _cards contain all Cards in value and are fetchable by localid as key
    this._cards = new Object();
    // _idcards keeps localids sorted by order of arrival
    this._idcards = new Array();
}

var mivExchangeAutoCompleteResultGUID = "64587912-6dc2-413c-93ad-f062e21feaeb";

mivExchangeAutoCompleteResult.prototype = {

    _searchString: "",
    _searchResult: this.RESULT_NOMATCH_ONGOING,

    classDescription: "Exchange Autocomplete Search Result",

    classID: Components.ID("{" + mivExchangeAutoCompleteResultGUID + "}"),
    contractID: "@1st-setup.nl/exchange/autocompleteresult;1",
    flags: Ci.nsIClassInfo.THREADSAFE,

    getInterfaces: function _getInterfaces(count) {
        var ifaces = [Ci.mivExchangeAutoCompleteResult,
            Ci.nsIAutoCompleteResult,
            Ci.nsIClassInfo,
            Ci.nsISupports
        ];
        count.value = ifaces.length;
        return ifaces;
    },

    getHelperForLanguage: function _getHelperForLanguage(language) {
        return null;
    },

    /**
     * Possible values for the searchResult attribute
     */
    //  const unsigned short RESULT_IGNORED = 1; /* indicates invalid searchString */
    //  const unsigned short RESULT_FAILURE = 2; /* indicates failure */
    //  const unsigned short RESULT_NOMATCH = 3; /* indicates success with no matches
    //                                              and that the search is complete */
    //  const unsigned short RESULT_SUCCESS = 4; /* indicates success with matches
    //                                              and that the search is complete */
    //  const unsigned short RESULT_NOMATCH_ONGOING = 5; /* indicates success 
    //                                                      with no matches
    //                                                      and that the search 
    //                                                      is still ongoing */
    //  const unsigned short RESULT_SUCCESS_ONGOING = 6; /* indicates success 
    //                                                      with matches
    //                                                      and that the search 
    //                                                      is still ongoing */
    /**
     * The original search string
     */
    //readonly attribute AString searchString;
    get searchString() {
        return this._searchString;
    },

    setSearchString: function _setSearchString(aString) {
        this._searchString = aString;
    },

    /**
     * The result of the search
     */
    //readonly attribute unsigned short searchResult;
    get searchResult() {
        return this._searchResult;
    },

    setSearchResult: function _setSearchResult(aValue) {
        this._searchResult = aValue;
    },

    /**
     * Index of the default item that should be entered if none is selected
     */
    //readonly attribute long defaultIndex;
    get defaultIndex() {
        // by default index is always 0, except if the _idcards has not any elements
        return this._idcards.length ? 0 : -1;
    },

    /**
     * A string describing the cause of a search failure
     */
    //readonly attribute AString errorDescription;
    get errorDescription() {
        return null;
    },

    /**
     * The number of matches
     */
    //readonly attribute unsigned long matchCount;
    get matchCount() {
        return this._idcards.length;
    },

    /**
     * If true, the results will not be displayed in the popup. However,
     * if a default index is specified, the default item will still be
     * completed in the input.
     */
    //readonly attribute boolean typeAheadResult;
    get typeAheadResult() {
        return this._idcards.length <= 1;
    },

    /**
     * Get the value of the result at the given index
     */
    //AString getValueAt(in long index);
    // The returned value is used to fill the publicly readable "TO:" mail header
    getValueAt: function _getValueAt(aIndex) {

        var localid = this._idcards[aIndex];
        var card = this._cards[localid];
        var result = "";

        if (card.isMailList && card.primaryEmail.indexOf("@") == -1) {

            var dir = MailServices.ab.getDirectory(card.mailListURI);

            if (dir) {
                var emailList = "";
                var childNodes = dir.childCards;
                while (childNodes.hasMoreElements()) {
                    if (emailList != "") {
                        emailList = emailList + ",";
                    }
                    var tmpCard = childNodes.getNext().QueryInterface(Ci.mivExchangeAbCard);
                    emailList = emailList + tmpCard.firstName + " " + tmpCard.lastName + " <" + tmpCard.primaryEmail + ">";
                }
                result = emailList;
            }
        }
        else if (card.displayName != "") {
            result = card.displayName + " <" + card.primaryEmail + ">";
        }
        else if (card.firstName != "" || card.lastName != "") {
            result = card.firstName + " " + card.lastName + " <" + card.primaryEmail + ">";
        }
        else {
            result = card.primaryEmail;
        }

        return result;
    },

    /**
     * This returns the string that is displayed in the dropdown
     */
    //AString getLabelAt(in long index);
    getLabelAt: function _getLabelAt(aIndex) {
        return this.getValueAt(aIndex);
    },

    /**
     * Get the comment of the result at the given index
     */
    //AString getCommentAt(in long index);
    getCommentAt: function _getCommentAt(aIndex) {
        var localid = this._idcards[aIndex];
        var card = this._cards[localid];
        var comment = "";

        if (card.isMailList && card.primaryEmail.indexOf("@") == -1) {
            comment = card.displayName;
        }
        else if (card.displayName != "") {
          // Add first name and / or last name to comment if display name is used in the "TO:" header
          if (card.firstName != "") {
            comment += card.firstName;
          }

          if (card.lastName != "") {
            if (comment != "")
            {
              comment += " "
            }
            comment += card.lastName
          }
        }

        if (comment != "")
        {
          comment += ", "
        }

        comment += "Exchange Calendar";

        return comment;
    },

    /**
     * Get the style hint for the result at the given index
     */
    //AString getStyleAt(in long index);
    getStyleAt: function _getStyleAt(aIndex) {
        return "exchange-abook";
    },

    /**
     * Get the image of the result at the given index
     */
    //AString getImageAt(in long index);
    getImageAt: function _getImageAt(aIndex) {
        return "chrome://exchangecommon-common/skin/images/exchange-addrbook.png";
    },

    /**
     * Get the final value that should be completed when the user confirms
     * the match at the given index.
     */
    //AString getFinalCompleteValueAt(in long index);
    getFinalCompleteValueAt: function _getFinalCompleteValueAt(aIndex) {
        return this.getValueAt(aIndex)
    },

    /**
     * Remove the value at the given index from the autocomplete results.
     * If removeFromDb is set to true, the value should be removed from
     * persistent storage as well.
     */
    //void removeValueAt(in long rowIndex, in boolean removeFromDb);
    removeValueAt: function _removeValueAt(aRowIndex, removeFromDb) {
        var localid = this._idcards.splice(aRowIndex, 1);
        delete this._cards[localid];
    },

    //void addResult(in mivExchangeAbCard aCard);
    addResult: function _addResult(aCard) {
        // First check if this card is not already in the list
        if (this._cards && this._cards[aCard.localId]) {
                return;
        }

        // Before really adding the result, check the card is a mailing list
        // and, otherwise, check it's primary email has at least a "@"
        if (aCard.isMailList || aCard.primaryEmail.indexOf("@") > -1) {
            this._cards[aCard.localId] =  aCard;
            this._idcards.push(aCard.localId);
        }
    },

    clearResults: function _clearResults() {
        this._cards = new Object();
        this._idcards = new Array();
        this._searchResult = this.RESULT_NOMATCH_ONGOING;
        this._searchString = "";
    },

};
