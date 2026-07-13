import { createRequire } from "module";
const require = createRequire(import.meta.url);
const CryptoJS = require("crypto-js");

export const encrypt = (plainText) =>{
    return CryptoJS.AES.encrypt(plainText, process.env.ENCRYPTION_KEY).toString();
}
export const decrypt = (cipherText) =>{
    return CryptoJS.AES.decrypt(cipherText, process.env.ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
}