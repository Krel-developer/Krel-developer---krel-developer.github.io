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
        bool isEnded;
    }

    mapping (uint => Project) internal projects;

    modifier isEnded(uint _index){
        require(projects[_index].isEnded == false,  "campaign ended");
        _;
    }

    function createProject (
        string memory _name,
        string memory _img,
        string memory _description, 
        uint _goal
    ) public {
        projects[projectsLength] = Project(
            payable(msg.sender),
            _name,
            _img,
            _description,
            _goal,
            0,
            false
        );
        projectsLength++;
    }

    function donateForProject(uint _index, uint _amount) public payable  isEnded(_index){
        require(msg.sender != projects[_index].owner, "owner cannot donate");
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender, 
                address(this), 
                _amount
            ),
          "Transfer failed."
        );
        projects[_index].current += _amount;
 
    }

    function withdraw (uint _index) public payable  isEnded(_index){
        require(msg.sender ==projects[_index].owner,  "Only owner can withdraw.");
        require(projects[_index].current >= projects[_index].goal,  "goal not reached");

        projects[_index].isEnded = true;

        require(
            IERC20Token(cUsdTokenAddress).transfer(
                projects[_index].owner, 
                projects[_index].current
            ),
          "Transfer failed."
        );
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
            projects[_index].isEnded
        );
    }

    function getProjectsLength() public view returns (uint) {
        return (projectsLength);
    }

    receive() external payable {
       
    }
}
