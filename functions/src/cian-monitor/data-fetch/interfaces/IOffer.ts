export interface IOfferPhoto {
    img: string;
}

export interface IOffer {
    id: number;
    added: string;
    fullUrl: string;
    photos: string[];
    price: number;
    agentFee: number;
    deposit: number;
    underground?: string;
    roomsCount: number;
    phone: string;
}

export interface ICianOfferValue {
    id: number;
    added: {strict: string};
    photos: IOfferPhoto[];
    link: string;
    phone: string;
    price: {rur: number};
    agent_fee: number;
    deposit: number;
    rooms_count: number;
    underground: [{
        name: string;
    }];
}
