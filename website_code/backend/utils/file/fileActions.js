import fs from 'node:fs';
import path from 'node:path';

/**
 * Safely deletes a file from the local filesystem
 * @param {string} filePath - Absolute or relative path to the file
 */
export const deleteFile = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (error) {
            console.error(`Failed to delete temporary file at ${filePath}:`, error.message);
        }
    }
};
