export type Block = {
    height: number;
    master_node: any;
    hash: string;
    previous_hash: string;
    validator_address: string;
    validator_signature: string;
    chain_ref_id: string;
    merkle_root: string;
    state_root: string;
    total_reward: number;
    total_amount: number;
    total_validators: number;
    version: number;
    size: number;
    craft_time: number;
    date_crafted: Date;
    transactions: any[];
    number_of_transactions: number;
}