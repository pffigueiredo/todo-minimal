
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Edit3, Save, X, Calendar } from 'lucide-react';
import type { Todo, CreateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state for creating new todos
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: null
  });

  // Form state for editing existing todos
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: ''
  });

  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    setIsLoading(true);
    try {
      const newTodo = await trpc.createTodo.mutate(formData);
      setTodos((prev: Todo[]) => [newTodo, ...prev]);
      setFormData({ title: '', description: null });
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTodo = async (id: number) => {
    try {
      const updatedTodo = await trpc.toggleTodo.mutate({ id });
      setTodos((prev: Todo[]) => 
        prev.map((todo: Todo) => todo.id === id ? updatedTodo : todo)
      );
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await trpc.deleteTodo.mutate({ id });
      setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditFormData({
      title: todo.title,
      description: todo.description || ''
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({ title: '', description: '' });
  };

  const handleUpdateTodo = async (id: number) => {
    if (!editFormData.title.trim()) return;
    
    try {
      const updatedTodo = await trpc.updateTodo.mutate({
        id,
        title: editFormData.title,
        description: editFormData.description || null
      });
      setTodos((prev: Todo[]) => 
        prev.map((todo: Todo) => todo.id === id ? updatedTodo : todo)
      );
      setEditingId(null);
      setEditFormData({ title: '', description: '' });
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const completedTodos = todos.filter((todo: Todo) => todo.completed);
  const pendingTodos = todos.filter((todo: Todo) => !todo.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">✨ Todo App</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Create Todo Form */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Plus className="w-5 h-5 text-blue-600" />
              Add New Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTodo} className="space-y-4">
              <Input
                placeholder="What needs to be done? 🎯"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                }
                className="text-lg py-3 border-2 border-gray-200 focus:border-blue-400 transition-colors"
                required
              />
              <Textarea
                placeholder="Add some details... (optional)"
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateTodoInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                className="border-2 border-gray-200 focus:border-blue-400 transition-colors resize-none"
                rows={3}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !formData.title.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
              >
                {isLoading ? '✨ Creating...' : '🚀 Add Task'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="text-center shadow-md border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600">{todos.length}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </CardContent>
          </Card>
          <Card className="text-center shadow-md border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-orange-600">{pendingTodos.length}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card className="text-center shadow-md border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">{completedTodos.length}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Todo Lists */}
        <div className="space-y-8">
          {/* Pending Todos */}
          {pendingTodos.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                📋 Pending Tasks
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {pendingTodos.length}
                </Badge>
              </h2>
              <div className="space-y-3">
                {pendingTodos.map((todo: Todo) => (
                  <Card key={todo.id} className="shadow-md border-0 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-4">
                      {editingId === todo.id ? (
                        <div className="space-y-3">
                          <Input
                            value={editFormData.title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setEditFormData(prev => ({ ...prev, title: e.target.value }))
                            }
                            className="font-medium border-2 border-blue-200 focus:border-blue-400"
                          />
                          <Textarea
                            value={editFormData.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              setEditFormData(prev => ({ ...prev, description: e.target.value }))
                            }
                            placeholder="Add description..."
                            className="border-2 border-blue-200 focus:border-blue-400 resize-none"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleUpdateTodo(todo.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              onClick={cancelEditing}
                              size="sm"
                              variant="outline"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleTodo(todo.id)}
                            className="p-1 h-auto hover:bg-transparent"
                          >
                            <Circle className="w-6 h-6 text-gray-400 hover:text-green-600 transition-colors" />
                          </Button>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 mb-1">{todo.title}</h3>
                            {todo.description && (
                              <p className="text-gray-600 text-sm mb-2">{todo.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              Created {todo.created_at.toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(todo)}
                              className="p-2 h-auto text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-2 h-auto text-gray-400 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteTodo(todo.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Todos */}
          {completedTodos.length > 0 && (
            <div>
              <Separator className="my-6" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                ✅ Completed Tasks
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {completedTodos.length}
                </Badge>
              </h2>
              <div className="space-y-3">
                {completedTodos.map((todo: Todo) => (
                  <Card key={todo.id} className="shadow-md border-0 bg-white/60 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleTodo(todo.id)}
                          className="p-1 h-auto hover:bg-transparent"
                        >
                          <CheckCircle2 className="w-6 h-6 text-green-600 hover:text-gray-400 transition-colors" />
                        </Button>
                        
                        <div className="flex-1 min-w-0 opacity-75">
                          <h3 className="font-medium text-gray-600 line-through mb-1">{todo.title}</h3>
                          {todo.description && (
                            <p className="text-gray-500 text-sm line-through mb-2">{todo.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            Completed {todo.updated_at.toLocaleDateString()}
                          </div>
                        </div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2 h-auto text-gray-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Task</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTodo(todo.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {todos.length === 0 && (
            <Card className="text-center py-12 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent>
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No tasks yet!</h3>
                <p className="text-gray-500">Create your first task above to get started.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
