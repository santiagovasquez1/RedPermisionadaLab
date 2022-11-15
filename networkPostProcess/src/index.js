const axios = require('axios');
const fs = require('fs');


const addNodesToNetwork = async(enodes, urls) => {
    const data = {
        "jsonrpc": "2.0",
        "method": "perm_addNodesToAllowlist",
        "params": [
            enodes
        ],
        "id": 1,
    };


    let addNodesPromises = [];

    for (let i = 0; i < urls.length - 1; i++) {
        let url = urls[i];
        addNodesPromises.push(
            axios({
                method: 'post',
                url,
                data
            })
        );
    }

    const responses = await Promise.all(addNodesPromises);
    return responses;
}

const adminAddPeer = async(enodes, urls) => {
    let adminAddPeerPromises = [];
    for (let i = 0; i < urls.length - 1; i++) {
        let data = {
            "jsonrpc": "2.0",
            "method": "admin_addPeer",
            "params": [
                enodes[i]
            ],
            "id": 1,
        };
        for (let j = i + 1; j < urls.length - 1; j++) {
            let url = urls[j];
            adminAddPeerPromises.push(
                axios({
                    method: 'post',
                    url,
                    data
                })
            );
        }
    }
    const responses = await Promise.all(adminAddPeerPromises);
    return responses;
}

const main = async() => {
    setTimeout(async() => {
        if (!fs.existsSync("Enodes.params") || !fs.existsSync("Urls.params")) {
            console.log("Los archivos no existen");
            await main();
        } else {
            try {
                const urls = fs.readFileSync('Urls.params', 'utf-8').split('\r\n');
                const enodesTemp = fs.readFileSync('Enodes.params', 'utf-8').split('\r\n');
                const enodes = enodesTemp.slice(0, enodesTemp.length - 1);
                const responses1 = await addNodesToNetwork(enodes, urls);
                const responses2 = await adminAddPeer(enodes, urls);

                console.log(responses1.map(x => x.data))
                console.log(responses2.map(x => x.data))
                process.exit();
            } catch (error) {
                setTimeout(async() => {
                    await main();
                }, 5000);
            }

        }
    }, 2000);

}

main();