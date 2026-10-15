const userData = {
        user : require('../data/register.json'),
        setUser : function (data){  this.user = data}
}
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cookies = require('cookie-parser');
const handlRefershToken = (req,res)=>{
        const cookies = req.cookies;
        console.log(cookies);
        if(!cookies?.jwt) return res.status(401).json({"message" : "There is no cookies"}) ;

        const refreshToken = cookies.jwt;
        const find = userData.user.find( name => name.refreshToken === refreshToken);
        if (!find) return res.sendStatus(403);

        jwt.verify(
                refreshToken,
                process.env.REFRESH_TOKEN_SECRET,
                (err , decoded) =>{
                        if (err || find.name !== decoded.name) return res.sendStatus(403);
                 const accessToken = jwt.sign(
                { name : decoded.name  },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn : "30s"} )
                res.json({accessToken});
                });
        
}


module.exports = { handlRefershToken };