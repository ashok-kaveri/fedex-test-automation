import { setWorldConstructor } from '@cucumber/cucumber';

class CustomWorld {
    orderId: string;
    constructor() {
        this.orderId = "";
    }

    setOrderId(orderId: string) {
        this.orderId = orderId;
    }

    getOrderId(): string {
        return this.orderId;
    }
}

setWorldConstructor(CustomWorld);
