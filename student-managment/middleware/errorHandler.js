const { logEvent } = require('./logEvent');

const errorHandler = (err , req , res , next) =>{
        logEvent(`${err.name} : ${err.message} , 'error.txt`);
        res.status(500).json({ message : err.message })
};

module.exports = errorHandler ;