"use strict";
const jsdoc2md = require("jsdoc-to-markdown");
const fs = require("fs");
const path = require("path");

/* input and output paths */
const outputDir = path.join(__dirname, "../docs/docs/reference");

function generate(inputFile) {
  /* get template data */
  const templateData = jsdoc2md.getTemplateDataSync({ files: inputFile });

  /* reduce templateData to an array of class names */
  const classNames = templateData.reduce((names, identifier) => {
    if (identifier.kind === "class" && !names.includes(identifier.name)) names.push(identifier.name);
    return names;
  }, []);

  console.log(classNames)

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
}

generate(path.join(__dirname, "../mods/agents/dist/client/*.js"))
generate(path.join(__dirname, "../mods/domains/dist/client/*.js"))
generate(path.join(__dirname, "../mods/auth/dist/client/*.js"))
generate(path.join(__dirname, "../mods/callmanager/dist/client/*.js"))
generate(path.join(__dirname, "../mods/numbers/dist/client/*.js"))
generate(path.join(__dirname, "../mods/projects/dist/client/*.js"))
generate(path.join(__dirname, "../mods/providers/dist/client/*.js"))
generate(path.join(__dirname, "../mods/storage/dist/client/*.js"))
generate(path.join(__dirname, "../mods/users/dist/client/*.js"))
generate(path.join(__dirname, "../mods/secrets/dist/client/*.js"))
generate(path.join(__dirname, "../mods/voice/dist/*.js"))