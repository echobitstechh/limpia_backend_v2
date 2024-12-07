import { Request, Response } from 'express';
import {AllEnums} from "@src/models/enum/enums";


export const getEnums = (req: Request, res: Response) => {
    try {
        const { enumType } = req.query;

        if (enumType) {
            const selectedEnum = AllEnums[enumType as keyof typeof AllEnums];
            if (!selectedEnum) {
                return res.status(404).json({
                    status: 404,
                    message: `Enum type "${enumType}" not found.`,
                });
            }

            return res.status(200).json({
                status: 200,
                message: `Enum type "${enumType}" retrieved successfully.`,
                enum: selectedEnum,
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'All enums retrieved successfully.',
            enums: AllEnums,
        });
    } catch (error) {
        console.error('Error fetching enums:', error);
        res.status(500).json({
            status: 500,
            message: 'Error fetching enums.',
            error: error.message,
        });
    }
};
