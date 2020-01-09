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

var EXPORTED_SYMBOLS = ["mivExchangeLightningNotifier"];

function mivExchangeLightningNotifier() {
    this.queue = [];

    this.timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    this.timerRunning = false;

    this.observerService = Cc["@mozilla.org/observer-service;1"]
        .getService(Ci.nsIObserverService);

    this.globalFunctions = (new (ChromeUtils.import("resource://exchangecommoninterfaces/global/mivFunctions.js").mivFunctions)());

}

var PREF_MAINPART = 'extensions.1st-setup.exchangecalendar.lightningnotifier.';

mivExchangeLightningNotifier.prototype = {
    // Internal methods.
    notify: function _notify() {
        this.processQueue();
    },

    addToNotifyQueue: function _addToNotifyQueue(aCalendar, aCmd, aArg) {
        this.queue.push({
            calendar: aCalendar,
            cmd: aCmd,
            arg: aArg
        });

        if (!this.timerRunning) {
            this.timerRunning = true;
            //dump("mivExchangeLightningNotifier: Start timer\n");
            this.timer.initWithCallback(this, 500, this.timer.TYPE_REPEATING_SLACK);
        }
    },

    processQueue: function _processQueue() {
        //dump("mivExchangeLightningNotifier: processQueue\n");
        // FIXME
        // cal.provider.BaseClass.startBatch();

        for (var counter = 0;
            ((counter < 100) && (this.queue.length > 0)); counter++) {
            var notification = this.queue.shift();
            notification.calendar.notifyObservers.notify(notification.cmd, notification.arg);
        }
        // FIXME
        // cal.provider.BaseClass.endBatch();

        if (this.queue.length == 0) {
            this.timer.cancel();
            this.timerRunning = false;
        }
    },

}
