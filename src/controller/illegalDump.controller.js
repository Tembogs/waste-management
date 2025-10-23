import{reportIllegalDump,getAllIllegalEntries,updateIllegalEntryById,deleteIllegalEntry, acceptDumpRequestService, rejectDumpRequestService, resolveDumpRequestService, getIllegalStatusV2, deleteAllDump, getDumpRequestToCollector} from "../services/illegalDumping.services.js";

export const reportNewILLegalDump = async(req,res) => {
  try{
    const userId = req.user._id; // Get user ID from auth middleware
    const illegalData = { ...req.body, userId }; // Add userId to the data
    const illegalrequest = await reportIllegalDump(illegalData);
    res.status(201).json(illegalrequest)
  
  }catch(error){
    res.status(400).json({message:error.message})
  }
};


export const fetchAllIllegalEntries =async (req,res) =>{
  try{
    const illegalEntries = await getAllIllegalEntries();
    res.status(200).json(illegalEntries)
  
  }catch(error){
    res.status(400).json({message:error.message})
  }
}

export const viewIllegalStatusV2 = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: Missing user ID" });
    }

    const userId = req.user.id;
    const statusInfo = await getIllegalStatusV2(userId);
    res.status(200).json(statusInfo);
  } catch (error) {
    console.error("--- UNHANDLED ERROR IN viewIllegalStatusV2 ---");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    console.error("Full Error Object:", error);
    console.error("--- END OF ERROR ---");
    res.status(400).json({ 
        errorMessage: error.message 
    });
  }
};

export const editIllegalEntryById = async (req,res) => {
  try{
    const updatedIllegalEntry = await updateIllegalEntryById(req.params.id, req.body);
    res.status(200).json(updatedIllegalEntry)
  }catch(error){
    res.status(400).json({message:error.message})
  } 
}


export const removeIllegalEntry = async (req,res) => {
  try{
    const deletedEntry = await deleteIllegalEntry(req.params.id); 
    if(!deletedEntry){
      return res.status(404).json({message:"Illegal entry not found"})
    }
    res.status(200).json(deletedEntry)
  }catch(error){
    res.status(400).json({message:error.message})
  }  
}

export const deleteAll = async (req, res) => {
  try{
    const dumps = await deleteAllDump(req.params.id)
    if (!dumps) {
      return res.status(404).json({message: "not found"})
    }
    res.status(200).json({message: "successful"})
  }catch(error){
    res.status(400).json({message: error.message})
  }
}

// cOllector Section

// controllers/dumpController.j

export const acceptIllegalDumpRequest = async (req, res) => {
  const {dumpId, collectorAssayId}= req.body
  try{
    const acceptedDump = await acceptDumpRequestService(dumpId, collectorAssayId);
    res.status(200).json(acceptedDump);
  }catch(error){
    res.status(400).json({message:error.message})
  }
}


export const rejectIllegalDumpRequest = async (req, res) => {
  const { dumpId, collectorAssayId, rejectionReason } = req.body;
  try {
    const rejectedDump = await rejectDumpRequestService(dumpId, collectorAssayId, rejectionReason);
    res.status(200).json(rejectedDump);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export const resolveDumpingRequest = async (req, res) => {
  const {dumpId, collectorAssayId} = req.body
  try{
     const resolveDump = await resolveDumpRequestService(dumpId, collectorAssayId)
     res.status(200).json(resolveDump)
  }catch(error){
   res.status(400).json({message:error.message})
  }
}

export const getDumpRequestToCollectorController = async (req, res) => {
  try {
    const { collectorAssayId } = req.params;

    if (!collectorAssayId) {
      return res.status(400).json({ error: 'Missing required parameters: collectorAssayId' });
    }

    const loggedInUser = req.user;

    const dumpRequests = await getDumpRequestToCollector(collectorAssayId);

    return res.status(200).json({
      success: true,
      user: {
        id: loggedInUser._id,
        name: loggedInUser.name,
        email: loggedInUser.email
      },
      data: dumpRequests
    });
  } catch (error) {
    console.error('Error fetching dump requests:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
};
