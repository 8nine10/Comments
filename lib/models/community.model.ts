import mongoose from "mongoose"

const communitySchema = new mongoose.Schema({
    id: {
        type: String,
        requied: true,
    },
    username: {
        type: String,
        requied: true,
        unique: true,
    },
    name: {
        type: String,
        requied: true,
    },
    image: {
        type: String,
    },
    bio: {
        type: String,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    threads: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Thread'
        }
    ],
    memebers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }
    ],
});

const Community = mongoose.models.Community || mongoose.model('Community', communitySchema)

export default Community