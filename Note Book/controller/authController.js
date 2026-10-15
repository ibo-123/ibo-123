const User = require('../model/Users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const HandlLogin = async (req , res) => {
        const { username , password } = req.body;
        if ( !username || !password ){
                return res.status(400).json({ 'message' : 'Username and Password are required '});
        }
        const foundUser = await User.findOne({ username });
        if ( !foundUser ){
                return res.sendStatus(401); // Unauthorized
        }
        const match = await bcrypt.compare(password , foundUser.password);
        if ( match ){
                const roles = Object.values(foundUser.roles).filter(Boolean);
        const accessToken = jwt.sign(
                {
                        "UserInfo": {
                                "username": foundUser.username,
                                "roles": roles
                        }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '30s' }
        );
        const refreshToken = jwt.sign(
                { "username": foundUser.username },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '1d' }
        );
        foundUser.refreshToken = refreshToken;
        const result = await foundUser.save();
        console.log(result);
        res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 });
        // return the token (adjust as needed for your client)
        res.json({ accessToken });
        }
        
};
module.exports = { HandlLogin };