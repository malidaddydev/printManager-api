const {PrismaClient}=require('@prisma/client')
const prisma= new PrismaClient();
const bcrypt = require('bcryptjs');

exports.createUser=async (req,res) => {
    
    
    try {
        const { username,
            email,
            password,
            first_name,
            last_name,
            is_active,
            is_admin,
            is_manager,
            is_member}=req.body;
            const hashedPassword=await bcrypt.hash(password,10)
        const user= await prisma.users.create({
            data:{
                username,
                email,
                password_hash:hashedPassword,
                first_name,
                last_name,
                is_active,
                is_admin,
                is_manager,
                is_member


            },
        })
        const {password_hash,...userData}=user
        res.status(201).json(userData)
    } catch (error) {
         res.status(400).json({ error: error.message });
    }
}


exports.getAllUser=async (req,res) => {
    try {
        const allUsers=await prisma.users.findMany();
        res.status(201).json(allUsers)
    } catch (error) {
         res.status(400).json({ error: error.message });
    }
}