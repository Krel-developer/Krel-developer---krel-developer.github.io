// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract KrelFunding  {

    uint internal projectsLength = 0;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    struct Project {
        address payable owner;
        string name;
        string img;
        string description;
        uint goal;
        uint current;
        bool isWithdraw;
    }

    mapping (uint => Project) internal projects;

    function createProject (
        string memory _name,
        string memory _img,
        string memory _description, 
        uint _goal
    ) public {
        bool _isWithdraw = false;
        uint _current = 0;
        projects[projectsLength] = Project(
            payable(msg.sender),
            _name,
            _img,
            _description,
            _goal,
            _current,
            _isWithdraw
        );
        projectsLength++;
    }

    function readProject(uint _index) public view returns (
        address payable,
        string memory, 
        string memory, 
        string memory, 
        uint, 
        uint,
        bool
    ) {
        return (
            projects[_index].owner,
            projects[_index].name, 
            projects[_index].img, 
            projects[_index].description, 
            projects[_index].goal, 
            projects[_index].current,
            projects[_index].isWithdraw
        );
    }

    function donateForProject(uint _index, uint _amount) public payable  {
        require(msg.sender != projects[_index].owner, "You cannot donate to your own project");
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender, 
                address(this), 
                _amount
            ),
          "Transfer failed."
        );
        projects[_index].current = projects[_index].current + _amount;
 
    }
    function withdraw (uint _index) public payable  {
        require(msg.sender ==projects[_index].owner,  "Only owner can wihdraw.");
        require(projects[_index].current >= projects[_index].goal,  "You cannot withdraw until the goal is reached.");
        require(projects[_index].isWithdraw == false,  "You already withdraw.");
        require(
            IERC20Token(cUsdTokenAddress).transfer(
                projects[_index].owner, 
                projects[_index].current
            ),
          "Transfer failed."
        );
        projects[_index].isWithdraw = true;

    }
    function getProjectsLength() public view returns (uint) {
        return (projectsLength);
    }

    receive() external payable {
       
    }
}
