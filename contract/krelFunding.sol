// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
    function transfer(address, uint256) external returns (bool);

    function approve(address, uint256) external returns (bool);

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address) external view returns (uint256);

    function allowance(address, address) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract KrelFunding {
    uint256 private projectsLength = 0;
    address private cUsdTokenAddress =
        0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    struct Project {
        address payable owner;
        string name;
        string img;
        string description;
        uint256 goal;
        uint256 collected;
        bool isWithdraw;
        uint256 endAt;
    }

    mapping(uint256 => Project) private projects;

    mapping(uint256 => mapping(address => uint256)) private donations;

    // checks if the time to donate for project is over
    modifier over(uint256 _index) {
        require(
            projects[_index].endAt < block.timestamp,
            "Funding isn't over yet"
        );
        _;
    }

    /**
     * @dev allow users to create a project and receive funding
     * @notice input data needs to contain only non-empty/valid values
     */
    function createProject(
        string calldata _name,
        string calldata _img,
        string calldata _description,
        uint256 _goal
    ) public {
        require(bytes(_name).length > 0, "Empty name");
        require(bytes(_img).length > 0, "Empty image");
        require(bytes(_description).length > 0, "Empty description");
        bool _isWithdraw = false;
        uint256 _collected = 0;
        projects[projectsLength] = Project(
            payable(msg.sender),
            _name,
            _img,
            _description,
            _goal,
            _collected,
            _isWithdraw,
            block.timestamp + 5 minutes // for testing purposes 5 minutes is the minimum set for endAt
        );
        projectsLength++;
    }

    function readProject(uint256 _index) public view returns (Project memory) {
        return (projects[_index]);
    }

    /**
     * @dev allow users to donate to a project
     * @notice _amount donated needs to be at least one CUSD
     */
    function donateForProject(uint256 _index, uint256 _amount) public payable {
        require(_amount >= 1 ether, "You need to donate at least one CUSD");
        Project storage currentProject = projects[_index];
        require(currentProject.endAt > block.timestamp,"Funding is over");
        require(
            msg.sender != currentProject.owner,
            "You cannot donate to your own project"
        );
        uint256 newAmount = currentProject.collected + _amount;
        uint256 newDonationAmount = donations[_index][msg.sender] + _amount;
        donations[_index][msg.sender] = newDonationAmount;
        currentProject.collected = newAmount;
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                address(this),
                _amount
            ),
            "Transfer failed."
        );
    }

    /**
     * @dev allow projects owners to withdraw the amount collected if the funding was a success
     */
    function withdraw(uint256 _index) public payable over(_index) {
        Project storage currentProject = projects[_index];
        require(msg.sender == currentProject.owner, "Only owner can wihdraw.");
        require(
            currentProject.collected >= currentProject.goal,
            "You cannot withdraw until the goal is reached."
        );
        require(currentProject.isWithdraw == false, "You already withdraw.");
        currentProject.isWithdraw = true;
        require(
            IERC20Token(cUsdTokenAddress).transfer(
                currentProject.owner,
                currentProject.collected
            ),
            "Transfer failed."
        );
    }

    /**
     * @dev allow users to withdraw their donation in case the funding of a project was not successful
     */
    function withdrawDonation(uint256 _index) public over(_index) {
        Project storage currentProject = projects[_index];
        require(
            currentProject.collected < currentProject.goal,
            "Funding was a success"
        );
        require(
            donations[_index][msg.sender] > 0,
            "You have no balance to withdraw"
        );
        uint256 withdrawalAmount = donations[_index][msg.sender];
        donations[_index][msg.sender] = 0;
        require(
            IERC20Token(cUsdTokenAddress).transfer(
                msg.sender,
                withdrawalAmount
            ),
            "Transfer failed."
        );
    }

    function getProjectsLength() public view returns (uint256) {
        return (projectsLength);
    }

    receive() external payable {}
}
