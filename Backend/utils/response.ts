export const responseObj = (success:boolean, data:any, message: string, error = []) => {
    if (message === null) message = "Successfully Processed";
    return {
      success,
      data,
      message,
      error,
    };
  };