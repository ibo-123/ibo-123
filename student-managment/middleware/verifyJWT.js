require('dotenv').config();
const jwt = require('jsonwebtoken');

const verifyingWeb = ( req , res ,next) => {
                const autheader = req.header.authorization || req.header.Authorization ;
                if(!autheader ?.startWith('Bearer '))  return res.sendStatus(401);
                const token  = autheader.split(' ')[-1];
                jwt.sign(
                        token,
                        process.env.ACCESS_TOKEN_SECRET,
                        (err , decode) =>{
                                if(err) return res.sendStatus(403);//Invalid syntax
                                res.user = decode.username;
                                next();
                        }
                )
               
}


module.exports = verifyingWeb