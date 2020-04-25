// const BettingContract = artifacts.require("BettingContract");

// contract("BettingContract", accounts => {
//    contractInstance = await BettingContract.deployed()
//    it('should add a bid to the contract', async () => {
//       await contractInstance.bid(210);
//       const addedValue = await contractInstance.bids(0);
//       // const todoContent = web3.toUtf8(newAddedTodo[1])
      
//       assert.equal(addedValue,210, 'The content of the new added todo is not correct')
//    })
// })


// contract("BettingContract", async accounts => {
//    it("should add a bid to the contract", async () => {
//      let contractInstance = await BettingContract.deployed();
//      await contractInstance.bid(210);

//      const addedValue = await contractInstance.bids(0);
//      assert.equal(addedValue.valueOf(), 210);
//    //   let balance = await instance.getBalance.call(accounts[0]);

//      // const todoContent = web3.toUtf8(newAddedTodo[1])
     
//    //   assert.equal(addedValue,210, 'The content of the new added todo is not correct')
//    });
// })
 

contract('BettingContract', (accounts) => {
   beforeEach(async () => {
      contractInstance = await BettingContract.deployed()
   })
   it('should add a to-do note successfully with a short text of 20 letters', async () => {
      await contractInstance.bid(210)

      // const addedValue = await contractInstance.bids(0);
      // assert.equal(addedValue.valueOf(), 210);

      // await contractInstance.addTodo(web3.toHex('this is a short text'))
      // const newAddedTodo = await contractInstance.todos(accounts[0], 0)
      // const todoContent = web3.toUtf8(newAddedTodo[1])
      
      // assert.equal(todoContent, 'this is a short text', 'The content of the new added todo is not correct')
   })
})
 



//   it("should put 10000 MetaCoin in the first account", () =>
//     MetaCoin.deployed()
//       .then(instance => instance.getBalance.call(accounts[0]))
//       .then(balance => {
//         assert.equal(
//           balance.valueOf(),
//           10000,
//           "10000 wasn't in the first account"
//         );
//       }));




// contract('BettingContract', (accounts) => {
//    beforeEach(async () => {
//       contractInstance = await BettingContract.deployed()
//    })
//    it('should add a bid to the contract', async () => {
//       await contractInstance.bid(210)
//       const addedValue = await contractInstance.bids(0)
//       // const todoContent = web3.toUtf8(newAddedTodo[1])
      
//       assert.equal(addedValue,210, 'The content of the new added todo is not correct')
//    })
// })