import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { createHash } from 'crypto';
import axios, { AxiosResponse } from 'axios';
import { ethers } from "ethers";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request.');
    const { nombre, correo, nit } = req.body;
    const stringForHash = nombre + correo + nit;
    const privateKey: string = '0x' + createHash('sha256').update(stringForHash).digest('hex');
    const wallet = new ethers.Wallet(privateKey);

    const url = 'http://127.0.0.1:8540';
    const adress = wallet.address;

    try {
        let response = await registrarCuenta(adress, url);
        console.log(response.data);
        context.res = {
            status: 200,
            body: {
                privateKey: privateKey,
                address: wallet.address,
            }
        };
    } catch (error) {
        console.log(error);
        context.res = {
            status: 500,
            body: {
                message: error.message
            }
        }
    }
};

const registrarCuenta = (address: string, url: string): Promise<AxiosResponse<any, any>> => {
    return axios({
        method: 'post',
        url,
        data: {
            jsonrpc: "2.0",
            method: "perm_addAccountsToAllowlist",
            params: [
                [
                    address
                ]
            ],
            id: 1
        },
        headers: {
            'Content-Type': 'application/json; charset=UTF-8'
        }
    });
}


export default httpTrigger;