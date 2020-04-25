pragma solidity 0.5.16;

//todo: StockBetting
contract BettingContract {
    // Parameters of the auction. Times are either
    // absolute unix timestamps (seconds since 1970-01-01)
    // or time periods in seconds.
    //todo: list of persons that can bid

     // This is a type for a single proposal.
    // todo: person? Bid-> Bider
    struct Bid {
        // bytes32 name;   // short name (up to 32 bytes)
        uint256 bid; // number of accumulated votes
        address payable account;
    }

    Bid[] public bids;
    // mapping(address => Bid) public bids;

    // address payable public person_a;
    // address payable public person_b;
    uint public bidEndTime;

    //todo: publish address of winner (after contract ended)
    // Current state of the auction.
    // address public highestBidder;
    // uint public highestBid;

    //tocheck: Not allowed
    // Allowed withdrawals of previous bids
    // mapping(address => uint) pendingReturns;

    // Set to true at the end, disallows any change.
    // By default initialized to `false`.
    bool ended;

    // Events that will be emitted on changes.
    // event HighestBidIncreased(address bidder, uint amount);
    event Payout(address payable winner, uint256 payout);

    // The following is a so-called natspec comment,
    // recognizable by the three slashes.
    // It will be shown when the user is asked to
    // confirm a transaction.

    /// Create a simple auction with `_biddingTime`
    /// seconds bidding time on behalf of the
    /// beneficiary address `_beneficiary`.
    // constructor(
    //     uint _biddingTime
    //     // address payable _beneficiary
    // ) public {
    //     // beneficiary = _beneficiary;
    //     bidEndTime = now + _biddingTime;
    // }

    /// Bid on the auction with the value sent
    /// together with this transaction.
    /// The value will only be refunded if the
    /// auction is not won.
    function bid(uint256 bidValue) public payable {
        // No arguments are necessary, all
        // information is already part of
        // the transaction. The keyword payable
        // is required for the function to
        // be able to receive Ether.

        // Revert the call if the bidding
        // period is over.
        // require(
        //     now <= bidEndTime,
        //     "Auction already ended."
        // );

        // If the bid is not higher, send the
        // money back (the failing require
        // will revert all changes in this
        // function execution including
        // it having received the money).
        // require(
        //     msg.value > highestBid,
        //     "There already is a higher bid."
        // );

        bids.push(Bid({
            account: msg.sender,
            bid: bidValue
        }));

        //tocheck: Need to send money back to loser?

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

    /// Withdraw a bid that was overbid.
    // function withdraw() public returns (bool) {
    //     uint amount = pendingReturns[msg.sender];
    //     if (amount > 0) {
    //         // It is important to set this to zero because the recipient
    //         // can call this function again as part of the receiving call
    //         // before `send` returns.
    //         pendingReturns[msg.sender] = 0;

    //         if (!msg.sender.send(amount)) {
    //             // No need to call throw here, just reset the amount owing
    //             pendingReturns[msg.sender] = amount;
    //             return false;
    //         }
    //     }
    //     return true;
    // }

    /// End the auction and send the highest bid
    /// to the beneficiary.
    // This function is called by executionContract, that is owned by StockVoting
    //  function bet(uint8 number) external payable {
    function bettingEnd(uint256  stockValue) external payable {
        // It is a good guideline to structure functions that interact
        // with other contracts (i.e. they call functions or send Ether)
        // into three phases:
        // 1. checking conditions
        // 2. performing actions (potentially changing conditions)
        // 3. interacting with other contracts
        // If these phases are mixed up, the other contract could call
        // back into the current contract and modify the state or cause
        // effects (ether payout) to be performed multiple times.
        // If functions called internally include interaction with external
        // contracts, they also have to be considered interaction with
        // external contracts.

        // 1. Conditions
        //todo: find closest bid
        // while (voters[to].delegate != address(0)) {
        //     to = voters[to].delegate;

        //     // We found a loop in the delegation, not allowed.
        //     require(to != msg.sender, "Found loop in delegation.");
        // }

        //todo: Check if the msg.sender is the executioncontract

        //todo: check time

        // require(now >= bidEndTime, "Auction not yet ended.");
        // require(!ended, "auctionEnd has already been called.");

        // 2. Effects
        ended = true;
        // value needs to be transfered to the 
        // actualValue=msg.value;

        // todo: change to payout
        emit Payout(msg.sender, stockValue);

        // 3. Interaction
        // beneficiary.transfer(highestBid);
    }

    // Getter/Setter
    function getBidofAccount(address bider) public view returns(uint256) {
        for (uint p = 0; p < bids.length; p++) {
            if (bids[p].account ==  bider) {
                return bids[p].bid;
            }
        }
    }
}