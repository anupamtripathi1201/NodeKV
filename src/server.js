const net = require('net');
const PORT = 6379;

const store = new Map();

const server = net.createServer((socket)=>{
    console.log(`Server is connected to ${socket.remoteAddress} : ${socket.remotePort}`);

    socket.on('data',(buffer)=>{
        const input = buffer.toString().trim();

        const parts = input.split(' ')
        const command = parts[0].toUpperCase();

        if(command=='PING'){
            socket.write('+PONG\n')
        }
        else if (command=='SET'){
         if(parts.length<3){
            socket.write("ERR wrong number of argument")
            return;
         }
         const key = parts[1];
         const value = parts.slice(2).join(' ');
         store.set(key,value);
         socket.write("OK");
        }
        else if (command =='GET'){
            if(parts.length<2){
                socket.write("ERR Wrong number of argument");
                return;
            }
            const key = parts[1];
            const value = store.get(key);

            if(value!==undefined){
                socket.write(`$${value}\n`);
            }
            else{
                socket.write(`$-1\r\n(nil)\n`);
            }
        }
        else{
            socket.write(`ERR unknown command '${command}'\n`);
        }
    });
  socket.on('end',()=>{
    console.log(`[-] Client disconnected`);
  })  

  socket.on('error',(err)=>{
    console.log(`[!] Error : ${err.message}`);
  })


});

server.listen(PORT,()=>{
    console.log(`Server is running on ${PORT}....`);
    console.log("Available commands are [PING],[GET],[SET]");
})