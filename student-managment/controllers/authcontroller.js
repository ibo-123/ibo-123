const userData = {
   user : require('../data/register.json'),
   setUser : function (data) {this.user = data}
};
const bcrypt = require('bcrypt');
const fsPromises = require('fs').promises;
const path = require('path');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const handlLogin =async (req , res) =>{
      const {name , password } = req.body ;
      if(!name || !password) return res.status(400).json({'message' : "User Name and Password are required"});
      const find = userData.user.find(student => student.name === name);

      if(!find) return res.status(401).json({"message" : "User not found"});

      const match = await bcrypt.compare(password , find.password);
      if(match){
        const accessToken = jwt.sign(
                {name : find.name  },
               process.env.ACCESS_TOKEN_SECRET,
               {expiresIn : '50s'  }
        );
        const refreshToken  = jwt.sign(
                {name : find.name  },
               process.env.REFRESH_TOKEN_SECRET,
               {expiresIn : '1d'  }
        )
        const otherUsers = userData.user.filter( person => person.name !== find.name)
        const currentUser = {...find,refreshToken};
        userData.setUser([...otherUsers , currentUser])
       await fsPromises.writeFile(path.join(__dirname , '..','data' ,'register.json' ) , 
                   JSON.stringify(userData.user)                     
                );
                res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'Lax', secure: false, maxAge: 24 * 60 * 60 * 1000 });
                res.json({accessToken});

        }else{
                res.status(401).json({"message" : "there is un error"});
        }

};

module.exports = handlLogin ;  