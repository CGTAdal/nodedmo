var pg = require('pg');
// var conString = "postgres://nodeuser:nodeuser@localhost/poll_dev";
var conString = process.env.DATABASE_URL;


// var PollSchema = require('../models/Poll.js').PollSchema;
// var Poll = db.model('polls', PollSchema);

module.exports.index = function(req, res) {
  res.render('index', {title: 'Polls'});
};
// JSON API for list of polls
module.exports.list = function(req, res) { 
  // Poll.find({}, 'question', function(error, polls) {
  //   res.json(polls);
  // });
  pg.connect(conString, function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    client.query("SELECT * FROM polls WHERE status='1'", function(err, result) {
      //call `done()` to release the client back to the pool
      done();

      if(err) {
        // return console.error('error running query', err);
        console.error('error running query', err);
        throw 'Error';
      }else{
        // console.log(result.rows[0].number);
        res.json(result.rows);
      }
    });
  });
};
// JSON API for getting a single poll
module.exports.poll = function(req, res) {  
  var pollId = req.params.id;
  /*Poll.findById(pollId, '', { lean: true }, function(err, poll) {
    if(poll) {
      var userVoted = false,
          userChoice,
          totalVotes = 0;
      for(c in poll.choices) {
        var choice = poll.choices[c]; 
        for(v in choice.votes) {
          var vote = choice.votes[v];
          totalVotes++;
          if(vote.ip === (req.header('x-forwarded-for') || req.ip)) {
            userVoted = true;
            userChoice = { _id: choice._id, text: choice.text };
          }
        }
      }
      poll.userVoted = userVoted;
      poll.userChoice = userChoice;
      poll.totalVotes = totalVotes;
      res.json(poll);
    } else {
      res.json({error:true});
    }
  });*/

  pg.connect(conString, function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    
    client.query("SELECT polls.id AS pollid,polls.question,polls.option_1,polls.option_2,polls.option_3,polls.option_4,polls.status,votes.* FROM polls LEFT JOIN votes ON polls.id=votes.poll_id WHERE status='1' AND polls.id=$1",[pollId], function(err, result) {
      //call `done()` to release the client back to the pool
      done();

      if(err) {
        // return console.error('error running query', err);
        console.error('error running query', err);
        // throw 'Error';
        res.json({error:true});
      }else{
        // console.log(result.rows[0].number);
        var userVoted = false, userChoice, totalVotes = 0;
        var request_ip = (req.header('x-forwarded-for') || req.ip);
        var choices = [{id:1,text:'',votes:0},{id:2,text:'',votes:0},{id:3,text:'',votes:0},{id:4,text:'',votes:0}];
        totalVotes = result.rows.length;
        
        for (var i = 0; i < result.rows.length; i++) {
          var row = result.rows[i];
          // console.log(row.ip+'='+request_ip);
          if(row.ip === request_ip) {
            userVoted = true;
            userChoice = { id: row.option_value, text: eval('row.option_'+row.option_value) };
          }
        }

        client.query("SELECT COUNT(votes.id) AS total_val,votes.option_value FROM polls LEFT JOIN votes ON polls.id=votes.poll_id WHERE status='1' AND polls.id=$1 GROUP BY votes.option_value",[pollId], function(err, result2) {
          done();
          if(err) {
            // return console.error('error running query', err);
            console.error('error running query', err);
            // throw 'Error';
            res.json({error:true});
          }else{
            var op1,op2,op3,op4 = 0;
            
            for (var i = 0; i < result2.rows.length; i++) {
              var row = result2.rows[i];
              switch(row.option_value){
                case 1 : op1 = row.total_val; break;
                case 2 : op2 = row.total_val; break;
                case 3 : op3 = row.total_val; break;
                case 4 : op4 = row.total_val; break;
              }
            }
            choices = [{id:1,text:'',votes:op1},{id:2,text:'',votes:op2},{id:3,text:'',votes:op3},{id:4,text:'',votes:op4}];

            var poll = {};
            poll.id = result.rows[0].pollid;
            poll.question = result.rows[0].question;
            poll.status = result.rows[0].status;

            for(var index=0;index<4;index++){
              choices[index].text = eval('result.rows[0].option_'+(index+1));
            }

            poll.choices = choices;
            poll.userVoted = userVoted;
            poll.userChoice = userChoice;
            poll.totalVotes = totalVotes;
            
            res.json(poll);
          }
        });
        // res.json(result.rows[0]);
      }
    });
  });
};
// JSON API for creating a new poll
/*module.exports.create = function(req, res) {
  var reqBody = req.body,
      choices = reqBody.choices.filter(function(v) { return v.text != ''; }),
      pollObj = {question: reqBody.question, choices: choices};
  var poll = new Poll(pollObj);
  poll.save(function(err, doc) {
    if(err || !doc) {
      throw 'Error';
    } else {
      res.json(doc);
    }   
  });
};*/

