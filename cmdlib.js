const logger = require('./logger');
const { XMLParser, XMLValidator } = require('fast-xml-parser');
const fs = require('fs'); // File system

const options = {
    ignoreAttributes: false,
    attributeNamePrefix : "",
    allowBooleanAttributes: true,
    attributesGroupName : "attributes",
    ignoreDeclaration: true,
};

const parser = new XMLParser(options);
const dirname = './commands/';
var lib = {}; // Commands stored as lowercase words, without spaces (replaced by '_').

// =================
// Reading all xml commands as json from ./commands/:
// =================

readFiles(dirname);

function readFiles(dirname) {
  var jsonDataFromXML = {};
  if(!fs.lstatSync(dirname).isDirectory()) {
    logger.log("cmdlib", "Error given path ("+dirname+") is not a directory.");
    return;
  }
  fs.readdir(dirname, function(err, filenames) { // Or use readdirsync
    if (err) {
      logger.log("cmdlib", "Error reading folder content.");
      logger.log("cmdlib", err);
      return;
    }
    filenames.forEach(function(filename) {
      if (filename.search(/\w+.xml\b/gi) == -1 || !fs.lstatSync(dirname + filename).isFile()) { // has .xml extension (use regex)
        logger.log("cmdlib", "Skip reading file ("+filename+"). Not a file ending on .xml");
        return;
      }
      fs.readFile(dirname + filename, 'utf-8', function(err, content) { // or use readfilesync
        if (err) {
          logger.log("cmdlib", "Error reading file.");
          logger.log("cmdlib", err);
          return;
        }
        try {
          addToLib(filename, parser.parse(content));
          logger.log("cmdlib", "Succesfully read and parsed " + filename);
        } catch(err) {
          logger.log("cmdlib", "Error parsing xml data of " + filename);
          logger.log("cmdlib", err);
        }
      });
    });
  });
}

function addToLib(filename, data) {
  lib[filename.replace(" ", "_").toLowerCase().replace(".xml", "").replace(/['‘’"“”]/g, "")] = data;
  logger.log("cmdlib", "Added ("+filename.replace(" ", "_").toLowerCase()+") to lib.");
}

module.exports.lib = lib;
