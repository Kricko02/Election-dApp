var Election = artifacts.require("./Election.sol");
//testi
contract("Election", function(accounts) {
    var electionInstance;
  
    it("samo 2 kandidata", function() {
      return Election.deployed().then(function(instance) {
        return instance.candidatesCount();
      }).then(function(count) {
        assert.equal(count, 2);
      });
    });

    it("pravilne vrednosti", function() {
        return Election.deployed().then(function(instance) {
          electionInstance = instance;
          return electionInstance.candidates(1);
        }).then(function(candidate) {
          assert.equal(candidate[0], 1, "contains the correct id");
          assert.equal(candidate[1], "Janez Janša", "contains the correct name");
          assert.equal(candidate[2], 0, "contains the correct votes count");
          return electionInstance.candidates(2);
        }).then(function(candidate) {
          assert.equal(candidate[0], 2, "contains the correct id");
          assert.equal(candidate[1], "Borut Pahor", "contains the correct name");
          assert.equal(candidate[2], 0, "contains the correct votes count");
        });
      });


      it("lahko voli", function() {
        return Election.deployed().then(function(instance) {
          electionInstance = instance;
          candidateId = 1;
          return electionInstance.vote(candidateId, { from: accounts[0] });
        }).then(function(receipt) {
            assert.equal(receipt.logs.length, 1, "dela");
            assert.equal(receipt.logs[0].event, "votedEvent", "pravi tip");
            assert.equal(receipt.logs[0].args._candidateId.toNumber(), candidateId, "pravilni id kandidata");
            return electionInstance.voters(accounts[0]);
        }).then(function(voted) {
          assert(voted, "kandiat izvoljen");
          return electionInstance.candidates(candidateId);
        }).then(function(candidate) {
          var voteCount = candidate[2];
          assert.equal(voteCount, 1, "veljaven glas");
        })
      });

      it("napačen kandidat", function() {
        return Election.deployed().then(function(instance) {
          electionInstance = instance;
          return electionInstance.vote(99, { from: accounts[1] })
        }).then(assert.fail).catch(function(error) {
          assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
          return electionInstance.candidates(1);
        }).then(function(candidate1) {
          var voteCount = candidate1[2];
          assert.equal(voteCount, 1, "kandidat1 ni dobil glasa");
          return electionInstance.candidates(2);
        }).then(function(candidate2) {
          var voteCount = candidate2[2];
          assert.equal(voteCount, 0, "kandidat2 ni doibl glasas");
        });
      });

      it("double voting", function() {
        return Election.deployed().then(function(instance) {
          electionInstance = instance;
          candidateId = 2;
          return electionInstance.vote(candidateId, { from: accounts[1] });
        }).then(function(receipt) {
          return electionInstance.voters(accounts[1]);
        }).then(function(voted) {
          assert(voted, "kandidat dobil glas");
          return electionInstance.candidates(candidateId);
        }).then(function(candidate) {
          var voteCount = candidate[2];
          assert.equal(voteCount, 1, "prvi glas");
          // Try to vote again
          return electionInstance.vote(candidateId, { from: accounts[1] });
        }).then(assert.fail).catch(function(error) {
          assert(error.message.includes('Voter has already voted'), "že glasoval");
          return electionInstance.candidates(1);
        }).then(function(candidate1) {
          var voteCount = candidate1[2];
          assert.equal(voteCount, 1, "kandidat1 ni dobil glasa");
          return electionInstance.candidates(2);
        }).then(function(candidate2) {
          var voteCount = candidate2[2];
          assert.equal(voteCount, 1, "kandidat2 ni dobil glasa");
        });
      });

});