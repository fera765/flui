"use strict";
/**
 * ID Generation Utility
 * Centralized ID generation to avoid ESM issues with nanoid in Jest
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.generateShortId = generateShortId;
exports.generateUUID = generateUUID;
var crypto_1 = require("crypto");
/**
 * Generate a unique ID (16 characters)
 */
function generateId() {
    return (0, crypto_1.randomBytes)(8).toString('hex');
}
/**
 * Generate a short ID (8 characters)
 */
function generateShortId() {
    return (0, crypto_1.randomBytes)(4).toString('hex');
}
/**
 * Generate a UUID v4
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = ((0, crypto_1.randomBytes)(1)[0] % 16) | 0;
        var v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
