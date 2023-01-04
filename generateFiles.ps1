$workDir = Get-Location;
$networkNodes = "networkNodes";
$EnodeParams = "Enodes.params"
$UrlsParams = "Urls.params";
$contractsBuild = "build";
$networkFiles = "./besu-config/networkFiles";
$certs = "certs";
$numNodes = $args[0];
$nodePrefix = $args[1];
$p2pDefault = [int]$args[2];
$rpcDefault = [int]$args[3];
$gateWay = $args[4];
$nodesOfNetwork = @();
$enodes = @();

if (Test-Path -Path $networkNodes) {
    Remove-Item  $networkNodes -Recurse -Force;
}

if (Test-Path -Path $workDir/$certs) {
    Remove-Item $workDir/$certs -Recurse -Force;
}

if (Test-Path -Path $workDir/$contractsBuild) {
    Remove-Item -Recurse -Force $workDir/$contractsBuild;
}

if (Test-Path -Path $EnodeParams) {
    Remove-Item  $EnodeParams -Recurse -Force;
}

if (Test-Path -Path $UrlsParams) {
    Remove-Item  $UrlsParams -Recurse -Force;
}

if (Test-Path -Path $networkFiles) {
    Remove-Item  $networkFiles -Recurse -Force
}

docker compose -f "./initial-besu.yaml" down;
docker compose -f "./networkPostProcess/post-proces-docker-compose.yaml" down
docker compose -f "./DemoMvmTruffle_Fork/truffle-docker-compose.yaml" down
docker compose -f "./DemoEnergiaMVMFrontFork/frontend-docker-compose.yaml" down
docker compose -f "./set-network-docker-compose.yaml" down

$existsImage = docker images -q demomvm:v1
if (-not($null -eq $existsImage)) {
    docker rmi --force demomvm:v1
}

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

$nodeProperties = [ordered]@{
    image          = "hyperledger/besu:22.10.0-RC2"
    container_name = ""
    user           = "root" 
    volumes        = @()
    ports          = @()
    networks       = $null
    entrypoint     = @("/bin/bash", "-c");
}

$network = [pscustomobject] @{
    rpc = [pscustomobject] @{
        driver = "bridge"
        ipam   = [pscustomobject] @{
            driver = "default"
            config = @([pscustomobject] @{
                    subnet  = "172.21.0.0/16"
                    gateway = $gateWay
                })
        }
    }
};   

$networkTemplate = [pscustomobject] @{
    version  = "3"
    services = New-Object -TypeName PSCustomObject
    networks = $network
};

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
    $p2pPort = [string]$p2pNumber + ":" + [string]$p2pDefault;
    $rpchttpport = [string]$rcpNumber + ":" + [string]$rpcDefault;
    $nodeIp = $gateWay -replace "0.1", ("0." + ($i + 2));

    $nodeInstance = New-Object -TypeName PSCustomObject -Property $nodeProperties;
    $nodeInstance.container_name = $nodeName + "_lab";
    $nodeInstance.volumes += "./" + $networkNodes + "/" + $nodeName + "/:/opt/besu/" + $nodeName; 
    $nodeInstance.ports += $p2pPort;
    $nodeInstance.ports += $rpchttpport;
    $nodeInstance.networks = [pscustomobject] @{
        rpc = [pscustomobject] @{
            ipv4_address = $nodeIp
        }
    }

    $entrypoint = ("cd /opt/besu/" + $nodeName + "`nbesu --config-file=./config.toml`r") | ConvertTo-Yaml | ConvertFrom-Yaml;
    $nodeInstance.entrypoint += $entrypoint
    if ($i -gt 0) {
        $nodeInstance | Add-Member -MemberType NoteProperty -Name "depends_on" -Value @($nodesOfNetwork[0])
    }

    $networkTemplate.services | Add-Member -MemberType NoteProperty -Name $nodeName -Value $nodeInstance
    $message = "Nodo " + $nodeName + " creado con exito"
    Write-Output  $message;
    $nodesOfNetwork += $nodeName;
}

# $initialGenesis = Get-Content -Path $workDir/"initialGenesis.json" | ConvertFrom-Json;
# $initialGenesis.blockchain.nodes.count = $numNodes;
# $initialGenesis | ConvertTo-Json -Depth 3 | Out-File $workDir/"initialGenesis.json"
$networkTemplate | ConvertTo-Yaml | Out-File $workDir/"set-network-docker-compose.yaml"

docker compose -f "./initial-besu.yaml" up -d

$existNetworkFiles = Test-Path -Path $networkFiles
while (-Not ($existNetworkFiles)) {
    Write-Output "Esperando a que se generen los archivos de configuracion";
    Start-Sleep 5;
    $existNetworkFiles = Test-Path -Path $networkFiles;
    $keysDirs = Get-ChildItem $networkFiles/keys;
    if ($keysDirs.Length -eq 0) {
        docker compose -f "./initial-besu.yaml" down;
        Write-Error "No se generaron las llaves" -ErrorAction Stop;
    }
}

docker compose -f "./initial-besu.yaml" down;

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
    
    $p2pNumber = $p2pDefault;
    $rcpNumber = $rpcDefault;
    $uri = "http://node" + ($Counter + 1) + ":" + $rcpNumber;
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

docker compose -f "./set-network-docker-compose.yaml" up -d;

$existsImage = docker images -q networkpostprocess:v1;
if ( $null -eq $existsImage) {
    docker compose -f "./networkPostProcess/post-proces-docker-compose.yaml" build 
}

docker compose -f "./networkPostProcess/post-proces-docker-compose.yaml" up -d;
$postProcessStatus = docker ps -f "status=exited" --format "{{.Names}}";
while ($null -eq $postProcessStatus) {
    Write-Output "Esperando a que se sincronizen los nodos";
    Start-Sleep 5;
    $postProcessStatus = docker ps -f "status=exited";
}

Start-Sleep 5;
docker compose -f "./networkPostProcess/post-proces-docker-compose.yaml" down;

# $existsImage = docker images -q truffle:v1;
# if ( $null -eq $existsImage) {
#     docker compose -f "./DemoMvmTruffle_Fork/truffle-docker-compose.yaml" build;
# }
    
# docker compose -f "./DemoMvmTruffle_Fork/truffle-docker-compose.yaml" up -d 

# $prueba = docker logs truffle-container --tail 1;
# while (-not($prueba -eq "Im up")) {
#     Write-Output "Esperando a que se generen los archivos de configuracion";
#     Start-Sleep 5;
#     $prueba = docker logs truffle-container --tail 1;
# }

# Copy-Item -Recurse -Force -Path $workDir/$contractsBuild $workDir/"DemoEnergiaMVMFrontFork";
    
# docker compose -f "./DemoEnergiaMVMFrontFork/frontend-docker-compose.yaml" build;
# docker compose -f "./DemoEnergiaMVMFrontFork/frontend-docker-compose.yaml" up -d;
Write-Output "Fin del proceso";

