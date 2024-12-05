/**
 * Processes and uploads images from base64 strings.
 * @param images - An array of base64 image strings.
 * @param currentImages - The existing images already stored.
 * @returns A promise that resolves to the updated array of image URLs.
 */

import { uploadPropertyToCloudinary } from "../controllers/Property/property";

export const processAndUploadImages = async (images: string[], currentImages: string[]): Promise<string[]> => {
    if (!Array.isArray(images) || images.length === 0) {
        return currentImages;
    }

    const uploadPromises = images.map(async (base64Image) => {
        try {
            let base64Prefix;
            let isImageFormatValid = false;

            // Validate base64 format
            if (base64Image.startsWith('data:image/jpeg;base64,')) {
                base64Image = base64Image.replace('data:image/jpeg;base64,', '');
                base64Prefix = 'data:image/jpeg;base64,';
                isImageFormatValid = true;
            } else if (base64Image.startsWith('data:image/png;base64,')) {
                base64Image = base64Image.replace('data:image/png;base64,', '');
                base64Prefix = 'data:image/png;base64,';
                isImageFormatValid = true;
            } else if (base64Image.startsWith('/9j/')) {
                base64Prefix = 'data:image/jpeg;base64,';
                isImageFormatValid = true;
            } else if (base64Image.startsWith('iVBORw0KGgo=')) {
                base64Prefix = 'data:image/png;base64,';
                isImageFormatValid = true;
            }

            if (!isImageFormatValid) {
                return Promise.reject('Unsupported image format. Only .jpeg and .png are allowed.');
            }

            const prefixedBase64Image = base64Prefix + base64Image;
            return await uploadPropertyToCloudinary(prefixedBase64Image, 'properties');
        } catch (error) {
            console.error('Error uploading image:', error);
            return Promise.reject('Failed to upload one or more images');
        }
    });

    const uploadedImages = await Promise.all(uploadPromises);
    return uploadedImages;
};