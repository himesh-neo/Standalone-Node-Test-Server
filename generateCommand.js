const xxtea = require('./xxtea');
const { CRC8 } = require('./crc8');
const convertTemp2rgb = require('color-temp');

class GenerateCommandString {
    log = console.log;
    deviceType;
    command;
    commandValue;
    secret = '5674567400';
    constructor(deviceType, command, commandValue){
        this.deviceType = deviceType;
        this.command = command;
        this.commandValue = commandValue;
    }
    generateCommandBody(){
        let commandData = this.generateCommandArr(this.deviceType, this.command, this.commandValue);
        const encryptedData = xxtea.encrypt(commandData, this.secret);
        this.log(`Encrypted Data - `, encryptedData);
        const hexCmdString = this.toHexString(encryptedData);
        this.log('Encrypted hex command string - ', hexCmdString);
        return hexCmdString;
    }

    generateCommandArr(deviceType, command, commandValue) {
        let command_buf = new Uint8Array(11);
        switch (deviceType) {
        case 'VUL100':
          //command_buf = new Uint8Array(11);
            // command
            command_buf[4] = 0x70;
            command_buf[5] = 0x00;
            command_buf[6] = 0x00;
            command_buf[7] = 0x00;
            // data length
            command_buf[8] = 0x00;
            command_buf[9] = 0x01;
            // param
            command_buf[10] = commandValue == true ? 0x01 : 0x00;
            break;
        case 'VSC100':
          
            if (command == 'action.devices.commands.ColorAbsolute') {
              command_buf = new Uint8Array(15);

              const rgb = convertTemp2rgb.temp2rgb(commandValue);
              const rgb2hsb = this.RGBToHSB(...rgb);
              const wbgrValues = rgb.concat(rgb2hsb[rgb2hsb.length - 1]);
              this.log("wbgrValues --->>> ", wbgrValues);
              
                // command
                command_buf[4] = 0x70;
                command_buf[5] = 0x00;
                command_buf[6] = 0x20;
                command_buf[7] = 0x02;
                // data length
                command_buf[8] = 0x00;
                command_buf[9] = 0x05;
                // param
                command_buf[10] = 0xFF;
                command_buf[11] = 0x00;
                command_buf[12] = 0x00;
                command_buf[13] = 0x00;
                command_buf[14] = 0xFF;

            } else if (command == 'action.devices.commands.OnOff') {
                //command_buf = new Uint8Array(11);
                // command
                command_buf[4] = 0x70;
                command_buf[5] = 0x00;
                command_buf[6] = 0x20;
                command_buf[7] = 0x03;
                // data length
                command_buf[8] = 0x00;
                command_buf[9] = 0x01;
                // param
                command_buf[10] = commandValue == true ? 0x01 : 0x00;
            }
            break;
        default:
            throw Error(`Unsupported device : ${deviceType}`);
        }
    
        // seq no
        command_buf[0] = 0x00;
        command_buf[1] = 0x00;
        // magicNo
        command_buf[2] = 0x56;
        command_buf[3] = 0x74;
    
        this.log('command_buf : ', command_buf);
        let cksum = this.generateChecksum(command_buf)
        this.log('cksum - ', cksum) 
        let cmd = new Uint8Array([...command_buf, cksum])
        this.log('unint array with cksum - ', cmd) 
        return cmd
  }
  
  generateChecksum(data){
    let crc8 = new CRC8(CRC8.POLY.CRC8_DALLAS_MAXIM, 0xff)
    let cksum = crc8.checksum(data);
    return cksum
  }
  
  toHexString(data) {
    var s = '' // '0x';
    data.forEach(function(byte) {
        s += ('0' + (byte & 0xFF).toString(16)).slice(-2);
    });
    return s;
  }

  RGBToHSB = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const v = Math.max(r, g, b),
      n = v - Math.min(r, g, b);
    const h =
      n && v === r ? (g - b) / n : v === g ? 2 + (b - r) / n : 4 + (r - g) / n;
    return [60 * (h < 0 ? h + 6 : h), v && (n / v) * 100, v * 100];
  }
}
module.exports= GenerateCommandString