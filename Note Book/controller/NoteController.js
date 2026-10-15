const Notes = require('../model/Notes');
const { format  } = require('date-fns');
const getAllNotes = async (req , res)=>{
        const allFiles =await Notes.find();
        if (allFiles.length == 0) return res.status(400).json({'message' : 'there is Empity Notes'});
        res.json(allFiles);
};

const createNote = async (req  , res)=>{
        if (!req?.body?.title || !req?.body?.description) return res.status(400).json({message : 'The title and description are required'});
        const newNote = await Notes.create({
                title : req.body.title,
                description : req.body.description,
                createdDate : `${format(new Date() , 'yyyy-MM-dd HH:mm:ss')}`,
                UpdateDate : null
        });
        res.status(201).json(newNote);

};

const updateNote = async (req, res) => {
    if (!req?.body?.title || !req?.body?.description) 
        return res.status(400).json({ message: 'The title and description are required' });

    const Update = await Notes.findAndUpdate(
        { title: req.body.title },
        { 
            description: req.body.description,
            UpdateDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
        },
        { new: true }
    );

    if (!Update) return res.status(404).json({ message: 'Note not found' });

    res.status(200).json(Update);
};


const DeleteNote = async (req , res) =>{
      if(!req?.body?.title) return res.status(400).json({message : 'The title that need to be deleted is require'})
      const Delete = await Notes.findOneAndDelete({title : req.body.title})
     if(!Delete) return res.status(404).json({ message: 'Note not found' });
     res.status(201).json({Delete : Delete  , message : 'Succefully Deleted'});
}


module.exports = {
        getAllNotes,
        createNote,
        updateNote,
        DeleteNote
}