const path = require("path");
require("dotenv").config();

module.exports = {
  entry: {
    websdk: "./dist/src/index.js",
    agents: "./dist/src/agents.js",
    auth: "./dist/src/auth.js",
    callmanager: "./dist/src/callmanager.js",
    domains: "./dist/src/domains.js",
    funcs: "./dist/src/funcs.js",
    numbers: "./dist/src/numbers.js",
    projects: "./dist/src/projects.js",
    providers: "./dist/src/providers.js",
    secrets: "./dist/src/secrets.js",
    storage: "./dist/src/storage.js",
    users: "./dist/src/users.js"
  },
  devtool: "inline-source-map",
  mode: "development",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist")
  }
};
