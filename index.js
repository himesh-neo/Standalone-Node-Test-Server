const rs = require("readline-sync")
const chalk = require('chalk')
const isIp = require('is-ip');
const fetch = require('node-fetch');
// const xxtea = require('./xxtea');
// const { CRC8 } = require('./crc8');
let log = console.log;

let blueBright = chalk.bold.blueBright
let green = chalk.bold.green
let red = chalk.bold.red
let cyan = chalk.bold.cyan
let yellow = chalk.bold.yellow
let title = chalk.black.bold.bgYellow
const GenerateCommandString = require('./generateCommand');

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

  deviceTypes = ['VUL100', 'VSC100'] //, 'VUL200', 'VUL300'];
  const deviceTypesIndex = rs.keyInSelect(deviceTypes, 'Please select device type!');
  if (deviceTypesIndex == -1) {
    process.exit();
  } else {
    var deviceType = deviceTypes[deviceTypesIndex];
    log(`You selected device type : ${green(deviceType)}`)
  }

  const deviceTypeCommands = {
    VUL100: ['on', 'off'],
    VSC100: ['on', 'off', 'Color Temperature','Light Effect','Brightness'],
    //VUL300: ['on', 'off', 'humidity', 'temperature']
  };

  commands = deviceTypeCommands[deviceTypes[deviceTypesIndex]];
  const commandsIndex = rs.keyInSelect(commands, 'What command do you want to send?');
  if (commandsIndex == -1) {
    process.exit();
  } else {
    let commandValue;
    let traitsCommand;
    let cmdIndex = commands[commandsIndex];
    log(`Command to send : ${green(cmdIndex)}`)
    if (cmdIndex == 'on' || cmdIndex == 'off') {
      commandValue = cmdIndex == 'on' ? true: false
      if (cmdIndex == 'off') cmdIndex = 'on'
    } else {
      const cmdVal = rs.question(`Please provide value of ${cmdIndex} : `);
      if (cmdIndex == 'Color Temperature' && (cmdVal < 2000 || cmdVal > 6500)) {
        log(`${red('The range should be between 2000 to 6500, please enter correct value')}: ${red(cmdIndex)}`)
        startProgram();
      }
      log(`You entered : ${green(cmdVal)}.`)
      commandValue = cmdVal;
    }
    // let cmdObj = {};
    // cmdObj[`${cmdIndex}`] = commandValue
    //let data = generateCommandBody(deviceType, cmdObj)
    switch (cmdIndex) {
      case 'on' || 'off':
        traitsCommand = 'action.devices.commands.OnOff'
        break;
      case 'Color Temperature':
        traitsCommand = 'action.devices.commands.ColorAbsolute'
        break;
      //default:
        //break;
    }
    const generateCommandString = new GenerateCommandString(deviceType, traitsCommand, commandValue);
    const data = generateCommandString.generateCommandBody()
    log(" data : ", data);
    const deviceCommand =
        await makeSendCommand('HTTP', data, `http://localhost:80/uricommand/`);//`http://${IP}/uricommand`);//`http://localhost:80/uricommand/`);
  }
  confirmExit()
}

// function generateCommandBody(deviceType, command){
//   log("command : ", command);
//   let commandData = generateCommandArr(deviceType, command);
//   return commandData;
// }

// function generateCommandArr(deviceType, desiredState) {
//   let command_buf = new Uint8Array(11);
//   log("deviceType -> ", deviceType);
//   switch (deviceType) {
//     case 'VUL100':
//       // command
//       command_buf[4] = 0x70;
//       command_buf[5] = 0x00;
//       command_buf[6] = 0x00;
//       command_buf[7] = 0x00;
//       // data length
//       command_buf[8] = 0x00;
//       command_buf[9] = 0x01;
//       // param
//       command_buf[10] = Object.keys(desiredState)[0] == 'on' && desiredState.on == true ? 0x01 : 0x00 ;
//       break;
//     case 'VSC100':
//       if (Object.keys(desiredState)[0] == 'Color Temperature') {
//         log("INSIDE VSC100  Color Temperature -> ", deviceType);
//         // command
//         command_buf[4] = 0x70;
//         command_buf[5] = 0x00;
//         command_buf[6] = 0x20;
//         command_buf[7] = 0x02;
//         // param
//         command_buf[10] = 0xFF;
//         command_buf[11] = 0x00;
//         command_buf[12] = 0x00;
//         command_buf[13] = 0x00;
//         command_buf[14] = 0xFF;
//       } else {
//         // command
//         command_buf[4] = 0x70;
//         command_buf[5] = 0x00;
//         command_buf[6] = 0x20;
//         command_buf[7] = 0x03;
//         // param
//         command_buf[10] = Object.keys(desiredState)[0] == 'on' && desiredState.on == true ? 0x01 : 0x00 ;
//       }
      
//       // data length
//       command_buf[8] = 0x00;
//       command_buf[9] = 0x05;
      
//       break;
//     default:
//       throw Error(`Unsupported device : ${deviceType}`);
//   }

//   // seq no
//   command_buf[0] = 0x00;
//   command_buf[1] = 0x00;
//   // magicNo
//   command_buf[2] = 0x56;
//   command_buf[3] = 0x74;

//   log('command_buf : ', command_buf);
//   let cksum = generateChecksum(command_buf)
//   log('cksum - ', cksum) 
//   let cmd = new Uint8Array([...command_buf, cksum])
//   log('unint array with cksum - ', cmd) 
//   return cmd
// }

// function generateChecksum(data){
//   let crc8 = new CRC8(CRC8.POLY.CRC8_DALLAS_MAXIM, 0xff)
//   let cksum = crc8.checksum(data);
//   return cksum
// }

// function toHexString(data) {
//   var s = '' // '0x';
//   data.forEach(function(byte) {
//       s += ('0' + (byte & 0xFF).toString(16)).slice(-2);
//   });
//   return s;
// }

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
async function makeHttpPost(data, path) {
  //log('http encryption secret', secret)
  
  // let encryptedData = xxtea.encrypt(data, secret);
  // //log('1 encrypted data - ', encryptedData)
  // let hexCmdString = toHexString(encryptedData)
  // //log('1 hexCmdString data - ', hexCmdString)
  try{
    const response = await postData(path, {hexCmdString: data})
    log("Success.", response.statusText);
  }
  catch(err){
    log("Error: " , err);
  };
}

function makeSendCommand(protocol, data, path) {
  switch (protocol) {
    case 'HTTP':
      return makeHttpPost(data, path);
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