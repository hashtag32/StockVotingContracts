const KnockOut = artifacts.require("./KnockOut.sol");
const assert = require("assert");
const truffleAssert = require("truffle-assertions");

// Using the async/await notation with because we want to wait for each step
// https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript

// For further tests, this might be helpful:
// https://github.com/OpenZeppelin/openzeppelin-test-helpers/blob/master/README.md

contract("knockOut_basics", (accounts) => {
  beforeEach(async () => {
    contractInstance = await KnockOut.deployed();

    runTime = 86400 * 30;
    chairperson_exp = accounts[0];
    knock_out_threshold_exp = 90;
    leverage_exp = 10;
    last_closing_price_exp = startPrice = 100;
    pot_exp = 10;
    isPut_exp = false;
    contractCreator_exp = accounts[1];

    contractInstance = await KnockOut.new(
      accounts[0],
      knock_out_threshold_exp,
      leverage_exp,
      startPrice,
      runTime,
      isPut_exp,
      { from: contractCreator_exp, value: pot_exp }
    );
  });
  it("Constructor test", async () => {
    const chairperson = await contractInstance.chairperson.call();
    const knock_out_threshold = await contractInstance.knock_out_threshold.call();
    const leverage = await contractInstance.leverage.call();
    const last_closing_price = await contractInstance.last_closing_price.call();
    const pot = await contractInstance.pot.call();
    const isPut = await contractInstance.isPut.call();
    const contractCreator = await contractInstance.contractCreator.call();

    assert.equal(chairperson, chairperson_exp);
    assert.equal(knock_out_threshold, knock_out_threshold_exp);
    assert.equal(leverage, leverage_exp);
    assert.equal(last_closing_price, last_closing_price_exp);
    assert.equal(pot, pot_exp);
    assert.equal(isPut, isPut_exp);
    assert.equal(contractCreator, contractCreator_exp);
  });
  it("Bid function test", async () => {});
  it("Payout event published", async () => {});

  it("Trying to end contract to !chairperson && already ended", async () => {});

  it("Trying to end contract with chairperson, but already ended", async () => {});
});

contract("KnockOut_integration", (accounts) => {
  beforeEach(async () => {
    contractInstance = await KnockOut.deployed();
  });
  // 1 bid && 2 bid
  it("Usual Workflow", async () => {
   await contractInstance.buyShare( { from: accounts[2], value: 10 });
   await contractInstance.update(110,100, { from: accounts[0] });

   // Is holding the shares
   let activeShareHolderBefore=await contractInstance.activeShareHolder.call(0);
   assert.equal(activeShareHolderBefore.account, accounts[2]);
   assert.equal(activeShareHolderBefore.amount,10);

   let sellShares=await contractInstance.sellShare( { from: accounts[2] });
   truffleAssert.eventEmitted(sellShares, 'ShareSold_ev',  (ev) => {
       return (ev.shareHolderAddress == accounts[2]) && (ev.amount.toNumber() == 10);
   });

   // Shouldn't be holding the shares
   let activeShareHolderAfter=await contractInstance.activeShareHolder.call(0);
   assert.notEqual(activeShareHolderAfter.account, accounts[2]);

   // Should be in pendingReturns
   let pendingReturnsBefore=await contractInstance.pendingReturns.call(accounts[2]);
   assert.equal(pendingReturnsBefore, 10);

   let withDrawResult=await contractInstance.withdraw({ from: accounts[2] });

   let pendingReturnsAfter=await contractInstance.pendingReturns.call(accounts[2]);
   assert.equal(pendingReturnsAfter, 0);
   
   // Check worth of shares
   await contractInstance.buyShare( { from: accounts[3], value: 10 });
   await contractInstance.update(100,100, { from: accounts[0]});
   await contractInstance.update(90,90, { from: accounts[0]});

   let updateWithKnockOut=await contractInstance.update(80,80, { from: accounts[0]});
   truffleAssert.eventEmitted(updateWithKnockOut, 'KnockOut_ev',  (ev) => {
      return (ev.stockValue == 80) ;
   });
   truffleAssert.eventEmitted(updateWithKnockOut, 'ContractEnded_ev',  (ev) => {
      return (ev.terminatorAddress == accounts[0]) ;
   });
  });
});

contract("KnockOut_functions", (accounts) => {
  beforeEach(async () => {
    contractInstance = await KnockOut.deployed();
    accountZero = accounts[0];
    accountOne = accounts[1];
    accountTwo = accounts[2];
  });
  it("buyShare ", async () => {});

  it("sellShare", async () => {});

  it("retractContract", async () => {});

  it("endContract", async () => {});
  it("withdraw", async () => {});
  it("update", async () => {
   var daily_minimum=110;
   var last_closing_price=110;
   await contractInstance.update(daily_minimum,last_closing_price, { from: accounts[0]});

   const last_closing_price_return= await contractInstance.last_closing_price.call();
   assert.equal(last_closing_price, last_closing_price_return);
  });

  it("knockOut", async () => {});

  it("calcPendingReturn ", async () => {});
});

// contract('KnockOut_setter', (accounts) => {
//    beforeEach(async () => {
//       contractInstance = await KnockOut.deployed();
//       accountZero = accounts[0];
//       accountOne = accounts[1];

//       chairPerson=accountTwo;
//       var runTime= 86400 * 100;
//       var bidTime= 86400 * 160;
//       contractInstance = await KnockOut.new(chairPerson, runTime,bidTime);
//    })
//    it('chairperson', async () => {
//       const chairPersonContract= await contractInstance.chairperson.call();
//       assert.equal(accountTwo, chairPersonContract);
//    })

//    // it('bidEndTime', async () => {
//    //    const bidEndTimeContract= await contractInstance.bidEndTime.call();
//    //    assert.equal(now86400 * 160, bidEndTimeContract);
//    // })

//    // it('runEndTime', async () => {
//    //    const runEndTimeContract= await contractInstance.runEndTime.call();
//    //    assert.equal(86400 * 100, runEndTimeContract);
//    // })
// })
