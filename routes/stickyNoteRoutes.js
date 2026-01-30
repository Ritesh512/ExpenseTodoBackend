import express from "express";
import {
  createStickyNote,
  getStickyNotes,
  updateStickyNote,
  deleteStickyNote,
} from "../controller/stickyNoteController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(auth);
router.post("/", createStickyNote);
router.get("/", getStickyNotes);
router.put("/:id", updateStickyNote);
router.delete("/:id", deleteStickyNote);

export default router;
