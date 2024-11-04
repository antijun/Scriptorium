import prisma from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

// used chatGPT to replace previous authentication logic with new one

const SECRET_KEY = process.env.JWT_SECRET;

export default async function handler(req, res) {
    const { id } = req.query;  // Template ID from the URL
    const { title, description, code, tags } = req.body;

    // Only allow PUT and DELETE methods for this endpoint
    if (req.method !== 'PUT' && req.method !== 'DELETE') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // Get the JWT token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    let userId;

    try {
        // Verify the token and retrieve user ID from it
        const decoded = jwt.verify(token, SECRET_KEY);
        userId = decoded.userId;
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }

    try {
        // Fetch the template to ensure it belongs to the authenticated user
        const template = await prisma.codeTemplate.findUnique({
            where: { id: parseInt(id) },
            include: { user: true }, // Fetch the template's user for ownership verification
        });

        if (!template) {
            return res.status(404).json({ message: 'Template not found.' });
        }

        // Ensure the user owns the template
        if (template.user.id !== userId) {
            return res.status(403).json({ message: 'You do not have permission to edit or delete this template.' });
        }

        // Handle updating (PUT)
        if (req.method === 'PUT') {
            const updatedTemplate = await prisma.codeTemplate.update({
                where: { id: parseInt(id) },
                data: {
                    title: title || template.title,
                    description: description || template.description,
                    code: code || template.code,
                    tags: {
                        deleteMany: {},  // Remove existing tags
                        create: tags.map((tag) => ({ tag })),  // Add new tags
                    },
                },
                include: { tags: true },  // Include updated tags in response
            });

            return res.status(200).json({ message: 'Template updated successfully', template: updatedTemplate });
        }

        // Handle deleting (DELETE)
        if (req.method === 'DELETE') {
            await prisma.codeTemplate.delete({
                where: { id: parseInt(id) },
            });

            return res.status(200).json({ message: 'Template deleted successfully' });
        }
    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ message: 'An error occurred while processing the request.' });
    }
}
