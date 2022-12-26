workDir=$(pwd)
networkNodes="networkNodes"
EnodeParams="Enodes.params"
UrlsParams="Urls.params"
contractsBuild="$workDir/build"
numNodes=$1
nodePrefix=$2
p2pDefault=$3
rpcDefault=$4
gateWay=$5
nodesOfNetwork=()
enodes=()

if [[ -d "$networkNodes" ]]; then
    rm -r "$networkNodes"
fi

if [[ -d "$contractsBuild" ]]; then
    rm -r "$contractsBuild"
fi

if [[ -f "$EnodeParams" ]]; then
    rm "$EnodeParams"
fi

if [[ -f "$UrlsParams" ]]; then
    rm "$UrlsParams"
fi

docker compose -f "$workDir/initial-besu.yaml" down
docker compose -f "$workDir/networkPostProcess/post-proces-docker-compose.yaml" down
docker compose -f "$workDir/DemoMvmTruffle_Fork/truffle-docker-compose.yaml" down
docker compose -f "$workDir/DemoEnergiaMVMFrontFork/frontend-docker-compose.yaml" down
docker compose -f "$workDir/set-network-docker-compose.yaml" down

if [[ -z "$numNodes" ]]; then
    declare numNodes=4
fi

if [[ -z "$nodePrefix" ]]; then
    declare nodePrefix="Node"
fi

if [[ -z "$p2pDefault" ]]; then
    declare p2pDefault=30000
fi

if [[ -z "$rcpDefault" ]]; then
    declare rpcDefault=8540
fi

if [[ -z "$gateWay" ]]; then
    declare gateWay="172.21.0.1"
fi

mkdir "$workDir/$networkNodes"
for ((i = 0; i < "$numNodes"; i++)); do
    nodeName="$nodePrefix$(($i + 1))"
    nodePath="$workDir/$networkNodes/$nodeName"
    mkdir "$nodePath"
    mkdir "$nodePath/data"

    cp "$workDir/config.toml" "$nodePath"
    cp "$workDir/permissions_config.toml" "$nodePath/data"

    p2pNumber="$(($p2pDefault + $i))"
    rcpNumber="$(($rpcDefault + $i))"

    p2pPort="p2p-port=$p2pNumber"
    rpchttpport="rpc-http-port=$rcpNumber"

    configFileName="$workDir/$networkNodes/$nodeName/config.toml"
    sed -i "s/p2p-port=P2PDEFAULT/$p2pPort/g" $configFileName
    sed -i "s/rpc-http-port=RCPDEFAULT/$rpchttpport/g" $configFileName

    nodesOfNetwork+=("$nodeName")
    echo "Nodo $nodeName creado con exito"
done

networkFiles="$workDir/besu-config/networkFiles"
if [[ -d "$networkFiles" ]]; then
    rm -r "$networkFiles"
fi

docker compose -f "$workDir/initial-besu.yaml" up -d

while ! [[ -d "$networkFiles" ]]; do
    echo "Esperando a que se generen los archivos de configuracion"
    sleep 5
done

docker compose -f "./initial-besu.yaml" down
keysDirs=$(ls "$networkFiles/keys")
counter=0
touch "$workDir/$EnodeParams"
touch "$workDir/$UrlsParams"

for keyDir in $keysDirs; do
    nodePath="${nodesOfNetwork[counter]}"

    cp "$networkFiles/genesis.json" "$workDir/$networkNodes/$nodePath"
    cp "$networkFiles/keys/$keyDir/key" "$workDir/$networkNodes/$nodePath/data"
    cp "$networkFiles/keys/$keyDir/key.pub" "$workDir/$networkNodes/$nodePath/data"

    p2pNumber="$(($p2pDefault + $counter))"
    rcpNumber="$(($rpcDefault + $counter))"
    uri="http://node$(($counter + 1)):$rcpNumber"
    endIp="0.$(($counter + 2))"
    nodeIp="${gateWay/0.1/$endIp}"
    privateKey=$(cat $workDir/$networkNodes/$nodePath/data/key.pub)
    enodes+=("enode://${privateKey:2}@$nodeIp:$p2pNumber")

    echo "${enodes[counter]}" >>"$workDir/$EnodeParams"
    echo "$uri" >>"$workDir/$UrlsParams"
    echo "${enodes[counter]}"
    let "counter=counter+1"
done

docker compose -f "$workDir/set-network-docker-compose.yaml" up -d

if [[ "$(docker images -q networkpostprocess:v1 2>/dev/null)" == "" ]]; then
    docker compose -f "$workDir/networkPostProcess/post-proces-docker-compose.yaml" build
fi

docker compose -f "$workDir/networkPostProcess/post-proces-docker-compose.yaml" up -d

if [[ "$(docker images -q truffle:v1 2>/dev/null)" == "" ]]; then
    docker compose -f "$workDir/DemoMvmTruffle_Fork/truffle-docker-compose.yaml" build
fi

docker compose -f "$workDir/DemoMvmTruffle_Fork/truffle-docker-compose.yaml" up -d

while ! [[ -d "$contractsBuild/contracts" ]]; do
    echo "Esperando a que se compilen los contratos"
    sleep 5
done

cp -rf "$contractsBuild" "$workdir/DemoEnergiaMVMFrontFork/build"

# if [[ "$(docker images -q demomvm:v1 2>/dev/null)" == "" ]]; then
#     docker compose -f "$workDir/DemoEnergiaMVMFrontFork/frontend-docker-compose.yaml" build
# fi
# docker compose -f "$workDir/DemoEnergiaMVMFrontFork/frontend-docker-compose.yaml" up -d

echo "Fin de configuracion"
