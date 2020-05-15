const StockBetting = artifacts.require('./StockBetting.sol');
const assert = require('assert');
const truffleAssert = require('truffle-assertions');



// Using the async/await notation with because we want to wait for each step
// https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript

// For further tests, this might be helpful: 
// https://github.com/OpenZeppelin/openzeppelin-test-helpers/blob/master/README.md


contract('StockBetting_unittest', (accounts) => {
   
   beforeEach(async () => {
      contractInstance = await StockBetting.deployed();
      accountZero = accounts[0];
      accountOne = accounts[1];
      accountTwo = accounts[2];

      bidValue1=210;
      bidValue2=200;

      stockValue=2000;

      orig_contract_runEndTime= await contractInstance.runEndTime.call();
      runEndTime_in35days=orig_contract_runEndTime - 86400*35;
   })
   it('Constructor test', async () => {
      const chairPerson= await contractInstance.chairperson.call();

      assert.equal(accountZero, chairPerson);
   })
   it('Bid function test', async () => {
      await contractInstance.bid(bidValue1, { from: accountOne, value: 5 });

      const BidValueAcc1= (await contractInstance.getBidofAccount.call(accountOne)).toNumber();

      assert.equal(BidValueAcc1.valueOf(), 210);

      await contractInstance.bid(bidValue2, { from: accountTwo, value: 10 });

      const BidValueAcc2 = (await contractInstance.getBidofAccount.call(accountTwo)).toNumber();

      assert.equal(BidValueAcc2.valueOf(), 200);
   })
   it('Payout event published', async () => {
      await contractInstance.setrunEndTime(runEndTime_in35days, { from: accountZero });
      let result= await contractInstance.bettingEnd(stockValue, { from: accountZero });

      // Is event transmitted during execution of bettingEnd
      truffleAssert.eventEmitted(result, 'Payout', (ev) => {
         return ev.winner == accountOne && ev.payout.toNumber() == 15;
      });
   })

   it('Trying to end contract to !chairperson && already ended', async () => {
      const chairPerson= await contractInstance.chairperson.call();
      
      assert.equal(accountZero, chairPerson);

      await truffleAssert.reverts(
         contractInstance.bettingEnd(stockValue, { from: accountTwo }),
         "Not the rights to end this contract"
     );
   })

   it('Trying to end contract with chairperson, but already ended', async () => {
      const chairPerson= await contractInstance.chairperson.call();

      await truffleAssert.reverts(
         contractInstance.bettingEnd(stockValue, { from: chairPerson }),
         "Contract has already ended"
     );
   })
})
 

contract('StockBetting_integration', (accounts) => {
   beforeEach(async () => {
      contractInstance = await StockBetting.deployed();
      accountZero = accounts[0];
      accountOne = accounts[1];
      accountTwo = accounts[2];
      winnerAccount=accountOne;
      loserAccount=accountTwo;
      bidvalue1=200;
      bidamount1=20;
      bidvalue2=100;
      bidamount2=10;

      orig_contract_runEndTime= await contractInstance.runEndTime.call();
      runEndTime_in35days=orig_contract_runEndTime - 86400*35;
   })
   // 1 bid && 2 bid 
   it('Usual Workflow (1 wins)', async () => {

      // Action
      await contractInstance.bid(bidvalue1, { from: accountOne, value: bidamount1 });
      await contractInstance.bid(bidvalue2, { from: accountTwo, value:bidamount2 });

      // Prerequisites
      const winnerAccountBalanceBefore = (await web3.eth.getBalance(winnerAccount));
      const loserAccountBalanceBefore = (await web3.eth.getBalance(loserAccount));

      await contractInstance.setrunEndTime(runEndTime_in35days, { from: accountZero });
      let bettingEndCall = await contractInstance.bettingEnd(160, { from: accountZero });
      
      // Is event transmitted during execution of bettingEnd
      let payoutsum=bidamount1+bidamount2;
      truffleAssert.eventEmitted(bettingEndCall, 'Payout', (ev) => {
         return (ev.winner == winnerAccount) && (ev.payout.toNumber() == payoutsum);
      });
      
      // Test payout
      const winnerAccountBalanceAfter = (await web3.eth.getBalance(winnerAccount));
      const loserAccountBalanceAfter = (await web3.eth.getBalance(loserAccount));

      // Simplicity, but could be improved
      // todo:transfered to correct recipient
      assert.equal(loserAccountBalanceAfter, loserAccountBalanceBefore);
      assert.notEqual(winnerAccountBalanceAfter, winnerAccountBalanceBefore);
   })

    // 1 bid && 2 bid 
    it('Usual Workflow (2 wins)', async () => {
      var runTime= 86400 * 30;
      var bidTime= 86400 * 3;
      var chairPerson="0xeDf9A6E86c516405464eb09C47580C4feB884A84";
      contractInstance = await StockBetting.new(chairPerson, runTime,bidTime);

      await contractInstance.bid(bidvalue1, { from: accountOne, value: bidamount1 });
      await contractInstance.bid(bidvalue2, { from: accountTwo, value:bidamount2 });

      // So accountTwo is the winner
      await contractInstance.setrunEndTime(runEndTime_in35days, { from: accountZero });
      let bettingEndCall = await contractInstance.bettingEnd(80, { from: accountZero });
      
      // Is event transmitted during execution of bettingEnd
      let sum=bidamount1+bidamount2;
      truffleAssert.eventEmitted(bettingEndCall, 'Payout', (ev) => {
         return (ev.winner == accountTwo) && (ev.payout.toNumber() == sum);
      });
   })
})
 

