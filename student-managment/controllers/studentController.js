const data = {        
        students : require('../data/students.json'),
        setStudents : function(data){ this.students = data }
}
const fsPromises = require('fs').promises;
const path = require('path');
const getAllstudents = (req , res) =>{
        res.json(data.students);
}
const getStudentById = (req , res ) =>{
        const Student = data.students.find( stud => stud.id === parseInt(req.params.id));
        if(!Student){
                res.status(400).json({ message : " The Student is Not Found"});
        }else{
                res.send(Student);
        }
}
const creatNewStudent = async (req , res) =>{
        const Student = data.students.find( stud => stud.id === parseInt(req.params.id));
        if(Student){
                res.status(400).json({ message : " The Student is Already There"});
        }else{
         const newStudent = {
               id : data.students[data.students.length - 1].id+1 || 1,
               firstname : req.body.firstname,
               lastname : req.body.lastname,
               department : req.body.department
        }
        if (!newStudent.firstname || !newStudent.lastname || !newStudent.department){
                return res.status(400).json({ message : "There must be Firstname , Lastname and Department" })
        }
        data.setStudents([...data.students , newStudent]);
        await fsPromises.writeFile(path.join(__dirname , '..' , 'data' ,'students.json'),JSON.stringify(data.students));
        res.status(201).json({
                mesage : "New Student Created",
                student : newStudent
        });
}
}

const UpdatStudents = (req , res) =>{
        const Student = data.students.find( stud => stud.id === parseInt(req.params.id));
        if(!Student){
                res.status(400).json({ message : ` The Student with The id ${req.body.id}  is Not Found`});
        }else{
                if(req.body.firstname) Student.firstname = req.body.firstname;
                if(req.body.lastname) Student.lastname = req.body.lastname;
                if(req.body.department) Student.department = req.body.department;

                const filterdArr = data.students.filter(emp => emp.id !== parseInt(req.params.id));
                const unsorrtedArr = [...filterdArr , Student];
                data.setStudents(unsorrtedArr.sort((a , b) => a.id > b.id ? 1 : b.id > a.id ? -1 : 0));
                res.json(data.students);

        }
}


module.exports = {
        getAllstudents ,
        getStudentById ,
        creatNewStudent ,
        UpdatStudents
}