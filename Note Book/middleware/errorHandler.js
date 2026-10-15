const { LogEvent } = require('./logEvent')

const errorHandler =  ( err , req , res , next)=>{
        LogEvent(`${err.name}:${err.message}` , 'errorLog.txt');        
        console.log(err.stack)
        res.status(500).send(err.message);
}

module.exports = errorHandler;