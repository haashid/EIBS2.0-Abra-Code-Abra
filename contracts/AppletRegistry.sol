// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AppletRegistry
 * @dev Registry for storing applet metadata on-chain
 */
contract AppletRegistry {
    struct Applet {
        uint256 id;
        string name;
        string description;
        uint256 price;
        address owner;
        bytes32 inputSchemaHash;
        bytes32 outputSchemaHash;
        bool isActive;
    }

    mapping(uint256 => Applet) public applets;
    uint256 public appletCount;

    event AppletRegistered(
        uint256 indexed id,
        string name,
        address indexed owner,
        uint256 price
    );

    event AppletUpdated(uint256 indexed id, bool isActive);

    /**
     * @dev Register a new applet
     */
    function registerApplet(
        string memory _name,
        string memory _description,
        uint256 _price,
        bytes32 _inputSchemaHash,
        bytes32 _outputSchemaHash
    ) external returns (uint256) {
        appletCount++;
        
        applets[appletCount] = Applet({
            id: appletCount,
            name: _name,
            description: _description,
            price: _price,
            owner: msg.sender,
            inputSchemaHash: _inputSchemaHash,
            outputSchemaHash: _outputSchemaHash,
            isActive: true
        });

        emit AppletRegistered(appletCount, _name, msg.sender, _price);
        return appletCount;
    }

    /**
     * @dev Get all active applets
     */
    function getApplets() external view returns (Applet[] memory) {
        uint256 activeCount = 0;
        
        // Count active applets
        for (uint256 i = 1; i <= appletCount; i++) {
            if (applets[i].isActive) {
                activeCount++;
            }
        }

        Applet[] memory activeApplets = new Applet[](activeCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= appletCount; i++) {
            if (applets[i].isActive) {
                activeApplets[index] = applets[i];
                index++;
            }
        }

        return activeApplets;
    }

    /**
     * @dev Get applet by ID
     */
    function getAppletById(uint256 _id) external view returns (Applet memory) {
        require(_id > 0 && _id <= appletCount, "Applet does not exist");
        return applets[_id];
    }

    /**
     * @dev Toggle applet active status (owner only)
     */
    function toggleAppletStatus(uint256 _id) external {
        require(_id > 0 && _id <= appletCount, "Applet does not exist");
        require(applets[_id].owner == msg.sender, "Not the owner");
        
        applets[_id].isActive = !applets[_id].isActive;
        emit AppletUpdated(_id, applets[_id].isActive);
    }
}
