import bcrypt from "bcryptjs";

export const hash = async({
    plainText = "" , 
    saltRounds = Number(process.env.SALT),
})=>{
    return await bcrypt.hash(plainText,saltRounds);
}
export const compare = async({plainText = "" , hash = ""})=>{
    return await bcrypt.compare(plainText,hash);
}