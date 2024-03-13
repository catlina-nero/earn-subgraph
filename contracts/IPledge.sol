// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPledge {
    struct UserPledgeType {
        address stakedAddress;
        uint pledgeType;
        uint256 pledgeAmount;
    }
    struct FrozenBalance {
        uint256 amount;
        uint256 releaseTime;
    }
    // 质押事件
    event Staked(
        bytes32 indexed pledgeId,
        address indexed user,
        uint amount,
        uint pledgeType
    );

    // unstake事件
    event Unstaked(
        bytes32 indexed pledgeId,
        address indexed user,
        uint amount,
        uint pledgeType
    );

    // 质押完成退回事件
    event StakedBack(
        bytes32 indexed pledgeId,
        address indexed user,
        uint amount,
        uint pledgeType
    );

    // userWithdraw事件
    event UserWithdraw(address indexed user, uint amount);

    // deposit事件
    event Deposit(address indexed user, uint amount);

    // userAddInterest事件
    event UserAddInterest(address indexed user, uint amount);

    function deposit() external payable;

    function stake(uint pledgeType, uint256 amount) external;

    function unstake(bytes32 pledgeId) external;

    function userWithdraw() external;

    function userWithdrawUnFrozen() external;

    function getUserUnFrozen(address addr) external view returns (uint256, uint256);

    function addInterst(address[] memory addr, uint256[] memory amount) external payable;

    function backStakedToAvailableBalance(bytes32 pledgeId, uint256 interest) external payable;

    function updateGov(address gov, bool isGov) external;

    function withdraw() external;

    function updateFrozenTime(uint256 time) external;
}