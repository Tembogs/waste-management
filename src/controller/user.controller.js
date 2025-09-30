import {createUser, getAllUsers, getUserbyId, updateUser, deleteUser, } from "../services/user.services.js";

export const createNewUser = async (req, res) =>{
  const {name, email, password, phoneNumber, role, location,gender} = req.body;
  const users = await createUser(name, email, password, phoneNumber,role, location,gender)
  if (!users) {
    return res.status(400).json({message: "incomplete details"})
  }
  return res.status(201).json(users)
}


export const fetchAllUsers = async (req,res) =>{
  const {id} = req.params;
  const users = await getAllUsers(id);
  return res.status(200).json(users)
}


export const fetchUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserbyId(id);

    if (!user) {
      return res.status(404).json({ message: "Profile not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};



export const editUser = async(req, res) => {
  const {id} = req.params;
  const updateInfo = req.body;
  const users = await updateUser(id, updateInfo);
  if(!users){
    return res.status(404).json({message: "nonexistent user"});
  }
  return res.status(200).json(users)
}


export const removeUser = async(req, res) => {
  const {id} = req.params;
  const users = await deleteUser(id);
  if (!users){
    return res.status(404).json({message: "user not found"})
  }
  return res.status(200).json({message: "user deleted successfully"}) 
}