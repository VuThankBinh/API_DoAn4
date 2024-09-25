const crypto = require('crypto');

class ClassUtils {
    // Generate a random class ID
    static generateClassId() {
        return crypto.randomBytes(3).toString('hex');
    }

    // Validate class name
    static validateClassName(name) {
        return typeof name === 'string' && name.trim().length > 0;
    }

    // Validate teacher email
    static validateTeacherEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Check if a user is a member of a class
    static isUserInClass(classObj, userEmail) {
        return classObj.users.includes(userEmail);
    }

    // Check if a user is the teacher of a class
    static isUserTeacherOfClass(classObj, userEmail) {
        return classObj.teacher === userEmail;
    }

    // Format class data for response
    static formatClassData(classObj) {
        return {
            id: classObj._id,
            name: classObj.name,
            class_id: classObj.class_id,
            teacher: classObj.teacher,
            userCount: classObj.users.length
        };
    }
}

module.exports = ClassUtils;
