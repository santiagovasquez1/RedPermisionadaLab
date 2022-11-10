$workDir = Get-Location;
$networkNodes = "networkNodes";
$numNodes = $args[0];
$nodePrefix = $args[1];
$p2pDefault = [int]$args[2];
$rpcDefault = [int]$args[3];
$gateWay = $args[4];
$nodesOfNetwork = @();
$enodes = @();

docker compose down

if ($null -eq $numNodes) {
    $numNodes = 4;
}

if ($null -eq $nodePrefix) {
    $nodePrefix = "Node";
}

if (0 -eq $p2pDefault) {
    $p2pDefault = 30000;
}

if (0 -eq $rpcDefault) {
    $rpcDefault = 8540;
}

if ($null -eq $gateWay) {
    $gateWay = "172.21.0.1"
}

for ($i = 0; $i -lt $numNodes; $i++) {
    $nodeName = $nodePrefix + ($i + 1);

    if (Test-Path -Path $workDir/$networkNodes/$nodeName) {
        Remove-Item $workDir/$networkNodes/$nodeName -Recurse -Force
    }

    mkdir $workDir/$networkNodes/$nodeName;
    mkdir $workDir/$networkNodes/$nodeName/data
    
    Copy-Item $workDir/permissions_config.toml $workDir/$networkNodes/$nodeName/data
    Copy-Item $workDir/config.toml $workDir/$networkNodes/$nodeName
    
    $p2pNumber = $p2pDefault + $i;
    $rcpNumber = $rpcDefault + $i;
    $p2pPort = "p2p-port=" + $p2pNumber;
    $rpchttpport = "rpc-http-port=" + $rcpNumber;
    $configContent = Get-Content -Path $workDir/$networkNodes/$nodeName/config.toml
    $configContent -replace "p2p-port=P2PDEFAULT", $p2pPort | Set-Content -Path $workDir/$networkNodes/$nodeName/config.toml ;

    $configContent = Get-Content -Path $workDir/$networkNodes/$nodeName/config.toml
    $configContent -replace "rpc-http-port=RCPDEFAULT", $rpchttpport | Set-Content -Path $workDir/$networkNodes/$nodeName/config.toml ;

    $message = "Nodo " + $nodeName + " creado con exito"
    Write-Output  $message;
    $nodesOfNetwork += $nodeName;
}

$networkFiles = "./networkfiles";

if (Test-Path -Path $networkFiles) {
    Remove-Item  $networkFiles -Recurse -Force
}

besu operator generate-blockchain-config --config-file=./initialGenesis.json --to=networkFiles --private-key-file-name=key

$keysDirs = Get-ChildItem $networkFiles/keys;
$Counter = 0;

foreach ($keyDir in $keysDirs) {
    $nodePath = $nodesOfNetwork[$Counter]
    Copy-Item $networkFiles/keys/$keyDir/key ./$networkNodes/$nodePath/data
    Copy-Item $networkFiles/keys/$keyDir/key.pub ./$networkNodes/$nodePath/data
    Copy-Item $networkFiles/genesis.json ./$networkNodes/$nodePath
    $p2pNumber = $p2pDefault + $Counter;
    $nodeIp = $gateWay -replace "0.1", ("0." + ($Counter + 2));
    $enodes += "enode://" + (Get-Content ./$networkNodes/$nodePath/data/key.pub).Substring(2) + "@" + $nodeIp + ":" + $p2pNumber;
    Write-Output $enodes[$Counter];
    $Counter++;
}

docker compose up -d

$enodesList = New-Object Collections.Generic.List[Collections.Generic.List[String]]
$enodesList.Add($enodes);
$params = @{
    "jsonrpc" = "2.0";
    "method"  = "perm_addNodesToAllowlist";
    "params"  = $enodesList;
    "id"      = 1;
};

# Add enode URLs for nodes to permissions
for ($i = 0; $i -lt $enodes.Length; $i++) {   
    $rcpNumber = $rpcDefault + $i;
    $uri = "http://127.0.0.1:" + $rcpNumber;
    Start-Sleep 3; 
    Invoke-RestMethod -Uri $uri -Method Post -Body ($params | ConvertTo-Json);
}

# Add nodes as peers
for ($i = 0; $i -lt $enodes.Length; $i++) {

    $addPeerParam = @{
        "jsonrpc" = "2.0";
        "method"  = "admin_addPeer";
        "params"  = @($enodes[$i]);
        "id"      = 1;    
    } ;
    
    for ($j = $i + 1; $j -lt $enodes.Length; $j++) {
        $rcpNumber = $rpcDefault + $j;
        $uri = "http://127.0.0.1:" + $rcpNumber;
        Start-Sleep 3; 
        Invoke-RestMethod -Uri $uri -Method Post -Body ($addPeerParam | ConvertTo-Json);  
    }
}

Write-Output "Fin del proceso";

