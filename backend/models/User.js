const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, minlength: 1 },
    email: { type: String, required: true, minlength: 3, unique: true },
    password: { type: String, required: true, minlength: 3 },
    status: { type: String, enum: ['online', 'offline'], default: 'offline' },
    lastActivityAt: { type: Date, default: Date.now }
});

// Virtual getter for display name that falls back to email username part
userSchema.virtual('displayName').get(function() {
    return this.name || this.email.split('@')[0];
});

module.exports = mongoose.model('User', userSchema);