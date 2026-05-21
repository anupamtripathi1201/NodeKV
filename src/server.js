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
        
        else if(command=='SET'){
            if(parts.length<3){
                socket.write("Not enough number of arguments");
                return;
            }

            const key = parts[1];
            const value = parts[2];
            let expiresAt = null;
            if(parts.length===5 && parts[3].toUpperCase()=='EX'){
                const ttl = parseInt(parts[4],10);

                if(!isNaN(ttl)){
                    expiresAt = Date.now() + (ttl*1000)
                }

            }
            else if(parts.length>3){
                value=parts.slice(2).join(' ');
            }
            store.set(key,{value :value,expiresAt :expiresAt});
            socket.write("+OK\n");


        }
        else if(command=='GET'){
            if(parts.length<2){
                console.log("More number of arguments are needed\n");
                return;
            }

            const key = parts[1];
            const record = store.get(key);
            if(record!==undefined){
                if(record.expiresAt!=null && record.expiresAt<Date.now()){
                    store.delete(key);
                    socket.write('$1\r\n(nil)\n');
                }else{
                    socket.write(`$${record.value}\n`);
                }}
                else{
                    socket.write(`$!\r\n(nil)\n`);
                }}
            else{
                    socket.write(`-ERR unknown command ${command}`);

                }
            
        

    });
  socket.on('end',()=>{
    console.log(`[-] Client disconnected`);
  })  

  socket.on('error',(err)=>{
    console.log(`[!] Error : ${err.message}`);
  })


})



setInterval(()=>{
    const now = Date.now();
    for(const [key,record] of store.entries()){
        if(record.expiresAt!==null  && record.expiresAt<now ){
            store.delete(key);
        }

    }
},5000);


server.listen(PORT,()=>{
    console.log(`Server is running on ${PORT}....`);
    console.log("Available commands are [PING],[GET],[SET]");
})