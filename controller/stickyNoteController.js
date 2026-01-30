import StickyNote from "../models/StickyNote.js";

/* ================= CREATE NOTE ================= */
export const createStickyNote = async (req, res) => {
  try {
    const userId = req.userId;
    const { content, color, rotation, position, pinned } = req.body;

    const note = await StickyNote.create({
      userId,
      content,
      color,
      rotation,
      position, 
      pinned
    });

    res.status(201).json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create sticky note" });
  }
};

/* ================= GET USER NOTES ================= */
export const getStickyNotes = async (req, res) => {
  try {
    const userId = req.userId;

    const notes = await StickyNote.find({ userId }).sort({
      createdAt: -1,
    });

    res.status(200).json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch sticky notes" });
  }
};

/* ================= UPDATE NOTE ================= */
export const updateStickyNote = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { content, color } = req.body;

    const updatedNote = await StickyNote.findOneAndUpdate(
      { _id: id, userId },
      { content, color },
      { new: true }
    );

    if (!updatedNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json(updatedNote);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update sticky note" });
  }
};

/* ================= DELETE NOTE ================= */
export const deleteStickyNote = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const deleted = await StickyNote.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json({ message: "Sticky note deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete sticky note" });
  }
};
