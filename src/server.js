import App from "./App";
import React from "react";
import { StaticRouter } from "react-router-dom";
import express from "express";
import { renderToString } from "react-dom/server";

const assets = require(process.env.RAZZLE_ASSETS_MANIFEST);

var fs = require("fs");
var brain = require("brain.js");
var bodyParser = require("body-parser");

const trainingData = [];
var done = false;

var data = fs.readFileSync("./friendsTrainingData.txt", "utf8");
data.split("\n").map(line => {
    if (line.length)
        trainingData.push(
            JSON.parse(
                line
                    .substring(2, line.length - 1)
                    .replace(/(\r\n\t|\n|\r\t)/gm, "")
            )
        );
});

let net = new brain.NeuralNetwork();
let trainedNet;
let longest;
train(getTrainingData());

// console.log(
//     trainedNet(
//         encode(
//             adjustSize(
//                 "Incredible to have a Chicago team in the Final Four. I’ll take that over an intact bracket any day! Congratulations to everybody @loyolachicago - let’s keep it going!"
//             )
//         )
//     )
// );

var numIterations = 0;

function iterationCallback(data) {
    numIterations = data.iterations;
    console.log(data);
    console.log(`${numIterations / 20000 * 100}% done`)
}

function train(data) {
    net
        .trainAsync(processTrainingData(data), {
            log: false,
            learningRate: 0.3,
            callback: iterationCallback,
            callbackPeriod: 500
        })
        .then(res => {
            done = true;
            trainedNet = net.toFunction();
        });
}

function encode(arg) {
    return arg.split("").map(x => x.charCodeAt(0) / 400);
}

function processTrainingData(data) {
    const processedValues = data.map(d => {
        return {
            input: encode(d.input),
            output: d.output
        };
    });
    // console.log(processedValues);
    return processedValues;
}

function getTrainingData() {
    longest = trainingData.reduce(
        (a, b) => (a.input.length > b.input.length ? a : b)
    ).input.length;
    for (let i = 0; i < trainingData.length; i++) {
        trainingData[i].input = adjustSize(trainingData[i].input);
    }

    // return [
    //     { input: "TEST", output: { "1": 0 } },
    //     { input: "test", output: { "0": 1 } }
    // ];
    return trainingData;
}

function adjustSize(string) {
    while (string.length < longest) {
        string += " ";
    }
    return string;
}

const server = express();
server.use(bodyParser.json()).use(bodyParser.urlencoded({ extended: true }));
server.post("/lookup", (req, res) => {
    if (!done) {
        res.status(202).json({
            response: `${numIterations / 20000 * 100}% done training. Come back later`
        });
        return;
    }

    var query = req.body.query;

    var response = trainedNet(encode(adjustSize(query)));

    res.status(200).json({
        response
    });
});

server
    .disable("x-powered-by")
    .use(express.static(process.env.RAZZLE_PUBLIC_DIR))
    .get("/*", (req, res) => {
        const context = {};
        const markup = renderToString(
            <StaticRouter context={context} location={req.url}>
                <App />
            </StaticRouter>
        );

        if (context.url) {
            res.redirect(context.url);
        } else {
            res.status(200).send(
                `<!doctype html>
    <html lang="">
    <head>
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta charset="utf-8" />
        <title>Welcome to Razzle</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${
            assets.client.css
                ? `<link rel="stylesheet" href="${assets.client.css}">`
                : ""
        }
        ${
            process.env.NODE_ENV === "production"
                ? `<script src="${assets.client.js}" defer></script>`
                : `<script src="${
                      assets.client.js
                  }" defer crossorigin></script>`
        }
    </head>
    <body>
        <div id="root">${markup}</div>
    </body>
</html>`
            );
        }
    });

export default server;
