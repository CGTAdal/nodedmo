'use strict';

var pollServices = angular.module('pollServices', ['ngResource']);

/*pollServices.factory('Poll', function($resource) {
	return $resource('/polls/:pollId', {}, {
	  query: { method: 'GET', params: { pollId: 'polls' }, isArray: true }
	})
});*/

pollServices.factory('Poll', function($resource) {
  var Poll = {};
  var pollList = [];
  
  var service = $resource('/polls/:pollId',{},{ query: { method: 'GET', params: { pollId: 'polls' }, isArray: true } });
  //var cardlink_service = $resource('/api/cardlinks/:id', {id: '@id'}, {'update': {method: 'PUT'}});
  //var opportunity_card_service = $resource('/api/cards/externalcard/', {}, {'update': {method: 'PUT'}});
  //var update_card_position = $resource('/api/cards/updatecardspos/', {}, {'update': {method: 'PUT'}});
  //var evaluate_cards = $resource('/api/cards/evaluate/', {}, {'update': {method: 'PUT'}});

  // TO CLEAR VALUES
  Poll.clearPolls = function(){
    var len = pollList.length;
    for(var j = 0; j<len ;j++) {
      if (pollList[j]) {
        pollList.splice(j, 1);
        j--;
      }
    }
  };

  // TO GET THE CARD LIST
  Poll.getPollList = function(){
    return pollList;
  };
  
  // UPDATE CARD BY ID FROM CLIENT SIDE
  Poll.updatePollById = function(cardobj){
    var len = pollList.length;
    for(var i=0;i<len;i++) {
      if (pollList[i] && pollList[i].id == cardobj.id) {
        pollList[i] = cardobj.$$hashKey;
        return;
      }
    }
  };

  // INSERT CARD INTO CARD LIST
  Poll.insertPollIntoList = function(pollobj){
    pollList.push(pollobj);
  };

  Poll.removePollFromList = function(obj){
    angular.forEach(pollList, function(existingobj, index) {
      if (pollList[index].id == obj.id) {
        pollList.splice(index, 1);
        return;
      }
    });
  };

  // COMMON FUNCTIONS TO INTERECT WITH SERVER
  Poll.all = function(){
    service.query().$promise.then(function(data){
      angular.forEach(data,function(item,rowindex){
        pollList.push(item);
      });
    });
    // return service.query();
  };
  // COMMON FUNCTIONS TO INTERECT WITH SERVER
  Poll.get = function(pollId){
    return service.get(pollId);
  };

  return Poll;
});

pollServices.factory('socket', function($rootScope) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});

