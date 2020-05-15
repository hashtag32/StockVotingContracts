pragma solidity 0.5.16;

// This contract is unique per stock
contract KnockOut {
    // Contract specifics //
    // Admin of the contract -> StockVoting (Oracle data from stock market)
    address payable public chairperson;
    // Owner of the pot and creator of the contract
    address payable public contractCreator;
    // Sum of ether available in this contract
    // Note: This is the most money you can obtain when you win
    uint public pot;
    // By default initialized to `false`.
    // Set to true at the end, disallows any change.
    bool ended;

    // Investment specifics //
    uint public knock_out_threshold;
    // Time how long the bids are allowed
    uint public leverage;
    // If true the certificate is 'Put'. If false the certificate is 'Call'.
    bool isPut;
    // Time how long the contract is active
    uint public runEndTime;

    // Runtime data //
    struct ShareHolder {
        address payable account;
        uint amount;
        uint buying_closing_price;
    }

    // List of active ShareHolder
    ShareHolder[] public activeShareHolder;

    // Allowed withdrawals of previous bids
    mapping(address => uint)pendingReturns;

    // Will be updated every day
    uint public last_closing_price;

    // Please notice these events
    // New share bought also means that you have to share the pot in case the
    event ShareBought(address payable shareHolderAddress, uint amount);
    event ShareSold(address payable shareHolderAddress, uint amount);
    // The chairperson can only retract when no Users are active anymore
    // The contract is dissolved
    event ContractEnded();

    // param: _chairperson - The oracle/admin of this contract, a trusted party that obtains higher authority
    // param: _knock_out_threshold - Under/Over this threshold of the underlying, the shareholder
    // param: _leverage,
    // param: _runTime -
    // param: _isPut - Determines whether the certificate type is Put or Call
    constructor(address payable _chairperson, uint _knock_out_threshold, uint _leverage, uint _runTime, bool _isPut)
    public payable{
        chairperson = _chairperson;
        knock_out_threshold = _knock_out_threshold;
        leverage = _leverage;
        runEndTime = now + _runTime;
        pot = msg.value;
        isPut = _isPut;
        contractCreator = msg.sender;
    }

    // / Buy a share of this contract
    function buyShare()public payable {
        require(!ended, "Contract has already ended");
        require(now <= runEndTime, "Contract is over the runtime");

        activeShareHolder.push(ShareHolder({account: msg.sender, amount: msg.value, buying_closing_price: last_closing_price}));

        emit ShareBought(msg.sender, msg.value);

        return;
    }

    // Sell all shares of your this contract
    //todo: Sell only a number (difficult with gas, etc.)
    function sellShare() public payable {
        require(!ended, "Contract has already ended");
        require(now <= runEndTime, "Contract is over the runtime");

        for (uint p = 0; p < activeShareHolder.length; p ++) {
            if (activeShareHolder[p].account == msg.sender) {
                uint stock_price_diff = (last_closing_price - activeShareHolder[p].buying_closing_price) / activeShareHolder[p].buying_closing_price;
                uint pendingReturn = activeShareHolder[p].amount * stock_price_diff * leverage;

                pendingReturns[activeShareHolder[p].account] = pendingReturn;

                delete activeShareHolder[p];
            }
        }

        emit ShareSold(msg.sender, msg.value);

        return;
    }

    // The contract creator can decide to dissolve the contract, the pot goes back to him
    function retractContract() public {
        require(msg.sender == contractCreator || msg.sender == chairperson, "Not the rights to perform this action");
        // Only possible if no activeShareHolder are encountered
        require(activeShareHolder.length == 0, "We have active shareHolders");

        for (uint p = 0; p < activeShareHolder.length; p ++) {
            delete activeShareHolder[p];
        }

        pendingReturns[contractCreator] = pot;
        endContract();
        return;
    }

    // Due Date is over - contract should be ended by contractCreator. So that he can obtain his left pot
    // If he doesn't do it -> chairperson can end it (for the shareholder)
    function endContract() public {
        require(msg.sender == contractCreator || msg.sender == chairperson, "Not the rights to perform this action");

        emit ContractEnded();
        ended = true;
        return;
    }

    // / Withdraw a bid that was overbid
    function withdraw() public returns(bool) {
        uint amount = pendingReturns[msg.sender];

        if (amount > 0) {
            // It is important to set this to zero because the recipient
            // can call this function again as part of the receiving call
            // before `send` returns.
            pendingReturns[msg.sender] = 0;

            if (!msg.sender.send(amount)) { // No need to call throw here, just reset the amount owing
                pendingReturns[msg.sender] = amount;
                return false;
            }
        }

        return true;
    }

    // / Daily update by server -> Oracle (gives the minimum_daily and closing_price)
    function daily_update(uint minimum_daily, uint _closing_price)external payable {
        require(msg.sender == chairperson, "Not the rights to set the daily_minimum");
        require(!ended, "Contract has already ended");

        last_closing_price = _closing_price;

        if (minimum_daily < knock_out_threshold) {
            knockOut();
        }

        return;
    }

    // Stock price is under the threshold -> contract is dissolved, contractCreator takes all the money
    // ShareHolder doesn't receive any money
    function knockOut() public {
        uint payoutsum = 0;
        for (uint p = 0; p < activeShareHolder.length; p ++) {
            payoutsum += activeShareHolder[p].amount;
            // todo:Check if works
            delete activeShareHolder[p];
        }
        pendingReturns[contractCreator] = payoutsum + pot;

        endContract();
        return;
    }

    // Calculate the return of the shareHolder
    // Based on the previous day stock price
    // function CalcAndUpdatePendingReturn(ShareHolder memory shareHolder) public {
    //     uint stock_price_diff = (last_closing_price - shareHolder.buying_closing_price) / shareHolder.buying_closing_price;
    //     uint pendingReturn = shareHolder.amount * stock_price_diff * leverage;

    //     pendingReturns[shareHolder.account] = pendingReturn;
    //     return;
    // }

    // Getter/Setter
    function setrunEndTime(uint _newrunEndTime)public {
        require(msg.sender == chairperson, "Not the rights to change this value");
        runEndTime = _newrunEndTime;
    }
}
