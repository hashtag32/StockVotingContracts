const StockBetting = artifacts.require('./StockBetting.sol')
const assert = require('assert')
const truffleAssert = require('truffle-assertions');

contract('StockBetting_unittest', (accounts) => {
   beforeEach(async () => {
      contractInstance = await StockBetting.deployed()
   })
   it('Constructor test', async () => {
      const accountOne = accounts[0];
      const chairPerson= await contractInstance.chairperson.call();

      assert.equal(accountOne, chairPerson);
   })
   it('Bid function test', async () => {
      const accountOne = accounts[0];
      await contractInstance.bid(210, { from: accountOne, value: 5 });

      const BidValueAcc1= (await contractInstance.getBidofAccount.call(accountOne)).toNumber();

      assert.equal(BidValueAcc1.valueOf(), 210);

      const accountTwo = accounts[2];
      await contractInstance.bid(200, { from: accountTwo, value: 10 });

      const BidValueAcc2 = (await contractInstance.getBidofAccount.call(accountTwo)).toNumber();

      assert.equal(BidValueAcc2.valueOf(), 200);
   })
   it('Events are published', async () => {
      const number= 2000;
      const accountOne = accounts[0];


      let result= await contractInstance.bettingEnd(number, { from: accountOne });

      // Is event transmitted during execution of bettingEnd
      truffleAssert.eventEmitted(result, 'Payout', (ev) => {
         return ev.winner == accountOne && ev.payout.toNumber() == 15;
      });
   })

   it('Trying to end contract to !chairperson && already ended', async () => {
      const accountZero = accounts[0];
      const accountTwo = accounts[2];
      const number= 2000;

      const chairPerson= await contractInstance.chairperson.call();

      assert.equal(accountZero, chairPerson);

      // let result= await contractInstance.bettingEnd(number, { from: accountTwo });

      await truffleAssert.reverts(
         contractInstance.bettingEnd(number, { from: accountTwo }),
         "Not the rights to end this contract"
     );
   })

   it('Trying to end contract with chairperson, but already ended', async () => {
      const number= 200;
      const chairPerson= await contractInstance.chairperson.call();

      await truffleAssert.reverts(
         contractInstance.bettingEnd(number, { from: chairPerson }),
         "Contract has already ended"
     );
   })
})
 

contract('StockBetting_integration', (accounts) => {
   beforeEach(async () => {
      contractInstance = await StockBetting.deployed()
   })
   // 1 bid %% 2 bid 
   it('Usual Workflow (1 wins)', async () => {
      // Constructor (chairperson)
      const accountZero = accounts[0];
      const accountOne = accounts[1];
      const accountTwo = accounts[2];
      const winnerAccount=accountOne;
      const loserAccount=accountTwo;
      bidvalue1=200;
      bidamount1=20;
      bidvalue2=100;
      bidamount2=10;

      // Action
      await contractInstance.bid(bidvalue1, { from: accountOne, value: bidamount1 });
      await contractInstance.bid(bidvalue2, { from: accountTwo, value:bidamount2 });

      // Prerequisites
      const winnerAccountBalanceBefore = (await web3.eth.getBalance(winnerAccount));
      const loserAccountBalanceBefore = (await web3.eth.getBalance(loserAccount));

      let bettingEndCall = await contractInstance.bettingEnd(160, { from: accountZero });
      
      // Is event transmitted during execution of bettingEnd
      let payoutsum=bidamount1+bidamount2;
      truffleAssert.eventEmitted(bettingEndCall, 'Payout', (ev) => {
         return (ev.winner == winnerAccount) && (ev.payout.toNumber() == payoutsum);
      });
      
      // Test chairPerson 
      const chairPerson= await contractInstance.chairperson.call();
      assert.equal(accountZero, chairPerson);

      // Test payout
      const winnerAccountBalanceAfter = (await web3.eth.getBalance(winnerAccount));
      const loserAccountBalanceAfter = (await web3.eth.getBalance(loserAccount));
      assert.equal(loserAccountBalanceAfter, loserAccountBalanceBefore);
      // assert.equal(winnerAccountBalanceAfter, winnerAccountBalanceBefore+payoutsum);
   })

    // 1 bid %% 2 bid 
    it('Usual Workflow (2 wins)', async () => {
      contractInstance = await StockBetting.new(30);
      // Constructor (chairperson)
      const accountZero = accounts[0];
      
      const accountOne = accounts[1];
      bidvalue1=200;
      bidamount1=20;

      await contractInstance.bid(bidvalue1, { from: accountOne, value: bidamount1 });

      const accountTwo = accounts[2];
      bidvalue2=100;
      bidamount2=10;

      await contractInstance.bid(bidvalue2, { from: accountTwo, value:bidamount2 });

      // So accountTwo is the winner
      let bettingEndCall = await contractInstance.bettingEnd(80, { from: accountZero });
      
      // Is event transmitted during execution of bettingEnd
      let sum=bidamount1+bidamount2;
      truffleAssert.eventEmitted(bettingEndCall, 'Payout', (ev) => {
         return (ev.winner == accountTwo) && (ev.payout.toNumber() == sum);
      });
      
      const chairPerson= await contractInstance.chairperson.call();
      assert.equal(accountZero, chairPerson);

   })
   // transfered to correct recipient
})
 


