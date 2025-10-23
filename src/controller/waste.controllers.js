import CollectorAssay from "../model/collectorAssay.js";
import {createWasteRequest, getAllWasteEntries, getWasteStatusV2, updatewaste, deleteWasteEntry,acceptWasteRequestService, rejectWasteRequestService, getCollectorStat, collectWasteRequest, routecollectorService, deleteAllUser, getWasteRequestToCollector} from "../services/waste.services.js";


export const createNewWaste = async (req, res) => {
  try {
    const userId = req.user._id; // securely extracted from auth middleware
    const wasteData = { ...req.body, userId }; // inject userId into the payload
    
    const wasteRequest = await createWasteRequest(wasteData);
    res.status(201).json({ success: true, message: "request successfully created", data: wasteRequest });
    
    
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const fetchAllWasteEntries = async (req, res) => {
  try {
    const wasteEntries = await getAllWasteEntries();
    res.status(200).json(wasteEntries);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



export const viewWasteStatusV2 = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: Missing user ID" });
    }

    const userId = req.user.id;
    const statusInfo = await getWasteStatusV2(userId);
    res.status(200).json(statusInfo);
  } catch (error) {
    console.error("--- UNHANDLED ERROR IN viewWasteStatusV2 ---");
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


export const editWaste = async (req, res) => {
  try {
    const updatedWaste = await updatewaste(req.params.id, req.body);
    res.status(200).json(updatedWaste);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const removeWasteEntry = async (req, res) => {
  try {
    const deletedEntry = await deleteWasteEntry(req.params.id);
    if (!deletedEntry) {
      return res.status(404).json({ message: "Waste entry not found" });
    }
    res.status(200).json({ message: "Waste entry deleted successfully" });
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

export const acceptWasteRequest = async (req, res) => {
  const { wasteId, collectorAssayId } = req.body;

  try {
    const result = await acceptWasteRequestService(wasteId, collectorAssayId);
    res.status(200).json({ message: "Waste request accepted", data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const rejectWasteRequest = async (req, res) => {
  const { wasteId, collectorAssayId, rejectionReason } = req.body;

  try {
    const result = await rejectWasteRequestService(wasteId, collectorAssayId, rejectionReason);
    res.status(200).json({ message: "Waste request rejected", data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const collectorView = async (req, res) => {
  try {
    const collectorDet = await getCollectorStat(req.params.id);
     if (!collectorDet) {
      return res.status(404).json({ message: "CollectorAssay not found for this user" });
    }
    res.status(200).json(collectorDet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export const routeWasteRequest = async (req, res) => {
  const { wasteId, collectorAssayId } = req.body;
  try{
   const route = await routecollectorService(wasteId, collectorAssayId);
    res.status(200).json({ message: "Waste request en routed", data: route })
  }catch(error){
    res. status(400).json({error: error.message})
  }
}

export const collectWasteRquest = async (req, res) => {
  const {wasteId, collectorAssayId}= req.body;
  try{
   const collect = await collectWasteRequest(wasteId, collectorAssayId)
   res.status(200).json({mesaage: "Waste request collected", data: collect})
  }catch(error){
  res.status(400).json({error: error.message})
  }
}




export const getWasteRequestToCollectorController = async (req, res) => {
  try {
    const { collectorAssayId } = req.params;

    if (!collectorAssayId) {
      return res.status(400).json({ error: 'Missing required parameters: collectorAssayId' });
    }

    const loggedInUser = req.user; // Comes from middleware

    const wasteRequests = await getWasteRequestToCollector(collectorAssayId);

    return res.status(200).json({
      success: true,
      user: {
        id: loggedInUser._id,
        name: loggedInUser.name,
        email: loggedInUser.email
      },
      data: wasteRequests
    });
  } catch (error) {
    console.error('Error fetching waste requests:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
};