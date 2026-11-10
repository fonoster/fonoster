#!/usr/bin/env node

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

// The file that documented each class. A class found in two files means stale
// build output in dist (for example dist/node/src left by a tsc-only emit), and
// documenting both would append a second, different copy of the class.
const classFiles = new Map();

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
    if (classFiles.has(className)) {
      console.error(
        `Class ${className} is documented in both ${classFiles.get(className)} and ${file}. ` +
          "dist has stale build output: run a clean build (npm run build) and try again."
      );
      process.exit(1);
    }
    classFiles.set(className, file);
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