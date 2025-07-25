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
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
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


ThreadSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Thread = mongoose.model('Thread', ThreadSchema);
export default Thread;