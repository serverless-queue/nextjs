import { NextApiRequest, NextApiResponse } from "next";
import Client from "@serverless-queue/nodejs";

let baseCallbackUrl: string | undefined = undefined;
let sqToken: string = process.env.SERVERLESS_QUEUE_TOKEN || ""
let heartbeatInterval = parseInt(process.env.SERVERLESS_QUEUE_HEARTBEAT_INTERVAL || "30000",10)

if (process.env.VERCEL_URL) {
  baseCallbackUrl = `https://${process.env.VERCEL_URL}/api/`;
}

if (process.env.SERVERLESS_QUEUE_BASE_CALLBACK_URL) {
  baseCallbackUrl = `${process.env.SERVERLESS_QUEUE_BASE_CALLBACK_URL}/api/`;
}

if (!baseCallbackUrl) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Please specify SERVERLESS_QUEUE_BASE_CALLBACK_URL.");
  } else {
    baseCallbackUrl = "http://localhost:3000/api/";
  }
}

export type HandlerFunc = (job: Record<any,any>) => Promise<void>

export function Queue(path: string, handler: HandlerFunc) {
    const callbackUrl = `${baseCallbackUrl}${path}`
    const client = new Client(sqToken)

    async function nextApiHandler(req: NextApiRequest, res: NextApiResponse) {
        const webhookSignature = req.headers['sq-webhook-signature'] as string
        const entryId = req.headers['sq-entry-id'] as string
        const rawPayload = req.body
        const jobPayload = client.verifyAndDecrypt(rawPayload, webhookSignature)
        if(!jobPayload) {
          res.status(401).json("{error: 'invalid signature'}")
          return
        }

        const heartbeat = setInterval(async () => {
            await client.heartbeat(entryId)
        }, heartbeatInterval)

        try {
            await handler(jobPayload)
            await client.ack(entryId)
            res.status(200).end()
        } catch (error) {
            res.status(500).json(error)
            throw error
        } finally {
          clearInterval(heartbeat)
        }   
    }

    nextApiHandler.enqueue = async (jobPayload: Record<any, any>) => {
        return await client.enqueue({ queueName: path, jobPayload, callbackUrl })
    }

    return nextApiHandler
}