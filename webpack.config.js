var path = require("path");

module.exports = {
    entry: {
        ExchangeCalendar: "src/calendar/interface/exchangeCalendar/ExchangeCalendar.ts",
    },
    output: {
        filename: "[name].js",
        path: __dirname + "/build/exchangecalendar"
    },
    plugins: [{
        apply: (compiler) => {
            compiler.plugin("compilation", function (compilation, params) {
                params.normalModuleFactory.plugin("parser", function (parser) {
                    parser.plugin("expression global", function expressionGlobalPlugin() {
                        this.state.module.addVariable("global", "(function() { return this; }())")
                        return false
                    })
                })
            })
        },
    }],
    devtool: "source-map",
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".json"],
    },
    node: {
        fs: "empty"
    },

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
    externals: {
    }
};
