const userData = {
    user: require('../data/register.json'),
    setUser: function (data) { this.user = data }
};

const fsPromises = require('fs').promises;
const path = require('path');

const handlLogout = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); // No content

    const refreshToken = cookies.jwt;
    const foundUser = userData.user.find(person => person.refreshToken === refreshToken);

    // No matching user in database
    if (!foundUser) {
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
        return res.sendStatus(204);
    }

    // Remove refresh token from user record
    const otherUsers = userData.user.filter(person => person.refreshToken !== refreshToken);
    const currentUser = { ...foundUser, refreshToken: '' };

    userData.setUser([...otherUsers, currentUser]);

    // Save updated user data to file
    await fsPromises.writeFile(
        path.join(__dirname, '..', 'data', 'register.json'),
        JSON.stringify(userData.user, null, 2)
    );

    // Clear cookie
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
    return res.sendStatus(204);
};

module.exports = { handlLogout };
