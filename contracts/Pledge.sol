// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./IPledge.sol";

contract Pledge is IPledge, Initializable, OwnableUpgradeable  {
    // 用于存储每个用户质押的金额
    mapping(address => uint) public pledges;

    mapping(bytes32 => UserPledgeType) public pledgeTypeStaked;

    mapping(bytes32 => address) public userPledge;

    // 充值进来的金额
    mapping(address => uint256) public availableBalance;

    mapping(address => bool) public govs;

    mapping(address => uint256) public userInterest;

    // 冻结金额
    mapping(bytes32 => FrozenBalance) public frozenBalance;
    // 冻结记录对应账户
    mapping(bytes32 => address) public frozenBalanceUser;
    // 用户冻结金额数组
    mapping(address => bytes32[]) userFrozenArray;
    // 冻结时间
    uint256 public frozenTime;

    modifier onlyGov() {
        require(govs[msg.sender], "Only gov can call this function.");
        _;
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        frozenTime = 7 days;
    }

    // deposit进来增加availbaleBalance
    function deposit() public payable override {
        require(msg.value > 0, "Must deposit a positive amount");
        // 不能小于100ether
        require(msg.value >= 100 ether, "Must deposit at least 100 ether");
        availableBalance[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    // 质押方法
    function stake(uint pledgeType, uint256 amount) public override {
        require(amount > 0, "Must pledge a positive amount");
        require(
            pledgeType == 3 || pledgeType == 6 || pledgeType == 12,
            "Pledge type must be one of 3, 6, 12"
        );
        // 金额不能大于可用余额
        require(
            amount <= availableBalance[msg.sender],
            "Pledge amount must be less than available balance"
        );

        // 更新用户的质押金额
        pledges[msg.sender] += amount;

        // 用keccak256生成一个bytes32类型的数据作为质押id
        bytes32 pledgeId = keccak256(
            abi.encodePacked(msg.sender, pledgeType, block.timestamp)
        );
        UserPledgeType memory currentType = UserPledgeType(
            msg.sender,
            pledgeType,
            amount
        );
        userPledge[pledgeId] = msg.sender;
        pledgeTypeStaked[pledgeId] = currentType;

        // 更新用户的可用余额
        availableBalance[msg.sender] -= amount;

        emit Staked(pledgeId, msg.sender, amount, pledgeType);
    }

    // 用户解质押
    function unstake(bytes32 pledgeId) public override {
        require(
            userPledge[pledgeId] == msg.sender,
            "Only the user can unstake"
        );
        UserPledgeType memory currentType = pledgeTypeStaked[pledgeId];
        require(
            currentType.stakedAddress == msg.sender,
            "Only the user can unstake"
        );
        require(
            currentType.pledgeAmount > 0,
            "Pledge amount must be greater than 0"
        );

        // 更新用户的质押金额
        pledges[msg.sender] -= currentType.pledgeAmount;

        // 更新用户的可用余额
        availableBalance[msg.sender] += currentType.pledgeAmount;

        // 删除质押记录
        delete pledgeTypeStaked[pledgeId];
        delete userPledge[pledgeId];

        emit Unstaked(
            pledgeId,
            msg.sender,
            currentType.pledgeAmount,
            currentType.pledgeType
        );
    }

    // 用户提取可用余额 冻结本金和利息
    function userWithdraw() public override {
        require(availableBalance[msg.sender] > 0, "No available balance");
        // 获取可用余额
        uint256 amount = availableBalance[msg.sender];

        // 获取利息
        uint256 interest = userInterest[msg.sender];

        // 更新用户的可用余额
        availableBalance[msg.sender] = 0;

        // 用keccak256生成一个bytes32类型的数据作为冻结id
        bytes32 frozenId = keccak256(abi.encodePacked(msg.sender, block.timestamp));
        // 冻结金额、解冻时间
        frozenBalance[frozenId] = FrozenBalance(amount, block.timestamp + frozenTime);
        // 冻结记录对应的账户
        frozenBalanceUser[frozenId] = msg.sender;
        // 用户冻结金额数组
        userFrozenArray[msg.sender].push(frozenId);

        emit UserWithdraw(msg.sender, amount);
    }

    // 用户提取解冻金额
    function userWithdrawUnFrozen() public override {
        require(userFrozenArray[msg.sender].length > 0, "No frozen amount");
        // 获取用户的冻结金额数组
        bytes32[] memory frozenArray = userFrozenArray[msg.sender];
        // 遍历冻结金额数组，从最后一个索引开始，如果当前时间大于等于解冻时间，则解冻金额，并删除冻结记录
        uint i = frozenArray.length;
        uint256 totalUnFrozen = 0;
        while (i > 0) {
            i--;
            bytes32 frozenId = frozenArray[i];
            FrozenBalance memory currentFrozen = frozenBalance[frozenId];
            if (block.timestamp >= currentFrozen.releaseTime) {
                totalUnFrozen += currentFrozen.amount;
                delete frozenBalance[frozenId];
                delete frozenBalanceUser[frozenId];
                delete userFrozenArray[msg.sender][i];
            }
        }
        payable(msg.sender).transfer(totalUnFrozen);
    }

    // 获取用户的解冻金额和冻结金额
    function getUserUnFrozen(address addr) public view override returns (uint256, uint256) {
        uint256 totalUnFrozen = 0;
        uint256 totalFrozen = 0;
        bytes32[] memory frozenArray = userFrozenArray[addr];
        for (uint i = 0; i < frozenArray.length; i++) {
            bytes32 frozenId = frozenArray[i];
            FrozenBalance memory currentFrozen = frozenBalance[frozenId];
            if (block.timestamp >= currentFrozen.releaseTime) {
                totalUnFrozen += currentFrozen.amount;
            } else {
                totalFrozen += currentFrozen.amount;
            }
        }
        return (totalUnFrozen, totalFrozen);
    }

    // 增加利息
    function addInterst(
        address[] memory addrs,
        uint256[] memory amounts
    ) public override payable onlyGov {
        require(
            addrs.length == amounts.length,
            "Address and amount arrays must be the same length"
        );
        for (uint i = 0; i < addrs.length; i++) {
            require(addrs[i] != address(0), "Address cannot be 0");
            require(amounts[i] > 0, "Amount must be greater than 0");
            availableBalance[addrs[i]] += amounts[i];
            userInterest[addrs[i]] += amounts[i];

            emit UserAddInterest(addrs[i], amounts[i]);
        }
    }

    // 将质押金额退回到可用余额，包含利息
    function backStakedToAvailableBalance(
        bytes32 pledgeId,
        uint256 interest
    ) public override onlyGov payable {
        UserPledgeType memory currentType = pledgeTypeStaked[pledgeId];
        require(currentType.stakedAddress != address(0), "Address cannot be 0");
        require(
            currentType.pledgeAmount > 0,
            "Pledge amount must be greater than 0"
        );

        // 更新用户的质押金额
        pledges[currentType.stakedAddress] -= currentType.pledgeAmount;

        // 更新用户的可用余额
        availableBalance[currentType.stakedAddress] += (currentType.pledgeAmount + interest);

        userInterest[currentType.stakedAddress] += interest;

        // 删除质押记录
        delete pledgeTypeStaked[pledgeId];
        delete userPledge[pledgeId];

        emit StakedBack(
            pledgeId,
            currentType.stakedAddress,
            currentType.pledgeAmount,
            currentType.pledgeType
        );
    }

    function updateGov(address gov, bool isGov) public override onlyOwner {
        govs[gov] = isGov;
    }

    function withdraw() public override onlyOwner {
        require(address(this).balance > 0, "No balance to withdraw");
        payable(msg.sender).transfer(address(this).balance);
    }

    function updateFrozenTime(uint256 time) public override onlyOwner {
        frozenTime = time;
    }

    receive() external payable {}
}