contract('StockBetting_time', (accounts) => {
   beforeEach(async () => {
      contractInstance = await StockBetting.deployed()
   })
   it('Test times ', async () => {
      // Constructor (chairperson)
      const accountZero = accounts[0];
      const accountOne = accounts[1];
      bidvalue1=200;
      bidamount1=20;
      bidvalue2=100;
      bidamount2=10;
      seconds_per_days=86400;

      //****Bid****/
      // Bid within the bid valid time range
      await contractInstance.bid(bidvalue1, { from: accountOne, value: bidamount1 });

      // Bid within the bid valid time range (now + 3 days - 1
      const orig_contract_bidEndTime= await contractInstance.bidEndTime.call();
      let bidEndTime_in2days=orig_contract_bidEndTime - seconds_per_days*1;

      // No rights to change value
      await truffleAssert.reverts(
         contractInstance.setbidEndTime(bidEndTime_in2days, { from: accountOne }),
         "Not the rights to change this value"
      );
      
      // Bid within the bid valid time range, but modified date 
      await contractInstance.setbidEndTime(bidEndTime_in2days, { from: accountZero });
      await contractInstance.bid(bidvalue1, { from: accountOne, value: bidamount1 });


      // Bid outside the bid valid time range 
      let bidEndTime_since1day=orig_contract_bidEndTime - seconds_per_days*4;
      await contractInstance.setbidEndTime(bidEndTime_since1day, { from: accountZero });
      
      await truffleAssert.reverts(
         contractInstance.bid(bidvalue1, { from: accountOne, value: bidamount1 }),
         "No bid possible anymore, the time to bid has ended"
      );


      //****bettingEnd****/

      //todo


   })
})
 

contract('StockBetting_conditions', (accounts) => {
   beforeEach(async () => {
      contractInstance = await StockBetting.deployed()
   })
   it('lonely voter ', async () => {
      // Constructor (chairperson)
      const accountZero = accounts[0];
      const accountOne = accounts[1];
      bidvalue1=200;
      bidamount1=20;

      // Voting within the voting time range
      await contractInstance.bid(bidvalue1, { from: accountOne, value: bidamount1 });

      // Voting was not possible because only one voter
      
      let bettingEndCall = await contractInstance.bettingEnd(160, { from: accountZero });

      truffleAssert.eventEmitted(bettingEndCall, 'Payout', (ev) => {
         return (ev.winner == accountOne) && (ev.payout.toNumber() == bidamount1);
      });
   })
})
 