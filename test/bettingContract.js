const BettingContract = artifacts.require('./BettingContract.sol')
const assert = require('assert')
const truffleAssert = require('truffle-assertions');

contract('BettingContract', (accounts) => {
   beforeEach(async () => {
      contractInstance = await BettingContract.deployed()
   })
   it('Return sum of', async () => {
      await contractInstance.bid(210)

      const accountOne = accounts[0];
      const BidValueAcc1= (await contractInstance.getBidofAccount.call(accountOne)).toNumber();

      assert.equal(BidValueAcc1.valueOf(), 210);
   })
   it('Events are published', async () => {
      const number= 2000;
      const accountOne = accounts[0];


      let result= await contractInstance.bettingEnd(number, { from: accountOne, value: 20 });

      // Is event transmitted during execution of bettingEnd
      truffleAssert.eventEmitted(result, 'Payout', (ev) => {
         return ev.winner == accountOne && ev.payout.toNumber() === 2000;
      });
   })
})
 