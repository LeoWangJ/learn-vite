console.log("[vite] connecting...")

const socket = new WebSocket(`ws://localhost:__HMR_PORT__`, "vite-hmr")

socket.addEventListener('message', async ({ data }) => {
    handleMessage(JSON.parse(data)).catch(console.error)
})

interface Update {
    type: "js-update" | "css-update"
    path: string
    acceptedPath: string
    timestamp: number
}

async function handleMessage(payload: any) {
    switch (payload.type) {
        case "connected":
            console.log(`[vite] connected.`)
            setInterval(() => socket.send("ping"), 1000)
            break
        case "update":
            payload.updates.forEach((update: Update) => {
                if (update.type === 'js-update') {

                }
            })
            break
    }
}