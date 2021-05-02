"use strict";
const jsdoc2md = require("jsdoc-to-markdown");
const fs = require("fs");
const path = require("path");

/* input and output paths */
const inputFile = path.join(__dirname, "../mods/*/dist/*.js");
const outputDir = path.join(__dirname, "../docs/reference");

/* get template data */
const templateData = jsdoc2md.getTemplateDataSync({ files: inputFile });

/* reduce templateData to an array of class names */
const classNames = templateData.reduce((names, identifier) => {
  if (identifier.kind === "class") names.push(identifier.name);
  return names;
}, []);

/* create a documentation file for each class */
for (const className of classNames) {
  // Workaround an issue with the inputFile picking up wrong classes
  if (["Scanner", "Walker", "Parser", "Filter"].includes(className)) continue;
  const template = `{{#class name="${className}"}}{{>docs}}{{/class}}`;
  console.log(`rendering ${className}, template: ${template}`);
  const output = jsdoc2md.renderSync({
    data: templateData,
    template: template
  });
  fs.writeFileSync(path.resolve(outputDir, `${className}.md`), output);
}
