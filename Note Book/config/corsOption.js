const allowedOrigin = require('./allowedOrigin');

const corsOption = {
        origin : ( origin , callback) =>{
                if (allowedOrigin.indexOf(origin) !== -1 || !origin ){
                        callback(null , true);
                }else{
                        callback( new Error('Not Allowed By Cors'));
                }
        },
        optionsSuccsessStatus  : 200
}

module.exports = corsOption;
