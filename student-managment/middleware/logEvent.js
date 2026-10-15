const { format } = require('date-fns');
const fs = require('fs');
const fsPromise = require('fs').promises;
const path = require('path');
const {v4 : uuid} = require('uuid');



const logEvent = async (message , logFileName) =>{

        const dateTime = format(new Date(), 'yyyyMMdd\t HH:mm:ss');
        const logItem = `${dateTime}\t${uuid()}\t${message}\n`;
        logFileName = logFileName ||'requestLog.txt'

        try{
                if(!fs.existsSync(path.join(__dirname,'..','logs'))){
                        await fsPromise.mkdir(path.join(__dirname,'..','logs'));
                }
               await fsPromise.appendFile(path.join(__dirname , '..' , 'logs',logFileName) , logItem) ;
        }catch(err){
                console.log(err);
        }
}


const logger = (req , res , next) =>{
        logEvent(`${req.method}\t${req.url}` , 'requestLog.txt');
        console.log(`${req.method} ${req.path}`)
        next();
};

module.exports = { logger , logEvent};