export const successResponse = ({res,statusCode = 200,message = "Done",data = {}} = {})=>{
        return res.status(statusCode).json({
                success: true,
                data,
                message,
                error: null
        });
};
