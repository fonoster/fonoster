#!/usr/bin/node

"use strict";

const jsdoc2md = require("jsdoc-to-markdown");
const fs = require("fs");
const path = require("path");

// Function to recursively get all .js files from a directory and its subdirectories
function getJSFiles(dir) {
  const files = fs.readdirSync(dir);
  let jsFiles = [];
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      jsFiles = jsFiles.concat(getJSFiles(fullPath));
    } else if (path.extname(fullPath) === '.js') {
      jsFiles.push(fullPath);
    }
  }
  return jsFiles;
}

const outputFile = path.join(process.cwd(), 'README.md');
const allJSFiles = getJSFiles(path.join(process.cwd(), "dist"));

let fullDocumentation = ''; // Store the entire documentation here

for (const file of allJSFiles) {
  if (file.includes("/generated/")) continue; // Skip generated files

  const templateData = jsdoc2md.getTemplateDataSync({ files: file });

  /* reduce templateData to an array of class names */
  const classNames = templateData.reduce((names, identifier) => {
    if (identifier.kind === "class") names.push(identifier.name);
    return names;
  }, []);

  /* create a documentation section for each class */
  for (const className of classNames) {
    if (["Scanner", "Walker", "Parser", "Filter"].includes(className)) continue;
    const template = `{{#class name="${className}"}}{{>docs}}{{/class}}\n`;
    fullDocumentation += jsdoc2md.renderSync({
      data: templateData,
      template: template
    });
  }
}

const introFilePath = path.join(process.cwd(), ".intro.md");

if (fs.existsSync(introFilePath)) {
  // If intro.md exists, prepend its content to the fullDocumentation
  const introContent = fs.readFileSync(introFilePath, 'utf-8');
  fullDocumentation = introContent + "\n\n" + fullDocumentation;
}

// Save the entire documentation to a single markdown file
fs.writeFileSync(outputFile, fullDocumentation);

console.log(`Documentation generated at ${outputFile}`);