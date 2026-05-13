import * as Minio from 'minio'
import { loadEnv } from '../config/env'

export interface UploadResult {
  objectKey: string
  publicUrl: string
}

export function createMinioStorage() {
  const env = loadEnv()

  const client = new Minio.Client({
    endPoint: env.MINIO_ENDPOINT,
    port: env.MINIO_PORT,
    useSSL: env.MINIO_USE_SSL,
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY
  })

  return {
    async uploadObject(input: {
      objectKey: string
      buffer: Buffer
      contentType: string
    }): Promise<UploadResult> {
      await client.putObject(env.MINIO_BUCKET, input.objectKey, input.buffer, input.buffer.length, {
        'Content-Type': input.contentType
      })

      return {
        objectKey: input.objectKey,
        publicUrl: `${env.MINIO_PUBLIC_URL}/${input.objectKey}`
      }
    }
  }
}
