
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type ToggleTodoInput } from '../schema';
import { toggleTodo } from '../handlers/toggle_todo';
import { eq } from 'drizzle-orm';

// Test input
const testInput: ToggleTodoInput = {
  id: 1
};

describe('toggleTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should toggle a todo from false to true', async () => {
    // Create a todo with completed = false (default)
    const createdTodo = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing',
        completed: false
      })
      .returning()
      .execute();

    const result = await toggleTodo({ id: createdTodo[0].id });

    // Should toggle to true
    expect(result.completed).toBe(true);
    expect(result.id).toEqual(createdTodo[0].id);
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('A todo for testing');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should toggle a todo from true to false', async () => {
    // Create a todo with completed = true
    const createdTodo = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        description: 'Already done',
        completed: true
      })
      .returning()
      .execute();

    const result = await toggleTodo({ id: createdTodo[0].id });

    // Should toggle to false
    expect(result.completed).toBe(false);
    expect(result.id).toEqual(createdTodo[0].id);
    expect(result.title).toEqual('Completed Todo');
    expect(result.description).toEqual('Already done');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update the database record', async () => {
    // Create a todo
    const createdTodo = await db.insert(todosTable)
      .values({
        title: 'Database Test Todo',
        completed: false
      })
      .returning()
      .execute();

    await toggleTodo({ id: createdTodo[0].id });

    // Query the database to confirm the change was persisted
    const updatedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo[0].id))
      .execute();

    expect(updatedTodos).toHaveLength(1);
    expect(updatedTodos[0].completed).toBe(true);
    expect(updatedTodos[0].updated_at).toBeInstanceOf(Date);
    // Updated_at should be more recent than created_at
    expect(updatedTodos[0].updated_at.getTime()).toBeGreaterThan(updatedTodos[0].created_at.getTime());
  });

  it('should throw error for non-existent todo', async () => {
    await expect(toggleTodo({ id: 999 })).rejects.toThrow(/not found/i);
  });

  it('should handle todos with null description', async () => {
    // Create a todo with null description
    const createdTodo = await db.insert(todosTable)
      .values({
        title: 'Null Description Todo',
        description: null,
        completed: false
      })
      .returning()
      .execute();

    const result = await toggleTodo({ id: createdTodo[0].id });

    expect(result.completed).toBe(true);
    expect(result.description).toBeNull();
    expect(result.title).toEqual('Null Description Todo');
  });
});
