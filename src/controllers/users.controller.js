const {PrismaClient}=require('@prisma/client')
const prisma= new PrismaClient();
const bcrypt = require('bcryptjs');

exports.createUser=async (req,res) => {
    
    
    try {
        const { username,
            email,
            password,
            firstName,
            lastName,
            isActive,
            isAdmin,
            isManager,
            isMember}=req.body;
            const hashedPassword=await bcrypt.hash(password,10)
        const user= await prisma.user.create({
            data:{
                username,
                email,
                passwordHash:hashedPassword,
                firstName,
                lastName,
                isActive,
                isAdmin,
                isManager,
                isMember


            },
        })
        const {passwordHash,...userData}=user
        res.status(201).json(userData)
    } catch (error) {
         res.status(400).json({ error: error.message });
    }
}


exports.getAllUser=async (req,res) => {
    try {
        const allUsers=await prisma.user.findMany();
        res.status(201).json(allUsers)
    } catch (error) {
         res.status(400).json({ error: error.message });
    }
}


exports.singleUser=async (req,res) => {
    try {
        const { id } = req.params;
        const user=await prisma.user.findUnique({
            where:{id:Number(id)}
        });
        res.status(201).json(user)
    } catch (error) {
         res.status(400).json({ error: error.message });
    }
}

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await prisma.user.delete({
      where: { id: Number(id) } // If your ID is an integer
    });
    
    res.status(200).json({ message: "User deleted successfully", deletedUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


exports.updateUser=async (req, res) => {
  try {
    const {id}=req.params
     const { username,
            email,
            password,
            firstName,
            lastName,
            isActive,
            isAdmin,
            isManager,
            isMember}=req.body;
            const hashedPassword=await bcrypt.hash(password.toString(), 10)
        const user= await prisma.user.update({
            where:{id:parseInt(id)},
            data:{
                username,
                email,
                passwordHash:hashedPassword,
                firstName,
                lastName,
                isActive,
                isAdmin,
                isManager,
                isMember


            },

        })
        const {passwordHash,...userData}=user
        res.status(201).json(userData)
   
  } catch (error) {
    res.status(400).json({error:error.message})
  }
}
