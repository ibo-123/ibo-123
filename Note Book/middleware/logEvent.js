const { format } = require('date-fns');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const { v4 : uuid4 } = require('uuid');

const LogEvent = async (message , logname) =>{
        const dateTime = `${format(new Date() , 'yyyyMMdd\tHH:mm:ss')}`;
        const logItem = `${dateTime}\t${uuid4()}\t${message}\n`;
        try{
                if (!fs.existsSync( path.join(__dirname ,'..' , 'logs'))){
                        await fsPromises.mkdir(path.join(__dirname , '..' , 'logs'))
                }
                await fsPromises.appendFile(path.join(__dirname , '..' , 'logs',logname) , logItem);
        }
        catch(err){
                console.log(err)
        }
};

const logger = (req , res , next)=>{
        LogEvent(`${req.method}\t${req.headers.origin}\t${req.url}` , 'reqLog.txt')
        console.log(`${req.method}\t${req.path}`);
        next();
};

module.exports = {logger , LogEvent};