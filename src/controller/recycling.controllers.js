
import {createRecycleRequest, getAllRecycleEntries,  updateRecycle, deleteRecycleEntry, acceptRecycleRequestService, rejectRecycleRequestService, routecollectorService, collectRecycleRequest, deleteAllUser, getRecycleStatusV2, getRecycleRequestToCollector} from "../services/recycling.service.js";

export const createNewRecycle = async (req, res) => {
  try {
    const userId = req.user._id; // Get user ID from auth middleware
    const recycleData = { ...req.body, userId }; // Add userId to the data
    const recycleRequest = await createRecycleRequest(recycleData);
    res.status(201).json(recycleRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const fetchAllRecycleEntries = async (req, res) => {
  try {
    const recycleEntries = await getAllRecycleEntries();
    res.status(200).json(recycleEntries);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



export const viewRecycleStatusV2 = async (req,res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: Missing user ID" });
    }

    const userId = req.user.id;
    const statusInfo = await getRecycleStatusV2(userId);
    res.status(200).json(statusInfo);
  } catch (error) {
    console.error("--- UNHANDLED ERROR IN viewRecycleStatusV2 ---");
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

export const editRecycle= async (req, res) => {
  try {
    const updatedWaste = await updateRecycle(req.params.id, req.body);
    res.status(200).json(updatedWaste);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const removeRecycleEntry = async (req, res) => {
  try {
    const deletedEntry = await deleteRecycleEntry(req.params.id);
    if (!deletedEntry) {
      return res.status(404).json({ message: "Recycle entry not found" });
    }
    res.status(200).json({ message: "Recycle entry deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteAll = async (req, res) => {
  try{
    const users = await deleteAllUser(req.params.id)
    if (!users) {
      return res.status(404).json({message: "not found"})
    }
    res.status(200).json({message: "successful"})
  }catch(error){
    res.status(400).json({message: error.message})
  }
}

// Collector Section

export const acceptRecycleRequest = async (req, res) => {
  const {recycleId, collectorAssayId}= req.body
  try{
    const acceptedRecycle = await acceptRecycleRequestService(recycleId, collectorAssayId);
    res.status(200).json(acceptedRecycle);
  }catch(error){
    res.status(400).json({message:error.message})
  }
}

export const rejectRecycleRequest = async (req, res) => {
  const {recycleId, collectorAssayId, rejectionReason} = req.body
  try{
    const rejectedRecycle = await rejectRecycleRequestService(recycleId, collectorAssayId, rejectionReason);
    res.status(200).json(rejectedRecycle);
  }catch(error){
    res.status(400).json({message: error.message})
  }
};

export const routeRecycleRequest = async (req, res) => {
  const { recycleId, collectorAssayId } = req.body;
  try{
   const route = await routecollectorService(recycleId, collectorAssayId);
    res.status(200).json({ message: "Recycle request en routed", data: route })
  }catch(error){
    res. status(400).json({error: error.message})
  }
}

export const collectrecycleRquest = async (req, res) => {
  const {recycleId, collectorAssayId}= req.body;
  try{
   const collect = await collectRecycleRequest(recycleId, collectorAssayId)
   res.status(200).json({mesaage: "Recycle request collected", data: collect})
  }catch(error){
  res.status(400).json({error: error.message})
  }
}

export const getRecycleRequestToCollectorController = async (req, res) => {
  try {
    const { collectorAssayId } = req.params;

    if (!collectorAssayId) {
      return res.status(400).json({ error: 'Missing required parameters: collectorAssayId' });
    }

    const loggedInUser = req.user;

    const recycleRequests = await getRecycleRequestToCollector(collectorAssayId);

    return res.status(200).json({
      success: true,
      user: {
        id: loggedInUser._id,
        name: loggedInUser.name,
        email: loggedInUser.email
      },
      data: recycleRequests
    });
  } catch (error) {
    console.error('Error fetching recycle requests:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
};

