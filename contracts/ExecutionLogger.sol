// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ExecutionLogger
 * @dev Logs pipeline executions on-chain for transparency
 */
contract ExecutionLogger {
    struct Execution {
        uint256 id;
        address user;
        bytes32 pipelineId;
        uint256[] appletIds;
        uint256 totalPrice;
        bytes32 resultHash;
        uint256 timestamp;
    }

    mapping(uint256 => Execution) public executions;
    mapping(address => uint256[]) public userExecutions;
    uint256 public executionCount;

    event ExecutionLogged(
        uint256 indexed id,
        address indexed user,
        bytes32 indexed pipelineId,
        uint256[] appletIds,
        uint256 totalPrice,
        bytes32 resultHash,
        uint256 timestamp
    );

    /**
     * @dev Log a new execution
     */
    function logExecution(
        bytes32 _pipelineId,
        uint256[] memory _appletIds,
        uint256 _totalPrice,
        bytes32 _resultHash
    ) external returns (uint256) {
        require(_appletIds.length > 0, "Pipeline must have at least one applet");
        
        executionCount++;
        
        executions[executionCount] = Execution({
            id: executionCount,
            user: msg.sender,
            pipelineId: _pipelineId,
            appletIds: _appletIds,
            totalPrice: _totalPrice,
            resultHash: _resultHash,
            timestamp: block.timestamp
        });

        userExecutions[msg.sender].push(executionCount);

        emit ExecutionLogged(
            executionCount,
            msg.sender,
            _pipelineId,
            _appletIds,
            _totalPrice,
            _resultHash,
            block.timestamp
        );

        return executionCount;
    }

    /**
     * @dev Get all executions by a user
     */
    function getExecutionsByUser(address _user) external view returns (Execution[] memory) {
        uint256[] memory userExecIds = userExecutions[_user];
        Execution[] memory userExecs = new Execution[](userExecIds.length);

        for (uint256 i = 0; i < userExecIds.length; i++) {
            userExecs[i] = executions[userExecIds[i]];
        }

        return userExecs;
    }

    /**
     * @dev Get execution by ID
     */
    function getExecutionById(uint256 _id) external view returns (Execution memory) {
        require(_id > 0 && _id <= executionCount, "Execution does not exist");
        return executions[_id];
    }

    /**
     * @dev Get total executions count for a user
     */
    function getUserExecutionCount(address _user) external view returns (uint256) {
        return userExecutions[_user].length;
    }
}
