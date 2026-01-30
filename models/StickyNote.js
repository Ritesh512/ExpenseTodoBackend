import mongoose from "mongoose";

const stickyNoteSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        content: {
            type: String,
            trim: true,
            default: "",
        },

        color: {
            type: String,
            default: "#FFF9A9", // pastel yellow
        },

        rotation: {
            type: Number,
            default: 0,
        },
        position: {
            x: { type: Number, default: 0 },
            y: { type: Number, default: 0 },
        },
        pinned: {
            type: Boolean,
            default: false,
        }
    },
    { timestamps: true }
);

const StickyNote = mongoose.model("StickyNote", stickyNoteSchema);

export default StickyNote;
