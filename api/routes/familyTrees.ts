import { Router } from 'express';
import { db } from '../db/index.js';
import { familyTrees, persons, relationships, users } from '../db/schema.js';
import { eq, and, desc, count } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { body, validationResult } from 'express-validator';

const router = Router();

// Get all family trees for the authenticated user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    
    const userTrees = await db
      .select({
        id: familyTrees.id,
        name: familyTrees.name,
        description: familyTrees.description,
        privacyLevel: familyTrees.privacyLevel,
        personCount: familyTrees.personCount,
        createdAt: familyTrees.createdAt,
        updatedAt: familyTrees.updatedAt,
      })
      .from(familyTrees)
      .where(and(
        eq(familyTrees.userId, userId),
        eq(familyTrees.isDeleted, false)
      ))
      .orderBy(desc(familyTrees.updatedAt));

    res.json({
      success: true,
      data: userTrees
    });
  } catch (error) {
    console.error('Error fetching family trees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch family trees'
    });
  }
});

// Create a new family tree
router.post('/', 
  authenticateToken,
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Tree name must be between 1 and 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('privacyLevel')
      .optional()
      .isIn(['private', 'public', 'shared'])
      .withMessage('Privacy level must be private, public, or shared')
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const userId = req.user!.userId;
      const { name, description, privacyLevel = 'private' } = req.body;

      const [newTree] = await db
        .insert(familyTrees)
        .values({
          userId,
          name,
          description,
          privacyLevel,
          personCount: 0
        } as any)
        .returning();

      res.status(201).json({
        success: true,
        data: newTree,
        message: 'Family tree created successfully'
      });
    } catch (error) {
      console.error('Error creating family tree:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create family tree'
      });
    }
  }
);

// Get a specific family tree with basic statistics
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const tree = await db
      .select({
        id: familyTrees.id,
        name: familyTrees.name,
        description: familyTrees.description,
        privacyLevel: familyTrees.privacyLevel,
        personCount: familyTrees.personCount,
        createdAt: familyTrees.createdAt,
        updatedAt: familyTrees.updatedAt,
        userId: familyTrees.userId,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(familyTrees)
      .innerJoin(users, eq(familyTrees.userId, users.id))
      .where(and(
        eq(familyTrees.id, id),
        eq(familyTrees.isDeleted, false)
      ))
      .limit(1);

    if (tree.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Family tree not found'
      });
    }

    // Check if user has access to this tree
    if (tree[0].userId !== userId && tree[0].privacyLevel === 'private') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this family tree'
      });
    }

    res.json({
      success: true,
      data: tree[0]
    });
  } catch (error) {
    console.error('Error fetching family tree:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch family tree'
    });
  }
});

// Update a family tree
router.put('/:id',
  authenticateToken,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Tree name must be between 1 and 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('privacyLevel')
      .optional()
      .isIn(['private', 'public', 'shared'])
      .withMessage('Privacy level must be private, public, or shared')
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { id } = req.params;
      const updates: any = {};
      
      // Only include provided fields
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.privacyLevel !== undefined) updates.privacyLevel = req.body.privacyLevel;
      updates.updatedAt = new Date();

      // Check if tree exists and belongs to user
      const existingTree = await db
        .select()
        .from(familyTrees)
        .where(and(
          eq(familyTrees.id, id),
          eq(familyTrees.userId, userId),
          eq(familyTrees.isDeleted, false)
        ))
        .limit(1);

      if (existingTree.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Family tree not found or access denied'
        });
      }

      const [updatedTree] = await db
        .update(familyTrees)
        .set(updates as any)
        .where(eq(familyTrees.id, id))
        .returning();

      res.json({
        success: true,
        data: updatedTree,
        message: 'Family tree updated successfully'
      });
    } catch (error) {
      console.error('Error updating family tree:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update family tree'
      });
    }
  }
);

// Soft delete a family tree
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Check if tree exists and belongs to user
    const existingTree = await db
      .select()
      .from(familyTrees)
      .where(and(
        eq(familyTrees.id, id),
        eq(familyTrees.userId, userId),
        eq(familyTrees.isDeleted, false)
      ))
      .limit(1);

    if (existingTree.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Family tree not found or access denied'
      });
    }

    await db
      .update(familyTrees)
      .set({
        isDeleted: true,
        deletedAt: new Date()
      } as any)
      .where(eq(familyTrees.id, id));

    res.json({
      success: true,
      message: 'Family tree deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting family tree:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete family tree'
    });
  }
});

// Get tree statistics
router.get('/:id/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Verify tree access
    const tree = await db
      .select()
      .from(familyTrees)
      .where(and(
        eq(familyTrees.id, id),
        eq(familyTrees.isDeleted, false)
      ))
      .limit(1);

    if (tree.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Family tree not found'
      });
    }

    if (tree[0].userId !== userId && tree[0].privacyLevel === 'private') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this family tree'
      });
    }

    const [{ totalPersons }] = await db
      .select({ totalPersons: count() })
      .from(persons)
      .where(and(eq(persons.treeId, id), eq(persons.isDeleted, false)))

    const [{ maleCount }] = await db
      .select({ maleCount: count() })
      .from(persons)
      .where(and(eq(persons.treeId, id), eq(persons.isDeleted, false), eq(persons.gender, 'male')))

    const [{ femaleCount }] = await db
      .select({ femaleCount: count() })
      .from(persons)
      .where(and(eq(persons.treeId, id), eq(persons.isDeleted, false), eq(persons.gender, 'female')))

    const [{ unknownCount }] = await db
      .select({ unknownCount: count() })
      .from(persons)
      .where(and(eq(persons.treeId, id), eq(persons.isDeleted, false), eq(persons.gender, 'unknown')))

    const [{ totalRelationships }] = await db
      .select({ totalRelationships: count() })
      .from(relationships)
      .innerJoin(persons, eq(relationships.personId, persons.id))
      .where(and(eq(persons.treeId, id), eq(persons.isDeleted, false)))

    res.json({
      success: true,
      data: {
        persons: {
          total: totalPersons,
          male: maleCount,
          female: femaleCount,
          unknown: unknownCount,
        },
        relationships: { total: totalRelationships }
      }
    });
  } catch (error) {
    console.error('Error fetching tree statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tree statistics'
    });
  }
});

export default router;
