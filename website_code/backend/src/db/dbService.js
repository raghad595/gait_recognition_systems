export const find = async ({
    model,
    filter = {},
    select = "",
    populate = [],
} = {}) => {
    return await model.find(filter).select(select).populate(populate);
};

export const findOne = async ({
    model,
    filter = {},
    select = "",
    populate = [],
} = {}) => {
    return await model.findOne(filter).select(select).populate(populate);
};

export const findById = async ({
    model,
    id = "",
    select = "",
    populate = [],
} = {}) => {
    return await model.findById(id).select(select).populate(populate);
};

export const create = async ({
    model,
    data = [{}],
    options = {validateBeforeSave:true}
} = {}) => {
    const isArrayInput = Array.isArray(data);
    const payload = isArrayInput ? data : [data];
    const createdDocs = await model.create(payload, options);
    return isArrayInput ? createdDocs : createdDocs[0];
}

export const updateOne = async ({
    model, 
    filter = {},
    data = {},
    options = {runValidators:true}
} = {}) => {
    return await model.updateOne(filter,data,options);
}

export const findOneAndUpdate = async ({
    model,
    filter = {},
    data = {},
    select = "",
    options = {new:true,runValidators:true},
    populate = [],
} = {}) => {
    return await model
    .findOneAndUpdate(filter, {...data,$inc:{__v:1}}, options)
    .select(select)
    .populate(populate);
};

export const deleteMany = async({
    model,
    filter = {},
}={})=>{
    return await model.deleteMany(filter);
};

export const deleteOne = async ({
    model, 
    filter = {},
} = {}) => {
    return await model.deleteOne(filter);
}
