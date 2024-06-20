import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
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
    threads: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Thread'
        }
    ],
    onboarded: {
        type: Boolean,
        default: false,
    },
    communities: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Community'
        }
    ],
    likedThreads: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Thread'
        }
    ]
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema)

export default User