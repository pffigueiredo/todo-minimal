
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a test todo first
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing deletion',
        completed: false
      })
      .returning()
      .execute();

    const input: DeleteTodoInput = {
      id: createdTodo.id
    };

    const result = await deleteTodo(input);

    // Should return success
    expect(result.success).toBe(true);

    // Todo should no longer exist in database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false when deleting non-existent todo', async () => {
    const input: DeleteTodoInput = {
      id: 999999 // Non-existent ID
    };

    const result = await deleteTodo(input);

    // Should return failure
    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting', async () => {
    // Create two test todos
    const [todo1] = await db.insert(todosTable)
      .values({
        title: 'Todo 1',
        description: 'First todo',
        completed: false
      })
      .returning()
      .execute();

    const [todo2] = await db.insert(todosTable)
      .values({
        title: 'Todo 2',
        description: 'Second todo',
        completed: true
      })
      .returning()
      .execute();

    // Delete only the first todo
    const input: DeleteTodoInput = {
      id: todo1.id
    };

    const result = await deleteTodo(input);

    expect(result.success).toBe(true);

    // First todo should be deleted
    const deletedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todo1.id))
      .execute();

    expect(deletedTodos).toHaveLength(0);

    // Second todo should still exist
    const remainingTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todo2.id))
      .execute();

    expect(remainingTodos).toHaveLength(1);
    expect(remainingTodos[0].title).toEqual('Todo 2');
    expect(remainingTodos[0].completed).toBe(true);
  });
});
