// Managing the poll list
function PollListCtrl($scope, socket, Poll) {
  $scope.polls = Poll.getPollList();
  Poll.all();
  // console.log($scope.polls[1]);
  socket.on('newadded:question', function(data) {
    console.dir(data);
    if(data._id!='') {
      // $scope.poll = data;
      Poll.insertPollIntoList({_id:data._id,question:data.question});
    }
  });
  socket.on('broadcast:questions', function(data) {
    console.dir(data);
    if(data._id!='') {
      // $scope.poll = data;
      Poll.insertPollIntoList({_id:data._id,question:data.question});
    }
  });

  // socket.on('remove:question', function(data) {
  //   console.dir(data);
  //   if(data._id!='') {
  //     // $scope.poll = data;
  //     Poll.removePollFromList(data);
  //   }
  // });
  socket.on('broadcast_remove:questions', function(data) {
    console.dir(data);
    if(data._id!='') {
      // $scope.poll = data;
      Poll.removePollFromList(data);
    }
  });
  $scope.delete = function(obj){
    if(confirm('Do you really want to delete this poll?')){
      Poll.removePollFromList(obj);
      socket.emit('delete:question', obj);
    }
  };
}
// Voting / viewing poll results
function PollItemCtrl($scope, $routeParams, socket, Poll) { 
  // $scope.poll = Poll.get({pollId: $routeParams.pollId});
  // $scope.vote = function() {};

  $scope.poll = Poll.get({pollId: $routeParams.pollId});
  socket.on('newadded:vote', function(data) {
    console.dir(data);
    if(data._id === $routeParams.pollId) {
      $scope.poll = data;
    }
  });
  socket.on('broadcast:vote', function(data) {
    console.dir(data);
    if(data._id === $routeParams.pollId) {
      $scope.poll.choices = data.choices;
      $scope.poll.totalVotes = data.totalVotes;
    }   
  });
  $scope.vote = function() {
    var pollId = $scope.poll._id,
        choiceId = $scope.poll.userVote;
    if(choiceId) {
      var voteObj = { poll_id: pollId, choice: choiceId };
      socket.emit('send:vote', voteObj);
    } else {
      alert('You must select an option to vote for');
    }
  };
}
// Creating a new poll
function PollNewCtrl($scope, $location, socket, Poll) {
  $scope.poll = {
    question: '',
    choices: [ { text: '' }, { text: '' }, { text: '' }]
  };  
  $scope.addChoice = function() {
    $scope.poll.choices.push({ text: '' });
  };
  $scope.createPoll = function() {
    var poll = $scope.poll;
    if(poll.question.length > 0) {
      var choiceCount = 0;
      for(var i = 0, ln = poll.choices.length; i < ln; i++) {
        var choice = poll.choices[i];        
        if(choice.text.length > 0) {
          choiceCount++
        }
      }    
      if(choiceCount > 1) {
        // var newPoll = new Poll(poll);
        // newPoll.$save(function(p, resp) {
        //   if(!p.error) { 
        //     $location.path('polls');
        //   } else {
        //     alert('Could not create poll');
        //   }
        // });
        
        // var newPoll = new Poll(poll);
        // var voteObj = { poll_id: pollId, choice: choiceId };
        socket.emit('send:question', poll);
        $location.path('polls');
      } else {
        alert('You must enter at least two choices');
      }
    } else {
      alert('You must enter a question');
    }
  };
}