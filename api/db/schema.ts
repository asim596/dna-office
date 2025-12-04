import { pgTable, uuid, varchar, text, boolean, timestamp, date, integer, decimal, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  dateOfBirth: date('date_of_birth'),
  accountType: varchar('account_type', { length: 20 }).default('free').$type<'free' | 'premium' | 'professional'>(),
  emailVerified: boolean('email_verified').default(false),
  privacyLevel: varchar('privacy_level', { length: 20 }).default('private').$type<'private' | 'public' | 'shared'>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
  isActive: boolean('is_active').default(true),
  gdprConsent: boolean('gdpr_consent').default(false),
  marketingConsent: boolean('marketing_consent').default(false),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  activeIdx: index('idx_users_active').on(table.isActive),
}));

// Family trees table
export const familyTrees = pgTable('family_trees', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  privacyLevel: varchar('privacy_level', { length: 20 }).default('private').$type<'private' | 'public' | 'shared'>(),
  personCount: integer('person_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  userIdx: index('idx_family_trees_user').on(table.userId),
}));

// Persons table
export const persons = pgTable('persons', {
  id: uuid('id').primaryKey().defaultRandom(),
  treeId: uuid('tree_id').references(() => familyTrees.id, { onDelete: 'cascade' }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  middleName: varchar('middle_name', { length: 100 }),
  birthDate: date('birth_date'),
  deathDate: date('death_date'),
  birthLocation: varchar('birth_location', { length: 255 }),
  deathLocation: varchar('death_location', { length: 255 }),
  gender: varchar('gender', { length: 10 }).$type<'male' | 'female' | 'unknown'>(),
  biography: text('biography'),
  notes: text('notes'),
  privacyLevel: varchar('privacy_level', { length: 20 }).default('private'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  isDeleted: boolean('is_deleted').default(false),
}, (table) => ({
  treeIdx: index('idx_persons_tree').on(table.treeId),
  nameIdx: index('idx_persons_name').on(table.lastName, table.firstName),
  birthLocationIdx: index('idx_persons_birth_location').on(table.birthLocation),
  deathLocationIdx: index('idx_persons_death_location').on(table.deathLocation),
}));

// Relationships table
export const relationships = pgTable('relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  personId: uuid('person_id').references(() => persons.id, { onDelete: 'cascade' }).notNull(),
  relatedPersonId: uuid('related_person_id').references(() => persons.id, { onDelete: 'cascade' }).notNull(),
  relationshipType: varchar('relationship_type', { length: 50 }).notNull().$type<'parent' | 'child' | 'spouse' | 'sibling'>(),
  isBiological: boolean('is_biological').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  personIdx: index('idx_relationships_person').on(table.personId),
  relatedPersonIdx: index('idx_relationships_related_person').on(table.relatedPersonId),
  typeIdx: index('idx_relationships_type').on(table.relationshipType),
}));

// DNA profiles table
export const dnaProfiles = pgTable('dna_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  testingCompany: varchar('testing_company', { length: 50 }).notNull(),
  uploadDate: timestamp('upload_date').defaultNow().notNull(),
  fileHash: varchar('file_hash', { length: 255 }).notNull().unique(),
  processingStatus: varchar('processing_status', { length: 20 }).default('pending'),
  ethnicityVersion: varchar('ethnicity_version', { length: 10 }),
  matchCount: integer('match_count').default(0),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_dna_profiles_user').on(table.userId),
  statusIdx: index('idx_dna_profiles_status').on(table.processingStatus),
}));

// Ethnicity estimates table
export const ethnicityEstimates = pgTable('ethnicity_estimates', {
  id: uuid('id').primaryKey().defaultRandom(),
  dnaProfileId: uuid('dna_profile_id').references(() => dnaProfiles.id, { onDelete: 'cascade' }).notNull(),
  region: varchar('region', { length: 100 }).notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  profileIdx: index('idx_ethnicity_profile').on(table.dnaProfileId),
}));

// DNA matches table
export const dnaMatches = pgTable('dna_matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  dnaProfileId: uuid('dna_profile_id').references(() => dnaProfiles.id, { onDelete: 'cascade' }).notNull(),
  matchProfileId: uuid('match_profile_id').references(() => dnaProfiles.id, { onDelete: 'cascade' }).notNull(),
  sharedDna: integer('shared_dna').notNull(),
  sharedSegments: integer('shared_segments').notNull(),
  predictedRelationship: varchar('predicted_relationship', { length: 50 }),
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),
  isContacted: boolean('is_contacted').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  profileIdx: index('idx_dna_matches_profile').on(table.dnaProfileId),
  matchIdx: index('idx_dna_matches_match').on(table.matchProfileId),
}));

// Collaboration groups table
export const collaborationGroups = pgTable('collaboration_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdBy: uuid('created_by').references(() => users.id),
  memberCount: integer('member_count').default(1),
  treeCount: integer('tree_count').default(0),
  privacyLevel: varchar('privacy_level', { length: 20 }).default('private').$type<'private' | 'public' | 'shared'>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  createdByIdx: index('idx_groups_created_by').on(table.createdBy),
}));

