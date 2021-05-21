const rs = require("readline-sync")
const chalk = require('chalk')
const isIp = require('is-ip');
const fetch = require('node-fetch');
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

  deviceTypes = ['VUL100', 'VSC100']
  const deviceTypesIndex = rs.keyInSelect(deviceTypes, 'Please select device type!');
  if (deviceTypesIndex == -1) {
    process.exit();
  } else {
    var deviceType = deviceTypes[deviceTypesIndex];
    log(`You selected device type : ${green(deviceType)}`)
  }

  const deviceTypeCommands = {
    VUL100: ['on', 'off'],
    VSC100: ['on', 'off', 'Color Temperature','Light Effect','Brightness']
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
    } else if (cmdIndex == 'Color Temperature') {
      const cmdVal = rs.question(`Please provide value of ${cmdIndex} : `);
      if (cmdIndex == 'Color Temperature' && (cmdVal < 1000 || cmdVal > 10000)) {
        log(`${red('The range should be between 1000 to 10000, please enter correct value')}: ${red(cmdIndex)}`)
        startProgram();
      }
      log(`You entered : ${green(cmdVal)}.`)
      commandValue = cmdVal;
    } else if (cmdIndex == 'Light Effect'){
      commandValue = 0x01;
    } else if (cmdIndex == 'Brightness'){
      const cmdBVal = rs.question(`Please provide value of ${cmdIndex} : `);
      if (cmdBVal < 0 || cmdBVal > 100) {
        log(`${red('The range should be between 0 to 100, please enter correct value')}: ${red(cmdIndex)}`)
        startProgram();
      }
      log(`You entered : ${green(cmdBVal)}.`)
      commandValue = cmdBVal;
    }
    switch (cmdIndex) {
      case 'on' || 'off':
        traitsCommand = 'action.devices.commands.OnOff'
        break;
      case 'Color Temperature':
        traitsCommand = 'action.devices.commands.ColorAbsolute'
        break;
      case 'Light Effect':
        traitsCommand = 'action.devices.commands.ColorLoop'
        break;
      case 'Brightness':
        traitsCommand = 'action.devices.commands.BrightnessAbsolute'
        break;
      //default:
        //break;
    }
    const generateCommandString = new GenerateCommandString(deviceType, traitsCommand, commandValue);
    const data = generateCommandString.generateCommandBody()
    //log(" data : ", data);
    const deviceCommand =
        await makeSendCommand('HTTP', data, `http://${IP}/uricommand`);//`http://localhost:80/uricommand/`);
  }
  confirmExit()
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
async function makeHttpPost(data, path) {
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