import {createWasteRequest, getAllWasteEntries, getWasteEntryById, getWasteStatus, updatewaste, deleteWasteEntry} from "../services/waste.services.js";

export const createNewWaste = async (req, res) => {
  try {
    const wasteRequest = await createWasteRequest(req.body);
    res.status(201).json(wasteRequest);
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

export const fetchWasteEntryById = async (req, res) => {
  try {
    const wasteEntry = await getWasteEntryById(req.params.id);
    if (!wasteEntry) {
      return res.status(404).json({ message: "Waste entry not found" });
    }
    res.status(200).json(wasteEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const viewWasteStatus = async (req, res) => {
  try {
    const wasteId = req.params.id;
    // const userId = req.user._id;

    const statusInfo = await getWasteStatus(wasteId);
    res.status(200).json(statusInfo);
  } catch (error) {
    res.status(404).json({ message: error.message });
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