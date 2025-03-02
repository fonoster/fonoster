#!/usr/bin/node

"use strict";

const fs = require("fs");
const jsdoc2md = require("jsdoc-to-markdown");
const path = require("path");

const outputDir = path.join(__dirname, "../docs/reference");

function generate(inputFile) {
  const templateData = jsdoc2md.getTemplateDataSync({ files: inputFile });

  const classNames = templateData.reduce((names, identifier) => {
    if (identifier.kind === "class" && !names.includes(identifier.name)) names.push(identifier.name);
    return names;
  }, []);

  console.log(classNames)

  for (const className of classNames) {
    if (["Scanner", "Walker", "Parser", "Filter"].includes(className)) continue;
    const template = `{{#class name="${className}"}}{{>docs}}{{/class}}`;
    console.log(`rendering ${className}, template: ${template}`);
    const output = jsdoc2md.renderSync({
      data: templateData,
      template: template
    });
    fs.writeFileSync(path.resolve(outputDir, `${className}.md`), output);
  }
}

generate(path.join(__dirname, "../mods/voice/dist/*.js"))
