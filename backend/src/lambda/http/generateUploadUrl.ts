import 'source-map-support/register'

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayProxyHandler
} from 'aws-lambda'
// import * as AWS from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'

import { S3Access } from '../../dataLayer/s3Access'
import { updateAttachmentUrl } from '../../businessLogic/todos'

const s3Access = new S3Access()

// const bucketName = process.env.IMAGES_S3_BUCKET
// const urlExpriration = process.env.SIGNED_URL_EXPIRATION

// const XAWS = AWSXRay.captureAWS(AWS)
// const s3 = new XAWS.S3({
//   signatureVersion: 'v4'
// })

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  const todoId = event.pathParameters.todoId

  // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
  // const uploadUrl = s3.getSignedUrl('putObject', {
  //   Bucket: bucketName,
  //   Key: todoId + '.jpg',
  //   Expires: urlExpriration
  // })

  const uploadUrl = await s3Access.getUploadUrl(todoId)
  await updateAttachmentUrl(jwtToken, todoId)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      uploadUrl
    })
  }
}
