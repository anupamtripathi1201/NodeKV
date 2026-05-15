const net = require('net');
const readline = require('readline')


const client = net.createConnection({port : 6379},()=>{

    console.log("Client connected");


});

client.on('data',(data)=>{
    console.log(data.toString())
});


const rl = readline.createInterface({
    input : process.stdin,
    output : process.stdout
});


rl.on('line',(line)=>{
    client.write(line + '\n');
})

client.on('end',()=>{
    console.log("Client End");
    process.exit();
})