// Collaboration permissions table
export const collaborationPermissions = pgTable('collaboration_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').references(() => collaborationGroups.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  treeId: uuid('tree_id').references(() => familyTrees.id, { onDelete: 'cascade' }).notNull(),
  permissionLevel: varchar('permission_level', { length: 20 }).notNull().$type<'view' | 'edit' | 'admin'>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  groupUserIdx: index('idx_permissions_group_user').on(table.groupId, table.userId),
  treeIdx: index('idx_permissions_tree').on(table.treeId),
}));

// Media items table
export const mediaItems = pgTable('media_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  personId: uuid('person_id').references(() => persons.id, { onDelete: 'cascade' }).notNull(),
  uploadedBy: uuid('uploaded_by').references(() => users.id).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  mediaType: varchar('media_type', { length: 50 }).notNull().$type<'photo' | 'document' | 'audio' | 'video'>(),
  description: text('description'),
  tags: jsonb('tags').$type<string[]>(),
  metadata: jsonb('metadata'),
  ocrText: text('ocr_text'),
  isProcessed: boolean('is_processed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  personIdx: index('idx_media_person').on(table.personId),
  uploadedByIdx: index('idx_media_uploaded_by').on(table.uploadedBy),
  typeIdx: index('idx_media_type').on(table.mediaType),
}));

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').references(() => collaborationGroups.id, { onDelete: 'cascade' }).notNull(),
  senderId: uuid('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  messageType: varchar('message_type', { length: 20 }).default('text').$type<'text' | 'system' | 'notification'>(),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  groupIdx: index('idx_messages_group').on(table.groupId),
  senderIdx: index('idx_messages_sender').on(table.senderId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  familyTrees: many(familyTrees),
  dnaProfiles: many(dnaProfiles),
  createdGroups: many(collaborationGroups),
  mediaItems: many(mediaItems),
  messages: many(messages),
}));

export const familyTreesRelations = relations(familyTrees, ({ one, many }) => ({
  user: one(users, {
    fields: [familyTrees.userId],
    references: [users.id],
  }),
  persons: many(persons),
  permissions: many(collaborationPermissions),
}));

export const personsRelations = relations(persons, ({ one, many }) => ({
  tree: one(familyTrees, {
    fields: [persons.treeId],
    references: [familyTrees.id],
  }),
  relationships: many(relationships),
  relatedTo: many(relationships, {
    relationName: 'relatedPerson',
  }),
  mediaItems: many(mediaItems),
}));

export const relationshipsRelations = relations(relationships, ({ one }) => ({
  person: one(persons, {
    fields: [relationships.personId],
    references: [persons.id],
  }),
  relatedPerson: one(persons, {
    fields: [relationships.relatedPersonId],
    references: [persons.id],
    relationName: 'relatedPerson',
  }),
}));

export const dnaProfilesRelations = relations(dnaProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [dnaProfiles.userId],
    references: [users.id],
  }),
  ethnicityEstimates: many(ethnicityEstimates),
  dnaMatches: many(dnaMatches),
}));

export const ethnicityEstimatesRelations = relations(ethnicityEstimates, ({ one }) => ({
  dnaProfile: one(dnaProfiles, {
    fields: [ethnicityEstimates.dnaProfileId],
    references: [dnaProfiles.id],
  }),
}));

export const dnaMatchesRelations = relations(dnaMatches, ({ one }) => ({
  dnaProfile: one(dnaProfiles, {
    fields: [dnaMatches.dnaProfileId],
    references: [dnaProfiles.id],
  }),
  matchProfile: one(dnaProfiles, {
    fields: [dnaMatches.matchProfileId],
    references: [dnaProfiles.id],
  }),
}));

export const collaborationGroupsRelations = relations(collaborationGroups, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [collaborationGroups.createdBy],
    references: [users.id],
  }),
  permissions: many(collaborationPermissions),
  messages: many(messages),
}));

export const collaborationPermissionsRelations = relations(collaborationPermissions, ({ one }) => ({
  group: one(collaborationGroups, {
    fields: [collaborationPermissions.groupId],
    references: [collaborationGroups.id],
  }),
  user: one(users, {
    fields: [collaborationPermissions.userId],
    references: [users.id],
  }),
  tree: one(familyTrees, {
    fields: [collaborationPermissions.treeId],
    references: [familyTrees.id],
  }),
}));

export const mediaItemsRelations = relations(mediaItems, ({ one }) => ({
  person: one(persons, {
    fields: [mediaItems.personId],
    references: [persons.id],
  }),
  uploadedBy: one(users, {
    fields: [mediaItems.uploadedBy],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  group: one(collaborationGroups, {
    fields: [messages.groupId],
    references: [collaborationGroups.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));