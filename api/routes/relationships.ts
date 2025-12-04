import { Router } from 'express';
import { db } from '../db/index.js';
import { relationships, persons, familyTrees } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../middleware/auth.js'

const router = Router();

// Get relationships for a person
router.get('/person/:personId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { personId } = req.params;

    // Verify person access
    const personAccess = await db
      .select({
        personId: persons.id,
        treeOwnerId: familyTrees.userId,
        treePrivacyLevel: familyTrees.privacyLevel
      })
      .from(persons)
      .innerJoin(familyTrees, eq(persons.treeId, familyTrees.id))
      .where(and(
        eq(persons.id, personId),
        eq(persons.isDeleted, false),
        eq(familyTrees.isDeleted, false)
      ))
      .limit(1);

    if (personAccess.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Person not found'
      });
    }

    if (personAccess[0].treeOwnerId !== userId && personAccess[0].treePrivacyLevel === 'private') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this person'
      });
    }

    const personRelationships = await db
      .select({
        id: relationships.id,
        relatedPersonId: relationships.relatedPersonId,
        relationshipType: relationships.relationshipType,
        isBiological: relationships.isBiological,
        createdAt: relationships.createdAt,
        relatedPersonFirstName: persons.firstName,
        relatedPersonLastName: persons.lastName,
      })
      .from(relationships)
      .innerJoin(persons, eq(relationships.relatedPersonId, persons.id))
      .where(and(
        eq(relationships.personId, personId),
        eq(persons.isDeleted, false)
      ));

    res.json({
      success: true,
      data: personRelationships
    });
  } catch (error) {
    console.error('Error fetching relationships:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch relationships'
    });
  }
});

export default router;
