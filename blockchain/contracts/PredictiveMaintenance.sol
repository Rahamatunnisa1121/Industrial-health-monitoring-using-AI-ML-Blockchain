// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract PredictiveMaintenance {
    struct Record {
        string machineId;
        uint8 condition;
        string recommendation;
        uint256 timestamp;
    }

    Record[] public records;
    event RecordAdded(uint indexed index, string machineId, uint8 condition, string recommendation, uint256 timestamp);

    function addRecord(string memory _machineId, uint8 _condition, string memory _recommendation) public {
        uint256 ts = block.timestamp;
        records.push(Record(_machineId, _condition, _recommendation, ts));
        emit RecordAdded(records.length - 1, _machineId, _condition, _recommendation, ts);
    }

    function getRecord(uint index) public view returns (string memory, uint8, string memory, uint256) {
        require(index < records.length, "Out of bounds");
        Record storage r = records[index];
        return (r.machineId, r.condition, r.recommendation, r.timestamp);
    }

    function getTotalRecords() public view returns (uint) {
        return records.length;
    }
}
