// Managing the poll list
function PollListCtrl($scope, socket, Poll) {
  $scope.polls = Poll.getPollList();
  Poll.all();
  // console.log($scope.polls[1]);
  socket.on('newadded:question', function(data) {
    // console.dir(data);
    if(data.id!='') {
      // $scope.poll = data;
      Poll.insertPollIntoList(data);
    }
  });
  socket.on('broadcast:questions', function(data) {
    // console.dir(data);
    if(data.id!='') {
      // $scope.poll = data;
      Poll.insertPollIntoList(data);
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
    // console.dir(data);
    if(data.id!='') {
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
function PollItemCtrl($scope, $location, $routeParams, socket, Poll) { 
  // $scope.poll = Poll.get({pollId: $routeParams.pollId});
  // $scope.vote = function() {};

  $scope.poll = Poll.get({pollId: $routeParams.pollId});
  // console.log($scope.poll);
  socket.on('newadded:vote', function(data) {
    // console.log(data.id+'='+$routeParams.pollId);
    if(data.id == $routeParams.pollId) {
      $scope.poll.id = data.id;
      $scope.poll.question = data.question;
      $scope.poll.status = data.status;
      $scope.poll.choices = data.choices;
      $scope.poll.userVoted = data.userVoted;
      $scope.poll.userChoice = data.userChoice;
      $scope.poll.totalVotes = data.totalVotes;
    }
  });

  socket.on('broadcast:vote', function(data) {
    // console.log(data);
    if(data.id == $routeParams.pollId) {
      // $scope.poll.choices = data.choices;
      // $scope.poll.totalVotes = data.totalVotes;
      $scope.poll.id = data.id;
      $scope.poll.question = data.question;
      $scope.poll.status = data.status;
      $scope.poll.choices = data.choices;
      $scope.poll.userVoted = data.userVoted;
      $scope.poll.userChoice = data.userChoice;
      $scope.poll.totalVotes = data.totalVotes;
    }   
  });

  socket.on('broadcast_remove:questions', function(data) {
    // console.dir(data);
    if(data.id == $routeParams.pollId) {
      $location.path('polls');
    }
  });

  $scope.vote = function() {
    var pollId = $scope.poll.id,
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
  // $scope.poll = {
  //   question: '',
  //   choices: [ { text: '' }, { text: '' }, { text: '' }, { text: '' }]
  // };
  $scope.poll = {
    question: '',
    option_1: '',
    option_2: '',
    option_3: '',
    option_4: ''
  };

  $scope.addChoice = function() {
    $scope.poll.choices.push({ text: '' });
  };
  $scope.createPoll = function() {
    var poll = $scope.poll;
    if(poll.question.length > 0) {
      var choiceCount = 0;
      // for(var i = 0, ln = poll.choices.length; i < ln; i++) {
      //   var choice = poll.choices[i];        
      //   if(choice.text.length > 0) {
      //     choiceCount++
      //   }
      // }
      for(var i = 1, ln = 4; i <= ln; i++) {
        var choice = eval('poll.option_'+[i]);
        if(choice.length > 0) {
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