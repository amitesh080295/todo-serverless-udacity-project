import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoAccess } from '../dataLayer/todosAccess'
import { S3Access } from '../dataLayer/s3Access'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { parseUserId } from '../auth/utils'

const todoAccess = new TodoAccess()
const s3Access = new S3Access()

export async function getAllTodos(jwtToken: string): Promise<TodoItem[]> {
  const userId = parseUserId(jwtToken)

  const todos = await todoAccess.getAllTodos(userId)

  todos.forEach(async (todo: TodoItem) => {
    if (todo.attachmentUrl) {
      if (todo.attachmentUrl !== '') {
        const attachmentUrl = await s3Access.getRetrieveUrl(todo.attachmentUrl)
        todo.attachmentUrl = attachmentUrl
      }
    }
  })

  return todos

  //return todoAccess.getAllTodos(userId)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  jwtToken: string
): Promise<TodoItem> {
  const itemId = uuid.v4()
  const userId = parseUserId(jwtToken)

  let attachmentUrl = ''

  if (createTodoRequest.attachmentUrl) {
    attachmentUrl = createTodoRequest.attachmentUrl
  }

  return await todoAccess.createTodo({
    todoId: itemId,
    userId: userId,
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    attachmentUrl: attachmentUrl,
    done: false,
    createdAt: new Date().toISOString()
  })
}

export async function updateTodo(
  updateTodoRequest: UpdateTodoRequest,
  jwtToken: string,
  todoId: string
): Promise<string> {
  const userId = parseUserId(jwtToken)

  return await todoAccess.updateTodo(updateTodoRequest, userId, todoId)
}

export async function updateAttachmentUrl(
  jwtToken: string,
  todoId: string
): Promise<string> {
  const userId = parseUserId(jwtToken)

  return await todoAccess.updateAttachmentUrl(userId, todoId)
}

export async function deleteTodo(
  jwtToken: string,
  todoId: string
): Promise<string> {
  const userId = parseUserId(jwtToken)

  return await todoAccess.deleteTodo(userId, todoId)
}
