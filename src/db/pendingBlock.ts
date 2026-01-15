import { eq } from 'drizzle-orm';
import { db } from './drizzle';
import { pendingAppBlocks, type PendingAppBlock, type NewPendingAppBlock } from './schema';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new pending app block
 */
export async function createPendingBlock(data: Omit<NewPendingAppBlock, 'id' | 'createdAt' | 'updatedAt'>): Promise<PendingAppBlock> {
  const id = uuidv4();
  
  await db.insert(pendingAppBlocks).values({
    id,
    ...data,
  });

  const pendingBlock = await db.select().from(pendingAppBlocks).where(eq(pendingAppBlocks.id, id)).get();
  
  if (!pendingBlock) {
    throw new Error('Failed to create pending block');
  }

  return pendingBlock;
}

/**
 * Get a pending block by ID
 */
export async function getPendingBlockById(id: string): Promise<PendingAppBlock | null> {
  const pendingBlock = await db.select().from(pendingAppBlocks).where(eq(pendingAppBlocks.id, id)).get();
  return pendingBlock || null;
}

/**
 * Get all pending blocks for a user
 */
export async function getPendingBlocksByUser(userId: string): Promise<PendingAppBlock[]> {
  return db.select().from(pendingAppBlocks).where(eq(pendingAppBlocks.userId, userId)).all();
}

/**
 * Get all pending blocks (for admin)
 */
export async function getAllPendingBlocks(): Promise<PendingAppBlock[]> {
  return db.select().from(pendingAppBlocks).all();
}

/**
 * Update pending block status
 */
export async function updatePendingBlockStatus(
  id: string, 
  status: PendingAppBlock['status'],
  adminNotes?: string
): Promise<PendingAppBlock | null> {
  await db.update(pendingAppBlocks)
    .set({ 
      status,
      adminNotes,
      updatedAt: new Date(),
    })
    .where(eq(pendingAppBlocks.id, id));

  return getPendingBlockById(id);
}

/**
 * Mark notification as sent for a pending block
 */
export async function markNotificationSent(id: string): Promise<void> {
  await db.update(pendingAppBlocks)
    .set({ 
      notificationSent: true,
      updatedAt: new Date(),
    })
    .where(eq(pendingAppBlocks.id, id));
}

/**
 * Check if user has a pending block with the same name
 */
export async function hasPendingBlockWithName(userId: string, blockName: string): Promise<boolean> {
  const existing = await db.select()
    .from(pendingAppBlocks)
    .where(eq(pendingAppBlocks.userId, userId))
    .all();
  
  return existing.some(block => 
    block.blockName.toLowerCase() === blockName.toLowerCase() && 
    block.status === 'pending'
  );
}