contract('StockBetting_time', (accounts) => {
   beforeEach(async () => {
      contractInstance = await StockBetting.deployed();
      accountZero = accounts[0];
      accountOne = accounts[1];
      bidvalue1=200;
      bidamount1=20;
      bidvalue2=100;
      bidamount2=10;
      stockValue=140;
      seconds_per_days=86400;

      orig_contract_bidEndTime= await contractInstance.bidEndTime.call();
      orig_contract_runEndTime= await contractInstance.runEndTime.call();
      runEndTime_in35days=orig_contract_runEndTime - 86400*35;
   })
   it('bidEndTim valid ', async () => {
      // Bid within the bid valid time range
      await contractInstance.bid(bidvalue1, { from: accountOne, value: bidamount1 });

      // Bid within the bid valid time range (now + 3 days - 1)
      let bidEndTime_in2days=orig_contract_bidEndTime - seconds_per_days*1;

      // No rights to change value
      await truffleAssert.reverts(
         contractInstance.setbidEndTime(bidEndTime_in2days, { from: accountOne }),
         "Not the rights to change this value"
      );
      
      // Bid within the bid valid time range, but modified date 
      await contractInstance.setbidEndTime(bidEndTime_in2days, { from: accountZero });
      await contractInstance.bid(bidvalue1, { from: accountOne, value: bidamount1 });
   })

   it('bidEndTim invalid ', async () => {
      // Bid outside the bid valid time range 
      let bidEndTime_since1day=orig_contract_bidEndTime - seconds_per_days*4;
      await contractInstance.setbidEndTime(bidEndTime_since1day, { from: accountZero });
      
      await truffleAssert.reverts(
         contractInstance.bid(bidvalue1, { from: accountOne, value: bidamount1 }),
         "No bid possible anymore, the time to bid has ended"
      );
   })


   it('runEndTime invalid ', async () => {
      // runEndTime still valid
      let runEndTime_in25days=orig_contract_runEndTime - seconds_per_days*25;

      // No rights to change value
      await truffleAssert.reverts(
         contractInstance.setrunEndTime(runEndTime_in25days, { from: accountTwo }),
         "Not the rights to change this value"
      );
      
      // Set the runEndTime to an invalid range
      await contractInstance.setrunEndTime(runEndTime_in25days, { from: accountZero });

      await truffleAssert.reverts(
         contractInstance.bettingEnd(stockValue, { from: accountZero }),
         "Runtime of contract is not over yet"
      );
   })

   it('runEndTim valid ', async () => {
     // runEndTime still valid
     let runEndTime_in35days=orig_contract_runEndTime - seconds_per_days*35;

      // Set the runEndTime to an invalid range
      await contractInstance.setrunEndTime(orig_contract_runEndTime - seconds_per_days*35, { from: accountZero });
      await contractInstance.bettingEnd(stockValue, { from: accountZero });
   })
})
 

contract('StockBetting_conditions', (accounts) => {
   beforeEach(async () => {
      contractInstance = await StockBetting.deployed();
      accountZero = accounts[0];
      accountOne = accounts[1];
      bidvalue1=200;
      bidamount1=20;

      orig_contract_runEndTime= await contractInstance.runEndTime.call();
      runEndTime_in35days=orig_contract_runEndTime - 86400*35;
   })
   it('lonely voter', async () => {
      // Voting within the voting time range
      await contractInstance.bid(bidvalue1, { from: accountOne, value: bidamount1 });

      // Voting was not possible because only one voter
      await contractInstance.setrunEndTime(runEndTime_in35days, { from: accountZero });
      let bettingEndCall = await contractInstance.bettingEnd(160, { from: accountZero });

      truffleAssert.eventEmitted(bettingEndCall, 'Payout', (ev) => {
         return (ev.winner == accountOne) && (ev.payout.toNumber() == bidamount1);
      });
   })
})
 
contract('StockBetting_setter', (accounts) => {
   beforeEach(async () => {
      contractInstance = await StockBetting.deployed();
      accountZero = accounts[0];
      accountOne = accounts[1];

      chairPerson=accountTwo;
      var runTime= 86400 * 100;
      var bidTime= 86400 * 160;
      contractInstance = await StockBetting.new(chairPerson, runTime,bidTime);
   })
   it('chairperson', async () => {
      const chairPersonContract= await contractInstance.chairperson.call();
      assert.equal(accountTwo, chairPersonContract);
   })

   // it('bidEndTime', async () => {
   //    const bidEndTimeContract= await contractInstance.bidEndTime.call();
   //    assert.equal(now86400 * 160, bidEndTimeContract);
   // })

   // it('runEndTime', async () => {
   //    const runEndTimeContract= await contractInstance.runEndTime.call();
   //    assert.equal(86400 * 100, runEndTimeContract);
   // })
})
 