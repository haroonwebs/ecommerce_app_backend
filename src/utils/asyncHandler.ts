import { Request, Response, NextFunction } from "express";

const asyncHandler = (requestHandler: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};
export { asyncHandler };
// const asyncHandler =
//   (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
//     try {
//     } catch (err: any) {
//       res.status(err.code || 500).json({
//         success: false,
//         message: err.message || "Internal Server Error",
//       });
//     }
//   };
