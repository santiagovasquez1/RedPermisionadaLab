$workDir = Get-Location;
$networkNodes = "networkNodes";
$EnodeParams = "Enodes.params"
$UrlsParams = "Urls.params";
$numNodes = $args[0];
$nodePrefix = $args[1];
$p2pDefault = [int]$args[2];
$rpcDefault = [int]$args[3];
$gateWay = $args[4];
$nodesOfNetwork = @();
$enodes = @();

if (Test-Path -Path $networkNodes) {
    Remove-Item  $networkNodes -Recurse -Force
}

if (Test-Path -Path $EnodeParams) {
    Remove-Item  $EnodeParams -Recurse -Force
}

if (Test-Path -Path $UrlsParams) {
    Remove-Item  $UrlsParams -Recurse -Force
}


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
New-Item $EnodeParams
New-Item $UrlsParams
$enodeConcat = "";

for ($Counter = 0; $Counter -lt $keysDirs.Length; $Counter++) {
    $keyDir = $keysDirs[$Counter];
    $nodePath = $nodesOfNetwork[$Counter]
    Copy-Item $networkFiles/keys/$keyDir/key ./$networkNodes/$nodePath/data
    Copy-Item $networkFiles/keys/$keyDir/key.pub ./$networkNodes/$nodePath/data
    Copy-Item $networkFiles/genesis.json ./$networkNodes/$nodePath
    
    $p2pNumber = $p2pDefault + $Counter;
    $rcpNumber = $rpcDefault + $Counter;
    $uri = "http://node" + ($Counter + 1) + ":" + $rcpNumber;
    # $uri = "http://127.0.0.1:" + $rcpNumber;
    $nodeIp = $gateWay -replace "0.1", ("0." + ($Counter + 2));
    $enodes += "enode://" + (Get-Content ./$networkNodes/$nodePath/data/key.pub).Substring(2) + "@" + $nodeIp + ":" + $p2pNumber;
    
    if ($Counter -lt $keysDirs.Length - 1) {
        $enodeConcat = $enodeConcat + $enodes[$Counter] + ","
    }
    else {
        $enodeConcat = $enodeConcat + $enodes[$Counter]
    }

    Add-Content ./$EnodeParams -Value $enodes[$Counter]
    Add-Content ./$UrlsParams -Value $uri
    Write-Output $enodes[$Counter];
}

docker compose build --no-cache
docker compose up -d

# docker exec -i -e AzureWebJobsStorage="DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://host.docker.internal:10000/devstoreaccount1;TableEndpoint=http://host.docker.internal:10002/devstoreaccount1;QueueEndpoint=http://host.docker.internal:10001/devstoreaccount1" -w "/home/site/wwwroot/bin" registrocuentas-container sh -c ""func" host start --no-build --port 8080 | tee /dev/console"
Write-Output "Fin del proceso";

