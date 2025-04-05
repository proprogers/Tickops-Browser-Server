function writeLog(message, error, details) {
  console.log('--------');
  console.log(new Date().toGMTString());
  console.log(message);
  details && console.log(details);
  console.log(error || '-');
}

module.exports = { writeLog };
