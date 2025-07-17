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