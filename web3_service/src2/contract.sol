// MyContract.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MyContract {
    uint256 public totalAmount = 10000000000000;
    
    mapping (address => uint256) public balance;
    mapping (address => mapping(address => uint256)) private allowance_;

    event Allowance(address owner, address spender, uint256 _value);
    event Transfer(address from, address to, uint256 _value);
    event Deployed(address deployer);

    constructor() { emit Deployed(msg.sender); }

    function getFromAllowance(address owner, uint256 _value) public{
        
        require(allowance_[owner][msg.sender] >= );
        allowance_[owner][msg.sender] -= _value;
        balance[owner] -= _value;
        balance[msg.sender] += _value;
    }

    function giveAllowance(address spender, uint256 _value) public {
        require(balance[msg.sender] >= _value);
        allowance_[msg.sender][spender] += _value;

        emit Allowance(msg.sender, spender, _value);
    }

    function transfer(address to, uint256 _value) public{
        require(balance[msg.sender] >= _value);
        balance[msg.sender] -= _value;
        balance[to] += _value;
        
        emit Transfer(msg.sender, to, _value);
    }
}
