const ConvertLib = artifacts.require("ConvertLib");
const MetaCoin = artifacts.require("MetaCoin");
const TodoList = artifacts.require("TodoList");
const StockBetting = artifacts.require("StockBetting");
const KnockOut = artifacts.require("KnockOut");

module.exports = function(deployer) {
  deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, MetaCoin);
  deployer.deploy(MetaCoin);
  deployer.deploy(TodoList);

  // StockBetting
  var runTime= 86400 * 30;
  var bidTime= 86400 * 3;
  var chairPerson="0xeDf9A6E86c516405464eb09C47580C4feB884A84";

  deployer.deploy(StockBetting, chairPerson, runTime,bidTime);
  
  // Knock Out
  var startPrice=100;
  var knock_out_threshold=90;
  var leverage=15;
  var isPut=false;
  deployer.deploy(KnockOut, chairPerson, knock_out_threshold, leverage, startPrice, runTime, isPut);
};
