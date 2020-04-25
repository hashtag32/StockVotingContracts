const ConvertLib = artifacts.require("ConvertLib");
const MetaCoin = artifacts.require("MetaCoin");
const TodoList = artifacts.require("TodoList");
const BettingContract = artifacts.require("BettingContract");
// const ExecutionContract= artifacts.require("ExecutionContract");

module.exports = function(deployer) {
  deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, MetaCoin);
  deployer.deploy(MetaCoin);
  deployer.deploy(TodoList);
  var BidingTime= 30;
  deployer.deploy(BettingContract, BidingTime);
  // deployer.deploy(ExecutionContract);
};
