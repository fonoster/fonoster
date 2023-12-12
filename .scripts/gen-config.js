const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const SECRET = process.env.APISERVER_JWT_PRIVATE_KEY;
const APISERVER_ENDPOINT = process.env.APISERVER_ENDPOINT;

const payload = {
  "iss": "fonoster",
  "role": "SERVICE",
  "accessKeyId": "internal"
};

const options = {
  expiresIn: "1y"
};

const token = jwt.sign(payload, SECRET, options);

const jsonString = JSON.stringify({
  "endpoint": APISERVER_ENDPOINT,
  "accessKeyId": payload.accessKeyId,
  "accessKeySecret": token
}, null, 2);

const outputFile = "config";

fs.writeFile(outputFile, jsonString, (err) => {
  if (err) {
    console.error("error writing to file: ", err);
  } else {
    console.log("Successfully wrote to", outputFile);
  }
});
