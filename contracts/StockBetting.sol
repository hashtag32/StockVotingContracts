pragma solidity 0.5.16;

//todo: StockBetting
// This contract is unique per stock, but the 
contract StockBetting {
    // Parameters of the auction. Times are either
    // absolute unix timestamps (seconds since 1970-01-01)
    // or time periods in seconds.

    struct Bid {
        address payable account;

        uint bid; // estimated stock value in now + _biddingtime
        uint amount; //todo: replace with deposit
    }

    Bid[] public bids;

    // mapping(address => Bid) public bids;

    uint public bidEndTime;
    // bytes32 public StockSymbol;

    // admin of the contract -> StockVoting
    address payable public chairperson;

    //todo: publish address of winner (after contract ended)

    // Set to true at the end, disallows any change.
    // By default initialized to `false`.
    bool ended;

    // Events that will be emitted on changes.
    event Payout(address payable winner, uint payout);
    event Debug(uint value);

    constructor(
        uint _biddingTime
    ) public {
        chairperson = msg.sender;
        // todo: Safe?
        bidEndTime = now + _biddingTime;
    }

    /// Bid on the auction with the value sent
    /// together with this transaction.
    function bid(uint bidValue) public payable {
        // The keyword payable
        // is required for the function to
        // be able to receive Ether.

        // Revert the call if the bidding
        // period is over.
        // require(
        //     now <= bidEndTime,
        //     "Auction already ended."
        // );

        bids.push(Bid({
            account: msg.sender,
            bid: bidValue,
            amount: msg.value
        }));


        // if (highestBid != 0) {
        //     // Sending back the money by simply using
        //     // highestBidder.send(highestBid) is a security risk
        //     // because it could execute an untrusted contract.
        //     // It is always safer to let the recipients
        //     // withdraw their money themselves.
        //     pendingReturns[highestBidder] += highestBid;
        // }
        // highestBidder = msg.sender;
        // highestBid = msg.value;

        //todo: publish event when bidadded...
        // emit HighestBidIncreased(msg.sender, msg.value);
    }

    /// End the betting because the time is up 
    /// to the winner.
    function bettingEnd(uint stockValue) external payable {
        // 1. checking conditions
        // 2. performing actions (potentially changing conditions)
        // 3. interacting with other contracts

        // require(now >= bidEndTime, "Biding Time is not over yet.");
        require(msg.sender==chairperson, "Not the rights to end this contract.");
        require(!ended, "Contract has already ended.");

        // 2. Effects
        ended = true;
        uint payoutsum = 0;
        //todo: optimize -> not safe
        // int distance = Math.abs(numbers[0] - myNumber);
        uint previous_diff = 10000;
        address payable winner;

        for (uint p = 0; p < bids.length; p++) {
            payoutsum = payoutsum + bids[p].amount;
            uint bidValue = bids[p].bid;
            //Calculate absolute value (distance to stockValue)
            uint diffStock = (stockValue > bidValue) ? stockValue - bidValue : bidValue - stockValue;

            if(previous_diff>diffStock)
            {
                previous_diff = diffStock;
                winner = bids[p].account;
            }
        }

        emit Payout(winner, payoutsum);

        // 3. Interaction
        // Note that this is not visible on the blockchain, it is only executed through the contract itself
        // https://ethereum.stackexchange.com/questions/8315/confused-by-internal-transactions
        winner.transfer(payoutsum);
    }

    // Getter/Setter
    function getBidofAccount(address payable bider) public view returns(uint) {
        for (uint p = 0; p < bids.length; p++) {
            if (bids[p].account == bider){
                return bids[p].bid;
            }
        }
    }

   	function getBalance(address payable addr) public view returns(uint) {
		return addr.balance;
	}
}