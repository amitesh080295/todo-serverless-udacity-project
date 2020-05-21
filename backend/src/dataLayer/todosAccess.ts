import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)

import { createLogger } from '../utils/logger'
const logger = createLogger('auth')

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

export class TodoAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly userIdIndex = process.env.USER_ID_INDEX
  ) {}

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    logger.info('Getting all todos')

    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        IndexName: this.userIdIndex,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async getTodo(userId: string, todoId: string): Promise<TodoItem> {
    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        IndexName: this.userIdIndex,
        KeyConditionExpression: 'userId = :userId and todoId = :todoId',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':todoId': todoId
        }
      })
      .promise()

    const items = result.Items
    return items[0] as TodoItem
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

  async updateTodo(
    todoUpdate: TodoUpdate,
    userId: string,
    todoId: string
  ): Promise<string> {
    logger.info('Getting the todoItem for the ID: ', todoId)

    const todo = await this.getTodo(userId, todoId)

    logger.info('Updating the todoItem for the ID: ', todoId)

    const updatedTodo = await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          userId: userId,
          createdAt: todo.createdAt
        },
        UpdateExpression: 'set #a = :name, dueDate = :dueDate, done = :done',
        ExpressionAttributeNames: {
          '#a': 'name'
        },
        ConditionExpression: 'todoId = :todoId',
        ExpressionAttributeValues: {
          ':name': todoUpdate.name,
          ':dueDate': todoUpdate.dueDate,
          ':done': todoUpdate.done,
          ':todoId': todoId
        },
        ReturnValues: 'UPDATED_NEW'
      })
      .promise()

    logger.info('Updated Todo ', updatedTodo)

    return 'Successfully updated'
  }

  async deleteTodo(userId: string, todoId: string): Promise<string> {
    logger.info('Getting the todoItem for the ID: ', todoId)

    const todo = await this.getTodo(userId, todoId)

    logger.info('Deleting the todoItem for the ID: ', todoId)

    await this.docClient
      .delete({
        TableName: this.todosTable,
        Key: {
          userId: userId,
          createdAt: todo.createdAt
        },
        ConditionExpression: 'todoId = :todoId',
        ExpressionAttributeValues: {
          ':todoId': todoId
        }
      })
      .promise()

    return `Todo #${todoId} successfully deleted`
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    logger.info('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}
