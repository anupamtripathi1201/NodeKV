const net = require('net');
const fs = require('fs');
const PORT = 6379;

const AOF_FILE = 'nodekv.aof'
const store = new Map();

function loadDatabaseFromDisk(){
    if(fs.existsSync(AOF_FILE)){
        console.log(`[+] Boot Sequence : AOF file found.Restoring Database...`);
        const fileData =  fs.readFileSync(AOF_FILE,'utf-8');
        const lines = fileData.split('\n');

        for(const line of lines){
            if(!line)continue;
            const parts = line.split(" ");
            const command = parts[0].toUpperCase();

            if(command=='SET'){
                const key = parts[1];
                const values = parts[2];
                const expiresAt = null;

                if(parts.length ==5 && parts[3].toUpperCase() =='EX'){
                    const ttl = parseInt(parts[4],10);
                    if(!NaN(ttl)){
                        expiresAt = Date.now + (ttl*1000);
                    }
                }
                else if(parts.length>3){
                    value = parts.slice(2).join(' ');
                }
                store.set(key,{value : values,expiresAt :expiresAt});
            }
        }
        console.log(`SYSTEM RESTORE COMPLETED`);
    }
    else{
        console.log("NO AOF FILE FOUND!");
    }
}

loadDatabaseFromDisk();

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
            fs.appendFileSync(AOF_FILE,`{input}\n`);
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