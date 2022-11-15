// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

library StringLibrary{
    
    function equals (string memory cadena1, string memory cadena2) public pure returns (bool){
        bytes32 hashCadena1 = keccak256(abi.encode (cadena1));
        bytes32 hashCadena2 = keccak256(abi.encode (cadena2));
        return hashCadena1==hashCadena2;
    }
}