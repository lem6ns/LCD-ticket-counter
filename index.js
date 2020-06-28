// server.js
// load the things we need
const botToken = "";
const fetch = require('node-fetch');
const fs = require('fs')
var express = require('express');
var app = express();
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "localhost"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(express.static('public'))
// set the view engine to ejs
app.set('view engine', 'ejs');
peakTicketCount = 0
//api
app.get('/getTickets', (req, res) => {
	token = "";
	tickets = []; //really only have this to detect when foreach is done, prob a easier way
	ticketTemp = []; //where everything goes
	ticketsAssigned = 0
	ticketsUnassigned = 0;
	data = fs.readFileSync(process.cwd()+"/tokens.txt", {encoding:'utf8', flag:'r'});
	data = data.split('\n');
	token = data[Math.floor(Math.random() * data.length)];
	fetch('https://discordapp.com/api/guilds/555932873798975568/channels', {
		method: 'get',
		headers: { 'Authorization': token }
	})
	.then(res => res.json())
    .then(json => {
    	if (json.hasOwnProperty('retry_after')) return res.send('Ratelimited!')
    	json.forEach(a=>{
    		staffReplied = false;
    		if(!a.name.includes('ticket')) return
    		if(a.name == "ticket-notifications") return
    		if(a.name == "create-ticket") return
    		if(a.topic) {staffReplied = true; ticketsAssigned++} else ticketsUnassigned++;
    		ticketTemp.push([{"name": a.name, "staffReplied": staffReplied}]);
    	})
    	if (ticketTemp.length > peakTicketCount) peakTicketCount = ticketTemp.length
    	ticketTemp.forEach(e=>{
    		tickets.push(e.name);
    		if (tickets.length == ticketTemp.length) {
    			res.json({count: ticketTemp.length, ticketsAssigned: ticketsAssigned, ticketsUnassigned: ticketsUnassigned, tickets: ticketTemp, peakTicketCount: peakTicketCount})
    		}
    	})
    })
});
// index page 
app.get('/', function(req, res) {
    res.render('pages/index');
});

// about page 
app.get('/about', function(req, res) {
    res.render('pages/about');
});

//name
app.get('/ticket-info/*', (req,res)=>{
	res.render('pages/ticket-info.ejs')
})
app.get('/get-ticket-info', (req,res)=>{
	ticket = req.query.ticket
	token = "";
	staff = false;
	staffMember = "";
	data = fs.readFileSync(process.cwd()+"/tokens.txt", {encoding:'utf8', flag:'r'});
	data = data.split('\n');
	token = data[Math.floor(Math.random() * data.length)];

	fetch('https://discordapp.com/api/guilds/555932873798975568/channels', {
		method: 'get',
		headers: { 'Authorization': token }
	})
	.then(res => res.json())
    .then(json => {
    	json.forEach(a=>{
    		if(a.name != ticket) return
    		if(a.topic) {staff = true; staffMember = a.topic}
            a.permission_overwrites.forEach(e=>{
                if(e.type != "member") return
                fetch('https://discordapp.com/api/v6/users/'+e.id, {
                    method:'get',
                    headers: {'Authorization': 'Bot '+botToken}
                })
                .then(res => res.json())
                .then(b => { 
                    if (b.avatar.includes('a_')) avatar = b.avatar+".gif"; else avatar = b.avatar+".png";
                    res.json({staffAssigned:staffMember, assigned: staff, userCreated: b.username +"#"+ b.discriminator, userImg: `https://cdn.discordapp.com/avatars/${b.id}/${avatar}`})
                })
            })
    	})
    })
})
app.listen(8080);
console.log('8080 is the magic port');
