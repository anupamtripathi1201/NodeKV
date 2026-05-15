const net = require('net');

const PORT = 6379

const server = net.createServer((socket)=>{
    console.log(`New Client is connected : ${socket.remoteAddress} : ${socket.remotePort} `);

    socket.on('data',(buffer)=>{
        const input = buffer.toString().trim();

        if(!input){
            console.log("No Valid Input!");
            return;
        }

        console.log(`Client says : ${input}`);

        console.log(`Server is listening to ${input}\n`)
    })

    socket.on('end',()=>{
        console.log(`Client disconnected : ${socket.remoteAddress}`);

    })

    socket.on('error',(err)=>{
        console.log(`Connection Error : ${err.message}`)

    })
})

server.listen(PORT,()=>{
    console.log(`Server is running on ${PORT} ` )
})