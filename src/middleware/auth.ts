import { Request, Response, NextFunction } from 'express';
import jwt from "jsonwebtoken";


export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
             res.status(401).json({ message: 'Unauthorized, add token ', status: 401 });
            return
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
         req.user = decoded as { id: string; role: string };
        next();
        return;
    } catch (err) {
         res.status(401).json({ message: 'Invalid token' });
        return
    }
};
