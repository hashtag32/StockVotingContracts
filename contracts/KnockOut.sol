pragma solidity 0.5 .16;

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
    bool public ended;

    // Investment specifics //
    uint public knock_out_threshold;
    // Time how long the bids are allowed
    uint public leverage;
    // If true the certificate is 'Put'. If false the certificate is 'Call'.
    bool public isPut;
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
    mapping(address => uint)public pendingReturns;

    // Will be updated every day
    uint public last_closing_price;

    // Please notice these events
    // New share bought also means that you have to share the pot in case the
    event ShareBought_ev(address payable shareHolderAddress, uint amount);
    event ShareSold_ev(address payable shareHolderAddress, uint amount);
    // The chairperson can only retract when no Users are active anymore
    // The contract is dissolved
    event KnockOut_ev(uint stockValue);
    event ContractEnded_ev(address terminatorAddress);

    // param: _chairperson - The oracle/admin of this contract, a trusted party that obtains higher authority
    // param: _knock_out_threshold - Under/Over this threshold of the underlying, the shareholder
    // param: _leverage - Leverage for the whole certificate
    // param: _runTime - After this runtime, the contract ends
    // param: _isPut - Determines whether the certificate type is Put or Call
    constructor(address payable _chairperson, uint _knock_out_threshold, uint _leverage, uint _startPrice, uint _runTime, bool _isPut)
    public payable {
        chairperson = _chairperson;
        knock_out_threshold = _knock_out_threshold;
        leverage = _leverage;
        runEndTime = now + _runTime;
        last_closing_price = _startPrice;
        pot = msg.value;
        isPut = _isPut;
        contractCreator = msg.sender;
    }

    // / Buy a share of this contract
    function buyShare()public payable {
        require(!ended, "Contract has already ended");
        require(now <= runEndTime, "Contract is over the runtime");

        activeShareHolder.push(ShareHolder({account: msg.sender, amount: msg.value, buying_closing_price: last_closing_price}));

        emit ShareBought_ev(msg.sender, msg.value);

        return;
    }

    // Sell all shares of your this contract
    // todo: Sell only a number (difficult with gas, etc.)
    function sellShare()public payable {
        require(!ended, "Contract has already ended");
        require(now <= runEndTime, "Contract is over the runtime");

        for (uint p = 0; p < activeShareHolder.length; p ++) {
            if (activeShareHolder[p].account == msg.sender) {
                int buying_closing_price_int = int(activeShareHolder[p].buying_closing_price);
                int stock_price_diff_10000 = int(10000 * (int(last_closing_price) - buying_closing_price_int) / buying_closing_price_int);

                pendingReturns[activeShareHolder[p].account] = calcPendingReturn(stock_price_diff_10000, activeShareHolder[p].amount);

                delete activeShareHolder[p];
                activeShareHolder.length --;
            }
        }

        emit ShareSold_ev(msg.sender, pendingReturns[msg.sender]);

        return;
    }

    function calcPendingReturn(int stock_price_diff_10000, uint amount)private returns(uint) {
        uint pendingReturn;

        // Switch sign when turn
        if (isPut) {
            stock_price_diff_10000 *= -1;
        }

        // Positive or negative -> different cases
        int amount_diff = int(amount) * stock_price_diff_10000 * int(leverage) / 10000;

        if (amount_diff > 0) {
            // Positive performance
            // This is a positive value in positive notation
            uint amount_diff_uint_pos = uint(amount_diff);

            // Money is shifted from pot to stakeholder
            pendingReturn = amount + amount_diff_uint_pos;
            pot = pot - amount_diff_uint_pos;
        } else { // This is a negative value in positive notation
            uint amount_diff_uint_neg = uint(amount_diff * -1);

            if (amount_diff_uint_neg < amount) {
                // Negative performance
                // Money is shifted from amount (stakeHolder) to the pot
                pendingReturn = amount - amount_diff_uint_neg;
                pot = pot + amount_diff_uint_neg;
            } else { // Total loss
                pendingReturn = 0;
                pot = pot + amount;
            }
        }

        return pendingReturn;
    }

    // The contract creator can decide to dissolve the contract, the pot goes back to him
    function retractContract()public {
        require(msg.sender == contractCreator || msg.sender == chairperson, "Not the rights to perform this action");
        // Only possible if no activeShareHolder are encountered
        require(activeShareHolder.length == 0, "We have active shareHolders");

        pendingReturns[contractCreator] = pot;
        pot = 0;
        endContract();
        return;
    }

    // Due Date is over - contract should be ended by contractCreator. So that he can obtain his left pot
    // If he doesn't do it -> chairperson can end it (for the shareholder)
    function endContract()public {
        require(msg.sender == contractCreator || msg.sender == chairperson, "Not the rights to perform this action");

        emit ContractEnded_ev(msg.sender);
        ended = true;
        return;
    }

    // / Withdraw a bid that was overbid
    function withdraw()public returns(bool) {
        uint amount = pendingReturns[msg.sender];

        if (amount > 0) {
            pendingReturns[msg.sender] = 0;
            msg.sender.transfer(amount);
        }

        return true;
    }

    // / Daily update by server -> Oracle (gives the minimum_daily and closing_price)
    function update(uint _minimum, uint _closing_price)external payable {
        require(msg.sender == chairperson, "Not the rights to perform this action");
        require(_minimum <= _closing_price, "Input is wrong");
        require(!ended, "Contract has already ended");

        last_closing_price = _closing_price;

        if (isPut) {
            if (_minimum > knock_out_threshold) {
                knockOut(_minimum);
            }
        } else {
            if (_minimum < knock_out_threshold) {
                knockOut(_minimum);
            }
        }

        return;
    }

    // Stock price is under the threshold -> contract is dissolved, contractCreator takes all the money
    // ShareHolder doesn't receive any money
    function knockOut(uint stockValue)private {
        require(msg.sender == chairperson, "Not the rights to perform this action");

        uint payoutsum = 0;
        for (uint p = 0; p < activeShareHolder.length; p ++) {
            payoutsum += activeShareHolder[p].amount;
            // todo:Check if works
            delete activeShareHolder[p];
            activeShareHolder.length --;
        }
        pendingReturns[contractCreator] = payoutsum + pot;
        pot = 0;

        emit KnockOut_ev(stockValue);
        endContract();
        return;
    }

    // Getter/Setter
    function setrunEndTime(uint _newrunEndTime)public {
        require(msg.sender == chairperson, "Not the rights to change this value");
        runEndTime = _newrunEndTime;
    }
}
