/* eslint-disable @typescript-eslint/no-explicit-any */

import { Address } from "./types/address";
import { Block } from "./types/block";
import { PaginatedResponse } from "./types/paginated-response";



class ExplorerService {

    private get baseUrl() {
        return 'https://data.rbx.network/api';
    }

    private async getJson(path: string): Promise<any> {
        const url = `${this.baseUrl}${path[0] === "/" ? '' : '/'}${path}`;
        const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
        const body = await response.text();
        return JSON.parse(body);
    }

    public async blocks(limit = 10, page = 1): Promise<PaginatedResponse<Block>> {
        try {
            return await this.getJson(`/blocks?limit=${limit}&page=${page}`);
        } catch (e) {
            throw new Error(`Blocks error ${e}`);
        }
    }

    public async latestBlock(): Promise<Block> {
        const response = await this.blocks(1);
        return response.results[0];
    }

    public async getAddress(address: string): Promise<Address> {
        try {
            return await this.getJson(`/addresses/${address}`);
        } catch (e) {
            throw new Error(`Balance error ${e}`);
        }
    }

    public async getBalance(address: string): Promise<number> {
        try {
            const data = await this.getAddress(address);
            return data.balance;
        } catch (e) {
            return 0;
        }
    }


}


export default ExplorerService;