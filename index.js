const rs = require("readline-sync")
const chalk = require('chalk')
const isIp = require('is-ip');
const fetch = require('node-fetch');
const xxtea = require('./xxtea');
const { CRC8 } = require('./crc8');
let log = console.log;

let blueBright = chalk.bold.blueBright
let green = chalk.bold.green
let red = chalk.bold.red
let cyan = chalk.bold.cyan
let yellow = chalk.bold.yellow
let title = chalk.black.bold.bgYellow

begin()

function begin() {
  (async function () {
    log(cyan("Welcome to the device test:"), yellow("Ready to test device?"))
    startProgram()
  })()
}

async function startProgram() {

  log(`\n${blueBright("There will be 3 questions.")}\n${green('Please provide correct inputs.')}`, "\n")
 
  const IP = rs.question('What is the IP of device? ');
  let isCorrect = isIp(IP);
  if (isCorrect) {
    log(`You entered : ${green(IP)} ip.`)
  } else {
    log(`${red('You entered incorrect IP')}: ${red(IP)}`)
    startProgram();
  }

  deviceTypes = ['VUL100'] //, 'VUL200', 'VUL300'];
  const deviceTypesIndex = rs.keyInSelect(deviceTypes, 'Please select device type!');
  if (deviceTypesIndex == -1) {
    process.exit();
  } else {
    var deviceType = deviceTypes[deviceTypesIndex];
    log(`You selected device type : ${green(deviceType)}`)
  }

  const deviceTypeCommands = {
    VUL100: ['on', 'off'],
    //VUL200: ['on', 'off', 'humidity'],
    //VUL300: ['on', 'off', 'humidity', 'temperature']
  };

  commands = deviceTypeCommands[deviceTypes[deviceTypesIndex]];
  const commandsIndex = rs.keyInSelect(commands, 'What command do you want to send?');
  if (commandsIndex == -1) {
    process.exit();
  } else {
    log(`Command to send : ${green(commands[commandsIndex])}`)
    let data = generateCommandBody(deviceType, commands[commandsIndex] == 'on' ? true: false)
    let secret = '5674567400'
          const deviceCommand =
              await makeSendCommand('HTTP', data, secret, `http://${IP}/uricommand`);//`http://localhost:80/uricommand/`);
  }
  confirmExit()
}

function generateCommandBody(deviceType, command){
  let commandData = generateCommandArr(deviceType, command);
  return commandData;
}

function generateCommandArr(deviceType, desiredState) {
  let command_buf = new Uint8Array(11);
  // seq no
  command_buf[0] = 0x00;
  command_buf[1] = 0x00;
  // magicNo
  command_buf[2] = 0x56;
  command_buf[3] = 0x74;
  // command
  command_buf[4] = 0x70;
  command_buf[5] = 0x00;
  command_buf[6] = 0x00;
  command_buf[7] = 0x00;
  // data length
  command_buf[8] = 0x00;
  command_buf[9] = 0x01;
  // param
  //log('desiredState - On: ', desiredState);
  command_buf[10] = (desiredState) ? 0x01 : 0x00 ;
  let cksum = generateChecksum(command_buf)
  let cmd = new Uint8Array([...command_buf, cksum])
  //log('unint array with cksum - ', cmd) 
  return cmd
}

function generateChecksum(data){
  let crc8 = new CRC8(CRC8.POLY.CRC8_DALLAS_MAXIM, 0xff)
  let cksum = crc8.checksum(data);
  return cksum
}

function toHexString(data) {
  var s = '' // '0x';
  data.forEach(function(byte) {
      s += ('0' + (byte & 0xFF).toString(16)).slice(-2);
  });
  return s;
}

async function postData(url = '', data = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream'
    },
    body: data
  });
  return response;
}
async function makeHttpPost(data, secret, path) {
  //log('http encryption secret', secret)
  
  let encryptedData = xxtea.encrypt(data, secret);
  //log('encrypted data - ', encryptedData)
  let hexCmdString = toHexString(encryptedData)
  try{
    const data = await postData(path, {hexCmdString: hexCmdString})
    log("Success.", data.statusText);
  }
  catch(err){
    log("Error: " , err);
  };
}

function makeSendCommand(protocol, data, secret, path) {
  switch (protocol) {
    case 'HTTP':
      return makeHttpPost(data, secret, path);
    default:
      throw Error(`Unsupported protocol for send: ${protocol}`);
  }
}
// asks a question to the user and returns true or false
function askQuestion(ques, correctAnswer) {
  if (rs.keyInYNStrict(yellow(ques))) {
    return checkAnswer("y", correctAnswer)
  } else {
    return checkAnswer("n", correctAnswer)
  }
}

// compares user's answer with correct answer and returns true or false back to askQuestion()
function checkAnswer(ans, correctAnswer) {
  if (ans.toLowerCase() === correctAnswer.toLowerCase()) {
    return true
  } else {
    return false
  }
}

// Confirm from user if they want to test another device.
function confirmExit() {
  let isCorrect = askQuestion('Do you want to test another device?', 'y')
  if (isCorrect) {
    startProgram();
  } else {
    process.exit();
  }
}