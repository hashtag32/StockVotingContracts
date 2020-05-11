const ConvertLib = artifacts.require("ConvertLib");
const MetaCoin = artifacts.require("MetaCoin");
const TodoList = artifacts.require("TodoList");
const StockBetting = artifacts.require("StockBetting");
// const ExecutionContract= artifacts.require("ExecutionContract");

module.exports = function(deployer) {
  deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, MetaCoin);
  deployer.deploy(MetaCoin);
  deployer.deploy(TodoList);
  var runTime= 86400 * 30;
  var bidTime= 86400 * 3;
  var chairPerson="0xeDf9A6E86c516405464eb09C47580C4feB884A84";
  deployer.deploy(StockBetting, chairPerson, runTime,bidTime);
  // deployer.deploy(ExecutionContract);
};
