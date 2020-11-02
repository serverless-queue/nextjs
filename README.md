# @serverless-queue/nextjs

The easiest way to integrate [ServerlessQueue](https://www.serverlessqueue.com) with your Next.Js project.

## Getting Started

1. Create a free [ServerlessQueue](https://www.serverlessqueue.com) account and save your token as an environment variable called `SERVERLESS_QUEUE_TOKEN` in your `.env.local` file
```
SERVERLESS_QUEUE_TOKEN=your_token_here
```

2. Add this library to your project
```
npm install --save @serverless-queue/nextjs
```

3. Create your first queue by creating a new api route and defining the worker function
```
// pages/api/queues/example.js
import { Queue } from "@serverless-queue/nextjs"

export default Queue(
    "queues/example",
    async (job) => {
        // implement the background job here
    }
)
```

4. Enqueue a job by importing your new queue and calling `.enqueue` on it with the payload needed to complete the job
```
// pages/api/example.js
import exampleQueue from "./queues/example"

export default async (req, res) => {
    // handle logic that can be completed as part of the request

    // enqueue a job to complete work 
    // that should be completed asynchronously after the request
    await exampleQueue.enqueue({ field: "value" })
}
```


## End-to-End Encryption

Serverless Queue supports encrypting the job payload data so that our servers never have access to potentially sensitive information.  To enable this feature simply set a 32 character encryption key using the environment variable `SERVERLESS_QUEUE_ENCRYPTION_KEY` and the client library will automatically encrypt and decrypt the payload using this key.
