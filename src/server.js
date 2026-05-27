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
                let values = parts[2];
                let expiresAt = null;

                if(parts.length ==5 && parts[3].toUpperCase() =='EX'){
                    const ttl = parseInt(parts[4],10);
                    if(!isNaN(ttl)){
                        expiresAt = Date.now() + (ttl*1000);
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

function parseInput(buffer){
    const input = buffer.toString();

    if(input[0]==='*'){
        const lines = input.split('\r\n');
        const parts =[];

        for(let i =2;i<lines.length;i+=2){
            if(lines[i]){
            parts.push(lines[i]);
        }

    }
    return parts;
}

return input.trim().split(' ');
}

const server = net.createServer((socket)=>{
    console.log(`Server is connected to ${socket.remoteAddress} : ${socket.remotePort}`);

    socket.on('data',(buffer)=>{
        const parts = parseInput(buffer);
        if(parts.length ===0 || !parts[0])return;
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
            let value = parts[2];
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
            const plainCommand =parts.join(' ');
            fs.appendFileSync(AOF_FILE,`${plainCommand}\n`);
            socket.write("+OK\r\n");


        }
        else if(command=='GET'){
            if(parts.length<2){
                socket.write("-ERR More Number of argumengts are needed\r\n")
                return;
            }

            const key = parts[1];
            const record = store.get(key);
            if(record!==undefined){
                if(record.expiresAt!=null && record.expiresAt<Date.now()){
                    store.delete(key);
                    socket.write('$1\r\n(nil)\n');
                }else{
                    socket.write(`$${record.value.length}\r\n${record.value}\r\n`);
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