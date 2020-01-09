if (!("Cc" in this)) {
    // eslint-disable-next-line mozilla/no-define-cc-etc, no-unused-vars
    const { classes: Cc, interfaces: Ci, results: Cr, utils: Cu } = Components;
}

(function() {
    const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
    Services.prefs.setBoolPref("javascript.options.showInConsole", true);
    Services.prefs.setBoolPref("browser.dom.window.dump.enabled", true);
    Services.prefs.setBoolPref("calendar.debug.log", true);
    Services.prefs.setBoolPref("calendar.debug.log.verbose", true);
    Services.prefs.setBoolPref("extensions.1st-setup.debug.log", true);
    Services.prefs.setIntPref("extensions.1st-setup.core.debuglevel", 2)
    Services.prefs.setBoolPref("extensions.1st-setup.authentication.debug", true);

    const { AddonTestUtils } = ChromeUtils.import(
        "resource://testing-common/AddonTestUtils.jsm"
    );
    AddonTestUtils.init(this, false);
    AddonTestUtils.overrideCertDB();
    AddonTestUtils.createAppInfo(
        "xpcshell@tests.mozilla.org",
        "XPCShell",
        "1",
        "68"
    );

    let xpiFile = __LOCATION__.parent.parent.parent;
    xpiFile.append("exchangecalendar-v.xpi");

    dump("Loading " + xpiFile.path + "\n");
    let manager = Cc["@mozilla.org/component-manager-extra;1"].getService(
        Ci.nsIComponentManagerExtra
    );
    manager.addLegacyExtensionManifestLocation(xpiFile);
})();

var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
var { cal } = ChromeUtils.import("resource://calendar/modules/calUtils.jsm");

var { HttpServer } = ChromeUtils.import("resource://testing-common/httpd.js");
var { AddonTestUtils } = ChromeUtils.import(
    "resource://testing-common/AddonTestUtils.jsm"
);
var { NetUtil } = ChromeUtils.import("resource://gre/modules/NetUtil.jsm");

var { MockRegistrar } = ChromeUtils.import("resource://testing-common/MockRegistrar.jsm");

var { erAutoDiscoverRequest } = ChromeUtils.import("resource://exchangecommon/erAutoDiscover.js");
var { erAutoDiscoverySOAPRequest } = ChromeUtils.import("resource://exchangecommon/erAutoDiscoverySOAP.js");

var { mivFunctions } = ChromeUtils.import("resource://exchangecommoninterfaces/global/mivFunctions.js");

var globalFunctions = new mivFunctions();

const MockConflictPrompt = {
    _origFunc: null,
    overwrite: false,
    register: function() {
        if (!this._origFunc) {
            this._origFunc = cal.provider.promptOverwrite;
            cal.provider.promptOverwrite = (aMode, aItem) => {
                return this.overwrite;
            };
        }
    },

    unregister: function() {
        if (this._origFunc) {
            cal.provider.promptOverwrite = this._origFunc;
            this._origFunc = null;
        }
    },
};

let exchangeServer;



function MockAlertsService() {}

MockAlertsService.prototype = {
  showAlertNotification: function() {},
  QueryInterface: ChromeUtils.generateQI([Ci.nsIAlertsService]),
};

function replaceAlertsService() {
  let originalAlertsServiceCID = MockRegistrar.register(
    "@mozilla.org/alerts-service;1",
    MockAlertsService
  );
  registerCleanupFunction(() => {
    MockRegistrar.unregister(originalAlertsServiceCID);
  });
}

function ExchangeServer(calendarManager, calendarId) {
    dump("HttpServer " + HttpServer + "\n");
    this.server = new HttpServer();
    this.calendarManager = calendarManager;
    this.calendarId = calendarId;
    let autodiscover = "/autodiscover/autodiscover.xml";

    this.server.registerPathHandler(
        autodiscover,
        this.router.bind(this, this.autodiscover.bind(this))
    );

}
ExchangeServer.prototype = {
    get baseUri() {
      return "http://localhost:" + this.server.identity.primaryPort + "/";
    },
    start: function() {
      this.server.start(-1);
      registerCleanupFunction(() => this.server.stop(() => {}));
    },
    resetClient: function(client) {
        this.resetRequest();
        MockConflictPrompt.unregister();
        this.calendarManager.unregisterCalendar(client);
    },
    waitForLoad: function(aCalendar) {
        return new Promise((resolve, reject) => {
            let observer = cal.createAdapter(Ci.calIObserver, {
                onLoad: function() {
                    let uncached = aCalendar.wrappedJSObject.mUncachedCalendar.wrappedJSObject;
                    aCalendar.removeObserver(observer);

                    if (Components.isSuccessCode(uncached._lastStatus)) {
                        resolve(aCalendar);
                    } else {
                        reject(uncached._lastMessage);
                    }
                },
            });
            globalFunctions.LOG("waitForLoad");
            globalFunctions.LOG(aCalendar);
            aCalendar.refresh()
            aCalendar.addObserver(observer);
        });
    },
    getClient: function() {
        let uri = "https://auto/" + encodeURIComponent(this.calendarId);
        let calmgr = this.calendarManager;
        let newCal = calmgr.createCalendar("exchangecalendar", Services.io.newURI(uri));
        let uclient = newCal.wrappedJSObject;
        newCal.name = "xpcshell";

        calmgr.registerCalendar(newCal);
        uclient.mThrottleLimits = {};
        MockConflictPrompt.register();

        let cachedCalendar = calmgr.getCalendarById(newCal.id);
        return this.waitForLoad(cachedCalendar);
    },
    router: function(nextHandler, request, response) {
        try {
            let method = request.hasHeader("X-HTTP-Method-Override")
              ? request.getHeader("X-HTTP-Method-Override")
              : request.method;
            let parameters = new Map(request.queryString.split("&").map(part => part.split("=", 2)));

            let body;
            try {
                body = XML.parse(
                    NetUtil.readInputStreamToString(
                        request.bodyInputStream,
                        request.bodyInputStream.available()
                    )
                );
            } catch (e) {
                // Don't bail if json parsing failed.
            }

            this.lastMethod = method;
            return nextHandler(request, response, method, parameters, body);
        } catch (e) {
            info("Server Error: " + e.fileName + ":" + e.lineNumber + ": " + e + "\n");
            return null;
        }
    },
    autodiscover: function(request, response, method, parameters, body) {
        let data = this.calendarListData;
        response.write(XML.stringify(data));
    }
};

function run_test() {
    replaceAlertsService();
    // TODO: make do_calendar_startup to work with this test and replace the startup code here
    do_get_profile();
    do_test_pending();
    let calendarManager = cal.getCalendarManager();
    calendarManager.startup({
        onResult: function() {
            exchangeServer = new ExchangeServer(
                calendarManager,"xpcshell@example.com");
            exchangeServer.start();
            cal.getTimezoneService().startup({
                onResult: function() {
                    run_next_test();
                    do_test_finished();
                },
            });
        },
    });
}

add_task(async function setup() {
    await AddonTestUtils.promiseStartupManager();
});

add_task(async function test_autodiscovery_request() {
    let client = await exchangeServer.getClient();
    new erAutoDiscoverRequest({
            user: "user",
            mailbox: "user@example.com"
        },
        function (ewsUrls, DisplayName, SMTPAddress, redirectAddr) {
            ok(true);
        },
        function (aExchangeRequest, aCode, aMsg) {
            globalFunctions.LOG("ecAutodiscoveryError. aCode:" + aCode + ", aMsg:" + aMsg);
            ok(false);
        },
        null
    );
    exchangeServer.resetClient(client);
});
