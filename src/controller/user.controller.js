import cloudinary from "../cloudinary.js";
import {getAllUsers, getUserbyId, updateUser, deleteUser, deleteAllUser , uploadProfilePicture} from "../services/user.services.js";
// import cloudinary from '../config/cloudinary.js';
// import { uploadProfilePicture } from '../services/userService.js';




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

export const deleteAll = async (req, res) => {
  const {id} = req.params
  const users = await deleteAllUser(id)
  return res.status(200).json({message: "successful"})
}




export const updateProfilePicture = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    // Upload to Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'profile_pictures' },
      async (error, result) => {
        if (error || !result?.secure_url) {
          console.error('Cloudinary error:', error);
          return res.status(500).json({ error: 'Image upload failed.' });
        }

        // Update user profile with Cloudinary URL
        const updatedUser = await uploadProfilePicture(id, result.secure_url);

        if (!updatedUser) {
          return res.status(404).json({ error: 'User not found.' });
        }

        res.status(200).json({
          message: 'Profile picture updated successfully.',
          user: updatedUser,
        });
      }
    );

    stream.end(file.buffer);
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};