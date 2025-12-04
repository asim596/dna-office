import { Router } from 'express'
import { db } from '../db/index.js'
import { persons, familyTrees } from '../db/schema.js'
import { eq, and, desc, sql } from 'drizzle-orm'
import { authenticateToken } from '../middleware/auth.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { body, validationResult } from 'express-validator'

const router = Router()

router.get('/tree/:treeId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId
    const { treeId } = req.params

    const tree = await db
      .select()
      .from(familyTrees)
      .where(and(eq(familyTrees.id, treeId), eq(familyTrees.isDeleted, false)))
      .limit(1)

    if (tree.length === 0) {
      return res.status(404).json({ success: false, message: 'Family tree not found' })
    }

    if (tree[0].userId !== userId && tree[0].privacyLevel === 'private') {
      return res.status(403).json({ success: false, message: 'Access denied to this family tree' })
    }

    const rows = await db
      .select({
        id: persons.id,
        firstName: persons.firstName,
        lastName: persons.lastName,
        middleName: persons.middleName,
        birthDate: persons.birthDate,
        deathDate: persons.deathDate,
        birthLocation: persons.birthLocation,
        deathLocation: persons.deathLocation,
        gender: persons.gender,
        biography: persons.biography,
        notes: persons.notes,
        privacyLevel: persons.privacyLevel,
        createdAt: persons.createdAt,
        updatedAt: persons.updatedAt,
      })
      .from(persons)
      .where(and(eq(persons.treeId, treeId), eq(persons.isDeleted, false)))
      .orderBy(desc(persons.createdAt))

    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch persons' })
  }
})

router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    const row = await db
      .select({
        id: persons.id,
        firstName: persons.firstName,
        lastName: persons.lastName,
        middleName: persons.middleName,
        birthDate: persons.birthDate,
        deathDate: persons.deathDate,
        birthLocation: persons.birthLocation,
        deathLocation: persons.deathLocation,
        gender: persons.gender,
        biography: persons.biography,
        notes: persons.notes,
        privacyLevel: persons.privacyLevel,
        treeId: persons.treeId,
        createdAt: persons.createdAt,
        updatedAt: persons.updatedAt,
        ownerId: familyTrees.userId,
        treePrivacy: familyTrees.privacyLevel,
      })
      .from(persons)
      .innerJoin(familyTrees, eq(persons.treeId, familyTrees.id))
      .where(and(eq(persons.id, id), eq(persons.isDeleted, false), eq(familyTrees.isDeleted, false)))
      .limit(1)

    if (row.length === 0) {
      return res.status(404).json({ success: false, message: 'Person not found' })
    }

    if (row[0].ownerId !== userId && row[0].treePrivacy === 'private') {
      return res.status(403).json({ success: false, message: 'Access denied to this person' })
    }

    res.json({ success: true, data: row[0] })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch person' })
  }
})

router.post(
  '/',
  authenticateToken,
  [
    body('treeId').isUUID(),
    body('firstName').isLength({ min: 1, max: 100 }),
    body('lastName').isLength({ min: 1, max: 100 }),
    body('gender').optional().isIn(['male', 'female', 'unknown']),
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() })
      }

      const userId = req.user!.userId
      const {
        treeId,
        firstName,
        lastName,
        middleName,
        birthDate,
        deathDate,
        birthLocation,
        deathLocation,
        gender,
        biography,
        notes,
        privacyLevel = 'private',
      } = req.body

      const tree = await db
        .select()
        .from(familyTrees)
        .where(and(eq(familyTrees.id, treeId), eq(familyTrees.userId, userId), eq(familyTrees.isDeleted, false)))
        .limit(1)

      if (tree.length === 0) {
        return res.status(404).json({ success: false, message: 'Family tree not found or access denied' })
      }

      const [created] = await db
        .insert(persons)
        .values({
          treeId,
          firstName,
          lastName,
          middleName,
          birthDate,
          deathDate,
          birthLocation,
          deathLocation,
          gender,
          biography,
          notes,
          privacyLevel,
          createdBy: userId,
        } as any)
        .returning()

      await db
        .update(familyTrees)
        .set({ updatedAt: new Date() } as any)
        .where(eq(familyTrees.id, treeId))

      res.status(201).json({ success: true, data: created })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create person' })
    }
  }
)

router.put(
  '/:id',
  authenticateToken,
  [
    body('firstName').optional().isLength({ min: 1, max: 100 }),
    body('lastName').optional().isLength({ min: 1, max: 100 }),
    body('gender').optional().isIn(['male', 'female', 'unknown']),
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() })
      }

      const userId = req.user!.userId
      const { id } = req.params

      const existing = await db
        .select({ treeOwnerId: familyTrees.userId })
        .from(persons)
        .innerJoin(familyTrees, eq(persons.treeId, familyTrees.id))
        .where(and(eq(persons.id, id), eq(persons.isDeleted, false), eq(familyTrees.isDeleted, false)))
        .limit(1)

      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Person not found' })
      }

      if (existing[0].treeOwnerId !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied to update this person' })
      }

      const updates: any = {}
      const fields = [
        'firstName',
        'lastName',
        'middleName',
        'birthDate',
        'deathDate',
        'birthLocation',
        'deathLocation',
        'gender',
        'biography',
        'notes',
        'privacyLevel',
      ]
      for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f]
      updates.updatedAt = new Date()

      const [updated] = await db.update(persons).set(updates).where(eq(persons.id, id)).returning()

      res.json({ success: true, data: updated })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update person' })
    }
  }
)

router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    const row = await db
      .select({ treeId: persons.treeId, ownerId: familyTrees.userId })
      .from(persons)
      .innerJoin(familyTrees, eq(persons.treeId, familyTrees.id))
      .where(and(eq(persons.id, id), eq(persons.isDeleted, false), eq(familyTrees.isDeleted, false)))
      .limit(1)

    if (row.length === 0) {
      return res.status(404).json({ success: false, message: 'Person not found' })
    }

    if (row[0].ownerId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied to delete this person' })
    }

    await db.update(persons).set({ isDeleted: true } as any).where(eq(persons.id, id))

    await db
      .update(familyTrees)
      .set({ updatedAt: new Date() } as any)
      .where(eq(familyTrees.id, row[0].treeId))

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete person' })
  }
})

export default router
