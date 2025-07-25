// models/Thread.mjs
import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'model'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const ThreadSchema = new mongoose.Schema({
    threadId: {
        type: String,
        required: true,
        unique: true
    },
    userId: { // Add this field
        type: mongoose.Schema.Types.ObjectId, // References the User model's _id
        ref: 'User', // Reference to the User model
        required: true // A thread must belong to a user
    },
    title: {
        type: String,
        default: 'New Chat'
    },
    messages: [MessageSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update `updatedAt` on every save
ThreadSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Thread = mongoose.model('Thread', ThreadSchema);
export default Thread;