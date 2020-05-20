import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

export class TodoAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly todoIdIndex = process.env.TODO_ID_INDEX
  ) {}

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    console.log('Getting all todos')

    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        IndexName: this.todoIdIndex,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    await this.docClient
      .put({
        TableName: this.todosTable,
        Item: todoItem
      })
      .promise()

    return todoItem
  }

  async updateTodo(todoUpdate: TodoUpdate, userId: string): Promise<string> {
    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        IndexName: this.todoIdIndex,
        KeyConditionExpression: 'name = :name and userId = :userId',
        ExpressionAttributeValues: {
          ':name': todoUpdate.name,
          ':userId': userId
        }
      })
      .promise()

    const items = result.Items
    const existingTodo = items[0]

    const updatedTodo = await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          HashKey: existingTodo.todoId
        },
        UpdateExpression: 'set name = :name, dueDate = :dueDate, done = :done',
        ExpressionAttributeValues: {
          ':name': todoUpdate.name,
          ':dueDate': todoUpdate.dueDate,
          ':done': todoUpdate.done
        },
        ReturnValues: 'UPDATED_NEW'
      })
      .promise()

    console.log(updatedTodo)

    return 'Successfully updated'
  }

  async deleteTodo(todoId: string): Promise<string> {
    await this.docClient
      .delete({
        TableName: this.todosTable,
        Key: {
          HashKey: todoId
        }
      })
      .promise()

    return `Todo #${todoId} successfully deleted`
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}
