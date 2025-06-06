
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo title', async () => {
    // Create a todo directly in database
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original description'
      })
      .returning()
      .execute();

    // Update the title
    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      title: 'Updated Title'
    };
    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.completed).toEqual(false); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdTodo.updated_at).toBe(true);
  });

  it('should update todo description', async () => {
    // Create a todo directly in database
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'Original description'
      })
      .returning()
      .execute();

    // Update the description
    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      description: 'Updated description'
    };
    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Test Todo'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(false); // Should remain unchanged
    expect(result.updated_at > createdTodo.updated_at).toBe(true);
  });

  it('should update todo completion status', async () => {
    // Create a todo directly in database
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'Test description'
      })
      .returning()
      .execute();

    // Update the completion status
    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      completed: true
    };
    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Test Todo'); // Should remain unchanged
    expect(result.description).toEqual('Test description'); // Should remain unchanged
    expect(result.completed).toEqual(true);
    expect(result.updated_at > createdTodo.updated_at).toBe(true);
  });

  it('should update multiple fields at once', async () => {
    // Create a todo directly in database
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original description'
      })
      .returning()
      .execute();

    // Update multiple fields
    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      title: 'Updated Title',
      description: 'Updated description',
      completed: true
    };
    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(true);
    expect(result.updated_at > createdTodo.updated_at).toBe(true);
  });

  it('should set description to null', async () => {
    // Create a todo with description
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'Some description'
      })
      .returning()
      .execute();

    // Update description to null
    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      description: null
    };
    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
  });

  it('should save updated todo to database', async () => {
    // Create a todo directly in database
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original description'
      })
      .returning()
      .execute();

    // Update the todo
    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      title: 'Updated Title',
      completed: true
    };
    await updateTodo(updateInput);

    // Verify the update was saved to database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Updated Title');
    expect(todos[0].description).toEqual('Original description');
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
    expect(todos[0].updated_at > createdTodo.updated_at).toBe(true);
  });

  it('should throw error when todo not found', async () => {
    const updateInput: UpdateTodoInput = {
      id: 999, // Non-existent ID
      title: 'Updated Title'
    };

    await expect(updateTodo(updateInput)).rejects.toThrow(/todo with id 999 not found/i);
  });
});