// TO HANDLE THE VOTING BY SOCKET
exports.vote = function(socket) {
  // TO HANDLE THE REAL TIME VOTTING
  socket.on('send:vote', function(data) {
    // var ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address;
    // var ip = socket.request.connection.remoteAddress || socket.handshake.address.address;
    var ip = socket.request.connection.remoteAddress || socket.handshake.headers['x-forwarded-for'];

    /*Poll.findById(data.poll_id, function(err, poll) {
      var choice = poll.choices.id(data.choice);
      choice.votes.push({ ip: ip });
      poll.save(function(err, doc) {
        var theDoc = { 
          question: doc.question, _id: doc._id, choices: doc.choices, 
          userVoted: false, totalVotes: 0 
        };
        for(var i = 0, ln = doc.choices.length; i < ln; i++) {
          var choice = doc.choices[i]; 
          for(var j = 0, jLn = choice.votes.length; j < jLn; j++) {
            var vote = choice.votes[j];
            theDoc.totalVotes++;
            theDoc.ip = ip;
            if(vote.ip === ip) {
              theDoc.userVoted = true;
              theDoc.userChoice = { _id: choice._id, text: choice.text };
            }
          }
        }       
        socket.emit('newadded:vote', theDoc);
        socket.broadcast.emit('broadcast:vote', theDoc);
      });     
    });*/
    pg.connect(conString, function(err, client, done) {
      if(err) {
        return console.error('error fetching client from pool', err);
      }
      var datetime = '2014-08-23 15:40:00';
      client.query("INSERT INTO votes (poll_id,option_value,created_on,ip) VALUES ($1,$2,'"+datetime+"',$3) RETURNING *", [data.poll_id,data.choice,ip], function(err, voteresult) {
        // console.log(voteresult); console.log(ip);
        client.query("SELECT polls.id AS pollid,polls.question,polls.option_1,polls.option_2,polls.option_3,polls.option_4,polls.status,votes.* FROM polls LEFT JOIN votes ON polls.id=votes.poll_id WHERE status='1' AND polls.id=$1",[data.poll_id], function(err, result) {
          //call `done()` to release the client back to the pool
          done();

          if(err) {
            // return console.error('error running query', err);
            console.error('error running query', err);
            // throw 'Error';
            res.json({error:true});
          }else{
            // console.log(result.rows[0].number);
            var userVoted = false, userChoice, totalVotes = 0;
            // var request_ip = ip;
            var choices = [{id:1,text:'',votes:0},{id:2,text:'',votes:0},{id:3,text:'',votes:0},{id:4,text:'',votes:0}];
            totalVotes = result.rows.length;
            
            for (var i = 0; i < result.rows.length; i++) {
              var row = result.rows[i];

              if(row.ip === ip) {
                userVoted = true;
                userChoice = { id: row.option_value, text: eval('row.option_'+row.option_value) };
              }
            }

            client.query("SELECT COUNT(votes.id) AS total_val,votes.option_value FROM polls LEFT JOIN votes ON polls.id=votes.poll_id WHERE status='1' AND polls.id=$1 GROUP BY votes.option_value",[data.poll_id], function(err, result2) {
              done();
              if(err) {
                // return console.error('error running query', err);
                console.error('error running query', err);
                // throw 'Error';
                res.json({error:true});
              }else{
                var op1,op2,op3,op4 = 0;
                for (var i = 0; i < result2.rows.length; i++) {
                  var row = result2.rows[i];
                  switch(row.option_value){
                    case 1 : op1 = (row.total_val)? row.total_val : 0; break;
                    case 2 : op2 = (row.total_val)? row.total_val : 0; break;
                    case 3 : op3 = (row.total_val)? row.total_val : 0; break;
                    case 4 : op4 = (row.total_val)? row.total_val : 0; break;
                  }
                }
                choices = [{id:1,text:'',votes:op1},{id:2,text:'',votes:op2},{id:3,text:'',votes:op3},{id:4,text:'',votes:op4}];

                var poll = {};
                // console.log(result.rows[0]);
                poll.id = result.rows[0].pollid;
                poll.question = result.rows[0].question;
                poll.status = result.rows[0].status;

                for(var index=0;index<4;index++){
                  choices[index].text = eval('result.rows[0].option_'+(index+1));
                }

                poll.choices = choices;
                poll.userVoted = userVoted;
                poll.userChoice = userChoice;
                poll.totalVotes = totalVotes;
                // console.log(poll);
                socket.emit('newadded:vote', poll);
                socket.broadcast.emit('broadcast:vote', poll);
              }
            });
            // res.json(result.rows[0]);
          }
        });
      });
    });
  });
  // TO HANDLE THE REAL TIME QUESTION ADDITION
  socket.on('send:question', function(pollObj) {
    // CODE TO CREATE NEW POLL
    // var poll = new Poll(pollObj);
    // poll.save(function(err, doc) {
    //   if(err || !doc) {
    //     throw 'Error';
    //   } else {
    //     socket.emit('newadded:question', doc);
    //     socket.broadcast.emit('broadcast:questions', doc);
    //     // res.json(doc);
    //   }   
    // });

    pg.connect(conString, function(err, client, done) {
      if(err) {
        return console.error('error fetching client from pool', err);
      }
      // var datetime = new Date();
      var datetime = "2014-08-22 18:38:00";
      client.query("INSERT INTO polls (question,status,created_on,option_1,option_2,option_3,option_4) VALUES ($1,true,'"+datetime+"',$2,$3,$4,$5) RETURNING *", [pollObj.question,pollObj.option_1,pollObj.option_2,pollObj.option_3,pollObj.option_4], function(err, result) {
        //call `done()` to release the client back to the pool
        done();
        if(err) {
          // return console.error('error running query', err);
          console.error('error running query', err);
          throw 'Error';
        }else{
          socket.emit('newadded:question', result.rows[0]);
          socket.broadcast.emit('broadcast:questions', result.rows[0]);
        }
      });
    });

  });
  // TO HANDLE THE REAL TIME QUESTION DELETION
  socket.on('delete:question', function(pollObj) {
    // CODE TO DELETE
    /*Poll.findById( pollObj._id , function(err, doc){
      if(err || !doc) {
        throw 'Error';
      } else {
        // socket.emit('remove:question', pollObj);
        doc.remove();
        socket.broadcast.emit('broadcast_remove:questions', pollObj);
      }   
    });*/

    pg.connect(conString, function(err, client, done) {
      if(err) {
        return console.error('error fetching client from pool', err);
      }
      // var datetime = new Date();
      var datetime = "2014-08-22 18:38:00";
      client.query("DELETE FROM polls WHERE id = $1 RETURNING *", [pollObj.id], function(err, result) {
        //call `done()` to release the client back to the pool
        done();
        if(err) {
          // return console.error('error running query', err);
          console.error('error running query', err);
          throw 'Error';
        }else{
          // console.log(result);
          socket.broadcast.emit('broadcast_remove:questions', result.rows[0]);
        }
      });
    });
  });
};