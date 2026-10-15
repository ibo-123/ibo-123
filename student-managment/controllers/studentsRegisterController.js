
const Students = require('../data/students')
const bcrypt = require('bcrypt'); // For hashing and verifying passwords
const jwt = require('jsonwebtoken');
require('dotenv').config();

// ------------------------
// Register a new user
// ------------------------
const registerNewUser = async (req, res) => {
    const { name, password } = req.body;

    // Ensure password is not weak (only numeric)
    if (password === String(Number(password)))  
        return res.status(402).json({ 'message': "The Password Must Be Strong For Your Privacy" });

    // Validate required fields
    if (!name || !password) 
        return res.status(400).json({ 'message': 'Username and Password are required' });

    // Check for duplicate username
   const duplicate = await Students.findOne({name : name});
    if (duplicate) return res.sendStatus(409); // Conflict

    try {
        // Hash the password before storing
        const hashpassword = await bcrypt.hash(password, 10);

        // Create a new user object with unique id
        const newUser = ({
            id: userData.user[userData.user.length - 1] ? userData.user[userData.user.length - 1].id + 1 : 1,
            name: name,
            password: hashpassword
        })

        // Update the in-memory array
        userData.setUser([...userData.user, newUser]);

        // Persist updated user list to JSON file
        await fsPromises.writeFile(
            path.join(__dirname, '..', 'data', 'register.json'),
            JSON.stringify(userData.user)
        );

        // Send success response
        res.status(201).json({ 'Success': `The Student ${name} is registered` });
        console.log(userData.user);

    } catch (err) {
        // Handle unexpected errors
        res.status(500).json({ 'message': err.message });
    }
}


// ------------------------
// Delete an existing student
// ------------------------
const deleteStudent = async (req, res) => {
    try {
        const { name, pwd } = req.body;

        // Validate required fields
        if (!name || !pwd) 
            return res.status(400).json({ 'message': 'Username and Password are required' });

        // Find the user by name
        const find = userData.user.find(user => user.name === name);
        if (!find) return res.status(404).json({ "message": "Not found" });

        // Verify password using bcrypt
        const found = await bcrypt.compare(pwd, find.password);
        if (!found) return res.status(401).json({ "Message": "The Password is Wrong Try again" });
        // Remove the user from the array
        userData.user = userData.user.filter(user => user.name !== name);
        
        // Persist updated user list to JSON file
        await fsPromises.writeFile(
            path.join(__dirname, '..', 'data', 'register.json'),
            JSON.stringify(userData.user, null, 2)
        );

        // Send success response
        res.status(200).json({ "Message": `The Student ${name} is successfully Removed` });

    } catch (err) {
        // Handle unexpected errors
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}


// ------------------------
// Export the functions
// ------------------------
module.exports = { registerNewUser, deleteStudent }
